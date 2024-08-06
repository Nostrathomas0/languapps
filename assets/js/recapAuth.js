async function verifyRecaptcha(token) {
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

async function verifyRecaptchaAndSignup(email, password, recaptchaToken) {
    try {
        const response = await fetch('https://us-central1-languapps.cloudfunctions.net/app/verifyRecaptchaAndSignup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: recaptchaToken, email: email, password: password })
        });
        const data = await response.json();
        if (data.success) {
            console.log('reCAPTCHA verified successfully');
        } else {
            console.error('reCAPTCHA verification failed:', data.message, data.errorCodes);
            throw new Error('reCAPTCHA verification failed');
        }
    } catch (error) {
        console.error('Error during sign up:', error);
        alert('Sign-up failed: ' + error.message);
    }
}

export { verifyRecaptcha, verifyRecaptchaAndSignup };
