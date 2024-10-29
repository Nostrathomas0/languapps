// assets/js/firebaseAuth.js
import { generateRecaptchaToken } from './recapAuth.js';
import { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut } from './firebaseInit.js';



// Monitor authentication state changes
onAuthStateChanged(auth, async (user) => {
  console.log('Auth state changed:', user);

  if (user) {
    try {
      const token = await user.getIdToken();

      // Set the auth token cookie
      document.cookie = `jwtToken=${data.jwtToken}; max-age=3600; path=/; domain=.languapps.com; secure; samesite=none`;

      // Redirect to subdomain if already on it
      if (window.location.hostname === 'labase.languapps.com') {
        window.location.href = `https://labase.languapps.com/?authToken=${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
  } else {
    // Clear the auth token cookie
    document.cookie = "authToken=; max-age=0; path=/; domain=.languapps.com; secure; samesite=none";

    // Redirect to main domain if signed out
    if (window.location.hostname === 'labase.languapps.com') {
      window.location.href = "https://languapps.com/?auth-modal";
    }
  }
});


function transitionModalStep(currentStepId, nextStepId) {
  const currentStep = document.getElementById(currentStepId);
  const nextStep = document.getElementById(nextStepId);

  if (currentStep && nextStep) {
    currentStep.style.display = 'none'; // Hide the current step
    nextStep.style.display = 'block';   // Show the next step
    console.log(`Transitioned from ${currentStepId} to ${nextStepId}`);
  } else {
    console.error('Transition error: Step elements not found');
  }
}


async function signUp(email, password) {
  try {
    // Step 1: Generate the reCAPTCHA token on the frontend
    const recaptchaToken = await generateRecaptchaToken('signup');
    console.log('Generated reCAPTCHA token:', recaptchaToken);

    // Step 2: Prepare the request body with the recaptchaToken, email, and password
    const requestBody = { token: recaptchaToken, email, password };

    // Step 3: Send the data to the backend for verification and user creation
    const response = await fetch('https://us-central1-languapps.cloudfunctions.net/app/verifyRecaptchaAndSignup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // Step 4: Parse the response from the backend
    const data = await response.json();
    console.log("Response from server:", data);

    // Step 5: Handle the backend response
    if (data.success && data.jwtToken) {
      document.cookie = `authToken=${data.jwtToken}; max-age=3600; path=/; domain=.languapps.com; secure; samesite=none;`;
      console.log("JWT token saved to cookie");
      // Do something on success, like updating the UI or redirecting
      transitionModalStep('step1', 'step2'); // Example: transitioning to the next step in the UI
    } else {
      // Handle error from the backend response
      throw new Error(data.message || 'reCAPTCHA verification or sign-up failed');
    }
  } catch (error) {
    // Handle any errors that occur during the process
    console.error('Sign-up error:', error);
    alert('Sign-up failed: ' + error.message);
  }
}


// Ensure signIn is correctly defined in firebaseAuth.js
async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User signed in:", userCredential.user);
    // Further signIn logic here...
  } catch (error) {
    console.error("Error signing in:", error);
    alert('Sign-in failed: ' + error.message);
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
