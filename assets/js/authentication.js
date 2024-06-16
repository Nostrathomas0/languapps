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
            // Set token in cookie with HttpOnly and Secure flags
            document.cookie = `authToken=${token};max-age=3600;path=/;domain=.languapps.com;Secure;HttpOnly`;
            // Optionally redirect to subdomain if needed
            window.location.href = 'https://labase.languapps.com';
        });
    } else {
        // No user is signed in. Clear the cookie.
        document.cookie = "authToken=; max-age=0; path=/; domain=.languapps.com; Secure; HttpOnly";
        // Optionally handle logout redirect
        window.location.href = "https://maindomain.com/login";
    }
});
// // Function to handle user sign-up
function signUp(email, password) {
    return new Promise((resolve, reject) => {
        createUserWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                const user = userCredential.user;
                console.log('User account created, sending verification email...');
                sendVerificationEmail(user)
                    .then(() => {
                        console.log('Verification email sent.');
                        resolve(user);  // Pass the user object to resolve for further use
                    }) 
                    .catch(error => {
                        console.error('Failed to send verification email:', error);
                        reject(error);
                    });
            })
            .catch(error => {
                console.error('Error during sign up:', error);
                reject(error);
            });
    });
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