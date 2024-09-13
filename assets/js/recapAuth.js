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

        const token = await grecaptcha.enterprise.execute('6LcewCcqAAAAAJvJ_Oti9lFKy_MaxcUHTmt8rDFE', { action: 'signup' });
        console.log("Generated reCAPTCHA token:", token);
        return token;
    } catch (error) {
        console.error("Error generating reCAPTCHA token:", error);
        throw new Error('Failed to generate reCAPTCHA token');
    }
}