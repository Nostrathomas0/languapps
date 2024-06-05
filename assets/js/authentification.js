// Authentification.js

// Sign-in, sign-up, and other auth functions
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, FacebookAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from './firebaseInit.js';

window.onClick = onClick;

// Function to handle onClick event, initiate reCAPTCHA, and verify it
async function onClick(e) {
    e.preventDefault();
    grecaptcha.enterprise.ready(async () => {
        const token = await grecaptcha.enterprise.execute('6Ld47LUpAAAAAAMmTEQDe3QTuq_nb-EdtMIPwINs', {action: 'LOGIN'});
        verifyRecaptcha(token);
    });
    
}

function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            const user = userCredential.user;
            if (!user.emailVerified) {
                throw new Error('Email not verified.');
            }
            return user;  // Return user for further processing
        });
}

// Function to verify reCAPTCHA token with the backend
function verifyRecaptcha(token) {
    fetch('https://us-central1-languapps.cloudfunctions.net/verifyRecaptcha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('reCAPTCHA verified successfully');
            // Proceed with sign-in or other logic here
        } else {
            console.error('reCAPTCHA verification failed:', data.message);
        }
    })
    .catch(error => {
        console.error('Error calling the verifyRecaptcha function:', error);
    });
}
// Function to send a verification email
function sendVerificationEmail(user) {
    return sendEmailVerification(user)
        .then(() => {
            console.log('Verification email sent.');
        })
        .catch(error => {
            console.error('Failed to send verification email:', error);
        });
}

// Function to handle user sign-up
function signUp(email) {
    const temporaryPassword = "Languapps123";
    return new Promise((resolve, reject) => {
        createUserWithEmailAndPassword(auth, email, temporaryPassword)
            .then(userCredential => {
                const user = userCredential.user;
                console.log('User created, attempting to send verification email...');
                sendVerificationEmail(user)
                    .then(() => {
                        console.log('Verification email sent.');
                        // Inform User to check their email
                        resolve(user);
                    }) 
                    .catch(error => {
                        console.error('Error during sign-up or email sending:', error);
                        reject(error);
                    });
            })
            .catch(error => {
                console.error('Error during sign up', error);
                reject(error);
            });
    });
}


// Function for signing in with Facebook
function signInWithFacebook() {
    const provider = new FacebookAuthProvider();
    signInWithPopup(auth, provider)
        .then(result => {
            console.log('Facebook sign-in successful.');
        })
        .catch(error => {
            console.error('Error during Facebook sign-in:', error);
        });
}


  window.fbAsyncInit = function() {
    FB.init({
      appId      : '{your-app-id}',
      cookie     : true,
      xfbml      : true,
      version    : '{api-version}'
    });
      
    FB.AppEvents.logPageView();   
      
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in');
    } else {
        console.log('User is signed out');
    }
});

// Export the functions to use in other modules
export { signUp, signIn, signInWithFacebook, onClick };

