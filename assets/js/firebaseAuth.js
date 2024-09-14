// assets/js/firebaseAuth.js
import { generateRecaptchaToken } from './recapAuth.js';
import { auth, sendEmailVerification, onAuthStateChanged, signOut as firebaseSignOut } from './firebaseInit.js';

console.log('sendEmailVerification imported correctly:', sendEmailVerification);

function setAuthTokenCookie(token) {
  const domain = window.location.hostname.endsWith('.languapps.com') ? '.languapps.com' : window.location.hostname;
  document.cookie = `authToken=${token}; max-age=3600; path=/; domain=${domain}; secure; samesite=none; httponly`;
  console.log('Auth token set:', token);
}

// Monitor authentication state changes
onAuthStateChanged(auth, user => {
  console.log('Auth state changed:', user);
  if (user) {
    user.getIdToken().then(token => {
      setAuthTokenCookie(token);
      if (window.location.hostname === 'labase.languapps.com') {
        window.location.href = `https://labase.languapps.com/?authToken=${token}`;
      }
    }).catch(error => {
      console.error('Error getting token:', error);
    });
  } else {
    document.cookie = "authToken=; max-age=0; path=/; domain=.languapps.com; secure; samesite=none; httponly";
    if (window.location.hostname === 'labase.languapps.com') {
      window.location.href = "https://languapps.com/?auth-modal";
    }
  }
});


async function signUp(email, password) {
  try {
    // Step 1: Generate the reCAPTCHA token inside the function
    const recaptchaToken = await generateRecaptchaToken('signup');
    console.log('Generated reCAPTCHA token:', recaptchaToken);

    // Step 2: Prepare data to send to the backend Cloud Function
    const requestBody = { token: recaptchaToken, email, password };

    // Step 3: Call the backend Cloud Function to verify reCAPTCHA and sign up the user
    const response = await fetch('https://us-central1-languapps.cloudfunctions.net/app/verifyRecaptchaAndSignup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // Step 4: Parse the response from the backend
    const data = await response.json();
    console.log("Response data from server:", data);

    // Step 5: Check if the backend verification was successful
    if (data.success) {
      console.log('Sign-up and reCAPTCHA verification successful');

      // Step 6: Create user in Firebase using the backend response (if needed)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', userCredential.user);

      // Step 7: Send the email verification
      await sendVerificationEmail(userCredential.user);
      console.log("Verification email sent. Please verify your email before continuing");

      // Step 8: Transition the UI to the next step
      transitionModalStep('step1', 'step2');
    } else {
      // If the response is unsuccessful, handle the error
      throw new Error(data.message || 'reCAPTCHA verification failed');
    }
  } catch (error) {
    // Catch any errors that occur during the process
    console.error('Sign-up error:', error);
    alert('Sign-up failed: ' + error.message);  // Notify the user of the failure
  }
}


async function sendVerificationEmail(user) {
  try {
    await sendEmailVerification(user);
    console.log('Verification email sent.');
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
}

async function sendPasswordResetEmail(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    console.log('Password reset email sent.');
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
}

async function handleSignOut() {
  try {
    await firebaseSignOut(auth);
    console.log('User signed out.');
    alert('Signed out successfully.');
    window.location.href = "https://languapps.com";
  } catch (error) {
    console.error('Error during sign out:', error);
    alert('Sign-out failed: ' + error.message);
  }
}

// Function to send the JWT token to the Lambda function
async function sendJWTToLambda(jwtToken) {
  try {
    const lambdaResponse = await fetch("https://jjvdfnsx2ii5qf4nblmpyzysju0kfobg.lambda-url.us-east-1.on.aws/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: jwtToken }),
    });

    if (!lambdaResponse.ok) {
      throw new Error("Error sending JWT token to Lambda function");
    }

    const data = await lambdaResponse.json();
    console.log('Lambda function response:', data);
  } catch (error) {
    console.error('Error sending JWT token to Lambda function:', error);
  }
}

export { signUp, signIn, sendPasswordResetEmail, handleSignOut };
