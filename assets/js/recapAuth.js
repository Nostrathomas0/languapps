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
        console.error('Error generating reCAPTCHA token:', error);
        return null;
    }
}


// Function to verify reCAPTCHA and sign up a user
export async function verifyRecaptchaAndSignup(email, password) {
    try {
        const recaptchaToken = await generateRecaptchaToken('signup');
        if (!recaptchaToken) {
            throw new Error('Failed to generate reCAPTCHA token');
        }
        // Log the expected action
        console.log("Sending reCAPTCHA token to server:", recaptchaToken);  // Log before sending to server

        // Send the token to the server for verification
        const response = await fetch('https://us-central1-languapps.cloudfunctions.net/app/verifyRecaptchaAndSignup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: recaptchaToken, email: email, password: password })
        });
        const data = await response.json();
        if (data.success) {
            console.log('Sign-up and reCAPTCHA verification successful');
        } else {
            console.error('reCAPTCHA verification failed:', data.message, data.errorCodes);
            throw new Error('reCAPTCHA verification failed');
        }
    } catch (error) {
        console.error('Error during sign up:', error);
        alert('Sign-up failed: ' + error.message);
    }
}
