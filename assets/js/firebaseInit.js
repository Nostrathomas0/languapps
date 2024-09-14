// Import the Firebase modules needed
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js'; // Import getFirestore
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendEmailVerification, signOut } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js'
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


const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);

console.log('Firestore initialized:', db);
console.log('sendEmailVerification from Firebase initialized:', sendEmailVerification);

// Exporting necessary variables and functions for use in other modules
export { app, db, auth, onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signOut  };