import { 
    createUserWithEmailAndPassword, 
    sendEmailVerification, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from './firebaseInit.js';

function setAuthTokenCookie(token) {
    document.cookie = `authToken=${token}; max-age=3600; path=/; domain=.languapps.com; secure; samesite=none; httponly`;
    console.log('Auth token set:', token);
}

onAuthStateChanged(auth, user => {
    console.log('Auth state changed:', user);
    if (user) {
        user.getIdToken().then(token => {
            setAuthTokenCookie(token);
            if (window.location.hostname === 'labase.languapps.com') {
                window.location.href = `https://labase.languapps.com/?authToken=${token}`;
            }
        }).catch(error => {
            console.error('Error getting token:', error);
        });
    } else {
        document.cookie = "authToken=; max-age=0; path=/; domain=.languapps.com; secure; samesite=none; httponly";
        if (window.location.hostname === 'labase.languapps.com') {
            window.location.href = "https://languapps.com/?auth-modal";
        }
    }
});

async function verifyRecaptcha(token) {
    try {
        console.log("reCAPTCHA token:", token);
        const response = await fetch('https://us-central1-languapps.cloudfunctions.net/app/verifyRecaptcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await response.json();
        if (data.success) {
            console.log('reCAPTCHA verified successfully');
            return true;
        } else {
            console.error('reCAPTCHA verification failed:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        return false;
    }
}

async function verifyRecaptchaAndSignup(email, password, recaptchaToken) {
    try {
        const response = await fetch('https://us-central1-languapps.cloudfunctions.net/app/verifyRecaptchaAndSignup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: recaptchaToken, email: email, password: password })
        });
        const data = await response.json();
        if (data.success) {
            console.log('reCAPTCHA verified successfully');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('User created:', userCredential.user);
            await sendVerificationEmail(userCredential.user);
        } else {
            console.error('reCAPTCHA verification failed:', data.message, data.errorCodes);
            throw new Error('reCAPTCHA verification failed');
        }
    } catch (error) {
        console.error('Error during sign up:', error);
        alert('Sign-up failed: ' + error.message);
    }
}

async function signUp(email, password, recaptchaToken) {
    try {
        const response = await fetch('https://us-central1-languapps.cloudfunctions.net/app/verifyRecaptchaAndSignup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, token: recaptchaToken })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Sign-up failed');
        }

        console.log('Sign-up successful:', data);
        alert('Sign-up successful! Verification email sent.');
        transitionModalStep('step1', 'step2');
    } catch (error) {
        console.error('Sign-up error:', error);
        throw error;
    }
}

async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
            throw new Error('Email not verified.');
        }
        console.log("User signed in:", userCredential.user);
        const token = await userCredential.user.getIdToken();
        document.cookie = `authToken=${token}; max-age=3600; path=/; domain=.languapps.com; secure; samesite=none; httponly`;
        window.location.href = "https://labase.languapps.com";
    } catch (error) {
        console.error("Error signing in:", error);
        alert('Sign-in failed: ' + error.message);
    }
}

async function sendVerificationEmail(user) {
    try {
        await sendEmailVerification(user);
        console.log('Verification email sent.');
    } catch (error) {
        console.error('Failed to send verification email:', error);
    }
}

async function sendPasswordResetEmail(email) {
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        console.log('Password reset email sent.');
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
}

async function handleSignOut() {
    try {
        await firebaseSignOut(auth);
        console.log('User signed out.');
        alert('Signed out successfully.');
        window.location.href = "https://languapps.com";
    } catch (error) {
        console.error('Error during sign out:', error);
        alert('Sign-out failed: ' + error.message);
    }
}

function setupEventListeners() {
    document.getElementById('signupForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = event.target.elements['signupEmail'].value;
        const password = event.target.elements['signupPassword'].value;
        grecaptcha.ready(async () => {
            const recaptchaToken = await grecaptcha.execute('6LdOYQAqAAAAAMBrtTJaJs-3_80gT9UWHG9E3-tk', { action: 'signup' });
            console.log('reCAPTCHA token:', recaptchaToken);
            try {
                await signUp(email, password, recaptchaToken);
            } catch (error) {
                console.error('Sign-up failed:', error);
                alert('Sign-up failed: ' + error.message);
            }
        });
    });

    document.getElementById('signinForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            await signIn(email, password);
            console.log('Sign-in successful.');
        } catch (error) {
            console.error('Sign-in failed:', error);
            alert('Sign-in failed: ' + error.message);
        }
    });

    const showPasswordButton = document.getElementById('showPassword');
    if (showPasswordButton) {
        showPasswordButton.addEventListener('click', () => {
            const passwordInput = document.getElementById('signupPassword');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                showPasswordButton.textContent = 'Hide Password';
            } else {
                passwordInput.type = 'password';
                showPasswordButton.textContent = 'Show Password';
            }
        });
    }

    const forgotPasswordButton = document.getElementById('forgotPasswordButton');
    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value;
            if (email) {
                try {
                    await sendPasswordResetEmail(email);
                    console.log('Password reset email sent.');
                } catch (error) {
                    console.error('Error sending password reset email:', error);
                }
            } else {
                console.error('No email provided for password reset.');
            }
        });
    }

    const signOutButton = document.getElementById('signOut');
    if (signOutButton) {
        signOutButton.addEventListener('click', handleSignOut);
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in.');
    } else {
        console.log('User is signed out.');
    }
});

document.addEventListener('DOMContentLoaded', setupEventListeners);

export { signUp, signIn, sendPasswordResetEmail, handleSignOut };

function transitionModalStep(currentStep, nextStep) {
    document.getElementById(currentStep).style.display = 'none';
    document.getElementById(nextStep).style.display = 'block';
}
