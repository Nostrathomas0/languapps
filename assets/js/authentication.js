import { 
    createUserWithEmailAndPassword, 
    sendEmailVerification, 
    signInWithEmailAndPassword, 
    FacebookAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged,
    signOut as firebaseSignOut // Correct import
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from './firebaseInit.js';

// Function to set the auth token cookie
function setAuthTokenCookie(token) {
    document.cookie = `authToken=${token}; max-age=3600; path=/; domain=.languapps.com; secure; samesite=none; httponly`;
    console.log('Auth token set:', token);
}

// Unified function to handle authentication state changes
onAuthStateChanged(auth, user => {
    console.log('Auth state changed:', user);
    if (user) {
        user.getIdToken().then(token => {
            setAuthTokenCookie(token);
            // Uncomment the following lines for redirection logic if needed
            if (window.location.hostname === 'labase.languapps.com') {
                window.location.href = `https://labase.languapps.com/?authToken=${token}`;
            }
        }).catch(error => {
            console.error('Error getting token:', error);
        });
    } else {
        // No user is signed in. Clear the cookie and redirect to the main domain
        document.cookie = "authToken=; max-age=0; path=/; domain=.languapps.com; secure; samesite=none; httponly";
        // Uncomment the following lines for redirection logic if needed
        // if (window.location.hostname === 'labase.languapps.com') {
        //     window.location.href = "https://languapps.com/?auth-modal";
        // }
    }
});

// Function to verify reCAPTCHA token with the backend
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

// Function to verify reCAPTCHA and sign up a user
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
            // Create the user account with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('User created:', userCredential.user);
            // Send verification email to the user
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

// Function to handle user sign-up
async function signUp(email, password, recaptchaToken) {
    try {
        const recaptchaVerified = await verifyRecaptchaAndSignup(email, password, recaptchaToken);
        if (!recaptchaVerified) {
            throw new Error('reCAPTCHA verification failed.');
        }
    } catch (error) {
        console.error('Error during sign up:', error);
        alert('Sign-up failed: ' + error.message);
    }
}

// Function to handle user sign-in
async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
            throw new Error('Email not verified.');
        }
        console.log("User signed in:", userCredential.user);
    } catch (error) {
        console.error("Error signing in:", error);
        alert('Sign-in failed: ' + error.message);
    }
}

// Function to send verification email
async function sendVerificationEmail(user) {
    try {
        await sendEmailVerification(user);
        console.log('Verification email sent.');
    } catch (error) {
        console.error('Failed to send verification email:', error);
    }
}

// Function to send password reset email
async function sendPasswordResetEmail(email) {
    try {
        await firebaseSendPasswordResetEmail(auth, email);
        console.log('Password reset email sent.');
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
}

// Function to handle Facebook sign-in
async function signInWithFacebook() {
    try {
        const provider = new FacebookAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log('Facebook sign-in successful:', result.user);
    } catch (error) {
        console.error('Error during Facebook sign-in:', error);
    }
}

// Function to handle user sign-out
async function handleSignOut() {
    try {
        await firebaseSignOut(auth);
        console.log('User signed out.');
        alert('Signed out successfully.');
    } catch (error) {
        console.error('Error during sign out:', error);
        alert('Sign-out failed: ' + error.message);
    }
}

// Function to set up event listeners
function setupEventListeners() {
    // Event listener for sign-up form
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

    // Event listener for sign-in form
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

    // Event listener for "Show Password" button
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

    // Event listener for "Forgot Password?" button
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

    // Event listener for sign-out button
    const signOutButton = document.getElementById('signOut');
    if (signOutButton) {
        signOutButton.addEventListener('click', handleSignOut);
    }
}

// Monitor authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in.');
    } else {
        console.log('User is signed out.');
    }
});

// Ensure all listeners are set up after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', setupEventListeners);

// Export functions if needed elsewhere
export { signUp, signIn, sendPasswordResetEmail, signInWithFacebook, handleSignOut };
