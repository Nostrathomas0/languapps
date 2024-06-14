// Import the Firebase modules needed
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'; // Import getFirestore
import { getAuth,  sendPasswordResetEmail, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA_bq5-hmAlNbK-2ZgHSFl0Iew4uphF_Eo",
    authDomain: "languapps.firebaseapp.com",
    projectId: "languapps",
    storageBucket: "languapps.appspot.com",
    messagingSenderId: "866735367707",
    appId: "1:866735367707:web:6154b4ab63fcab0272fabe",
    measurementId: "G-MCZY61SSMM"
};

// Initialize Firebase
function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
        .then(() => console.log('Password reset email sent successfully.'))
        .catch((error) => console.error('Failed to send password reset email:', error));
}
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
// Function to sign in a user
function signInUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => console.log("User signed in:", userCredential.user))
        .catch((error) => console.error("Error signing in:", error));
}

// Logging to check Firestore is initialized correctly
console.log('Firestore initialized:', db);

// Exporting necessary variables and functions for use in other modules
export { app, db, auth, resetPassword, signInUser };
