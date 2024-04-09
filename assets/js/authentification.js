import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
    const auth = getAuth();

function signUpAndSendVerification(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // Signed in
        const user = userCrential.user;

        // Send Verification Email
        sendEmailVerification(user)
            .then(() => {
                // Email verification sent
                // Redirect user
            });
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // Handle errors
        // Display message
    });
}