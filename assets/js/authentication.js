// authentication.js
import { 
    createUserWithEmailAndPassword, 
    sendEmailVerification, 
    signInWithEmailAndPassword, 
    FacebookAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from './firebaseInit.js';


// Unified function to handle authentication state changes
onAuthStateChanged(auth, user => {
    if (user) {
        user.getIdToken().then(token => {
            console.log('User token:', token); // Debug log
            // Set token in cookie with HttpOnly and Secure flags
            document.cookie = `authToken=${token};max-age=3600;path=/;domain=.languapps.com;Secure;HttpOnly`;
            console.log('Cookie set:', document.cookie); // Debug log
            // Redirect to the subdomain with the authToken
            window.location.href = `https://languapps.com/?authToken=${token}`;
        }).catch(error => {
            console.error('Error getting token:', error);
        });
    } else {
        console.log('No user signed in. Clearing cookies and redirecting to login.'); // Debug log

        // No user is signed in. Clear the cookie.
        document.cookie = "authToken=; max-age=0; path=/; domain=.languapps.com; Secure; HttpOnly";
        
        // Redirect to the main domain login page
        window.location.href = "https://languapps.com";
    }
});
// Function to verify reCAPTCHA token with the backend
async function verifyRecaptcha(token) {
    try {
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

// Function to handle user sign-up
async function signUp(email, password, recaptchaToken) {
    try {
        const recaptchaVerified = await verifyRecaptcha(recaptchaToken);
        if (!recaptchaVerified) {
            throw new Error('reCAPTCHA verification failed.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User account created, sending verification email...');
        await sendVerificationEmail(user);
        console.log('Verification email sent.');
        return user; // Return the user object for further use
    } catch (error) {
        console.error('Error during sign up:', error);
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
    } catch (error) {
        console.error("Error signing in:", error);
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
        await firebaseSendPasswordResetEmail(auth, email);
        console.log('Password reset email sent.');
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
}

// Facebook Authentication
async function signInWithFacebook() {
    try {
        const provider = new FacebookAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log('Facebook sign-in successful:', result.user);
    } catch (error) {
        console.error('Error during Facebook sign-in:', error);
    }
}

// Event Listeners
function setupEventListeners() {
    // Set up event listener for sign-up form
    document.getElementById('signupForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = event.target.elements['email'].value;
        const password = event.target.elements['password'].value;
        try {
            await signUp(email, password);
            console.log('Sign-up successful, please check your email to verify.');
        } catch (error) {
            console.error('Sign-up failed:', error);
        }
    });

    // Set up event listener for sign-in form
    document.getElementById('signinForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            await signIn(email, password);
            console.log('Sign-in successful.');
        } catch (error) {
            console.error('Sign-in failed:', error);
        }
    });

    // Set up event listener for "Forgot Password?" button
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
export { signUp, signIn, sendPasswordResetEmail, signInWithFacebook};