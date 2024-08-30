// assets/js/recapAuth.js

// Function to generate reCAPTCHA token
export async function generateRecaptchaToken(action) {
    try {
        console.log("Starting reCAPTCHA token generation...");
        
        await new Promise((resolve, reject) => {
            if (typeof grecaptcha === 'undefined' || !grecaptcha.enterprise) {
                console.error('grecaptcha is not defined or not available in the environment.');
                return reject('grecaptcha is not available');
            }
            
            grecaptcha.enterprise.ready(() => {
                console.log("reCAPTCHA is ready");
                resolve();
            });
        });

        const token = await grecaptcha.enterprise.execute('6LcURSsqAAAAAIZic0fDErjGH0tF9s7MYpZ17uC0', { action: 'signup' });
        console.log("Generated reCAPTCHA token:", token);
        return token;
    } catch (error) {
        console.error("Error generating reCAPTCHA token:", error);
        throw new Error('Failed to generate reCAPTCHA token');
    }
}

// Function to verify reCAPTCHA and sign up a user
export async function verifyRecaptchaAndSignup(email, password) {
    try {
        // Generate reCAPTCHA token
        const recaptchaToken = await generateRecaptchaToken('signup');
        if (!recaptchaToken) {
            throw new Error('Failed to generate reCAPTCHA token');
        }
         // Log the expected action and full JSON packet
        const requestBody = { token: recaptchaToken, email: email, password: password };
        console.log("Sending the following data to the server:", JSON.stringify(requestBody, null, 2));
        // Log the expected action
        console.log("Sending reCAPTCHA token to server:", recaptchaToken);

        
        // Send the token to the server for verification
        const response = await fetch('https://us-central1-languapps.cloudfunctions.net/app/verifyRecaptchaAndSignup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: recaptchaToken, email: email, password: password })
        });

        const data = await response.json();

        if (data.success) {
            console.log('Sign-up and reCAPTCHA verification successful');

            // After successful server-side verification, sign up the user with Firebase
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Send the email verification
            await user.sendEmailVerification();
            console.log('Verification email sent to:', email);

            // Optional: Additional client-side logic, like redirecting the user or showing a confirmation message
            alert('Sign-up successful! A verification email has been sent to your inbox.');
        } else {
            console.error('reCAPTCHA verification failed:', data.message, data.errorCodes);
            throw new Error('reCAPTCHA verification failed');
        }
    } catch (error) {
        console.error('Error during sign up:', error);
        alert('Sign-up failed: ' + error.message);
    }
}
