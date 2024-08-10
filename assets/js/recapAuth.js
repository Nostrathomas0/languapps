// Function to load reCAPTCHA and generate the token
export async function generateRecaptchaToken(action) {
    try {
        // Ensure the reCAPTCHA API is ready
        await new Promise((resolve, reject) => {
            grecaptcha.ready(() => {
                resolve();
            });
        });

        // Generate the token
        const token = await grecaptcha.execute('6LdOYQAqAAAAAMBrtTJaJs-3_80gT9UWHG9E3-tk', { action });
        console.log("Generated reCAPTCHA token:", token);
        return token;
    } catch (error) {
        console.error('Error generating reCAPTCHA token:', error);
        return null;
    }
}

// Function to verify reCAPTCHA on the server
export async function verifyRecaptcha(token) {
    try {
        console.log("reCAPTCHA token:", token);
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

// Function to verify reCAPTCHA and sign up a user
export async function verifyRecaptchaAndSignup(email, password) {
    try {
        const recaptchaToken = await generateRecaptchaToken('signup');
        if (!recaptchaToken) {
            throw new Error('Failed to generate reCAPTCHA token');
        }

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
