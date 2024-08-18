// recapAuth.js

// Function to generate reCAPTCHA token
export async function generateRecaptchaToken(action) {
    try {
        await new Promise((resolve) => {
            grecaptcha.enterprise.ready(() => {
                resolve();
            });
        });

        const token = await grecaptcha.enterprise.execute('6LcewCcqAAAAAJvJ_Oti9lFKy_MaxcUHTmt8rDFE', { action: action });
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
