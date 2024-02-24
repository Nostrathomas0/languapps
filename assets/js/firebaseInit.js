// Import the Firebase modules needed
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.db = db; // Assign Firestore instance to window.db
// Export the app instance for use in other modules
export { app };
