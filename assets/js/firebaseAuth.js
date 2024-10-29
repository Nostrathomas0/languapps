// assets/js/firebaseAuth.js
import { generateRecaptchaToken } from './recapAuth.js';
import { 
  auth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  createUserWithEmailAndPassword 
} from './firebaseInit.js';

// Utility function to set the Firebase ID token in both cookies and localStorage
function setFirebaseAuthToken(token) {
  const cookieName = 'firebaseJwtToken';
  const maxAge = 3600; // 1 hour in seconds, adjust as needed
  document.cookie = `${cookieName}=${token}; max-age=${maxAge}; path=/; domain=.languapps.com; secure; samesite=none;`;
  localStorage.setItem('firebaseJwtToken', token);
  console.log("Firebase JWT token saved to cookie and localStorage:", token);
}

// Utility function to clear the Firebase ID token from cookies and localStorage
function clearFirebaseAuthToken() {
  const cookieName = 'firebaseJwtToken';
  document.cookie = `${cookieName}=; max-age=0; path=/; domain=.languapps.com; secure; samesite=none;`;
  localStorage.removeItem('firebaseJwtToken');
  console.log("Firebase JWT token cleared from cookie and localStorage");
}

// Utility function to set the Backend JWT token in localStorage
function setBackendAuthToken(token) {
  localStorage.setItem('backendJwtToken', token);
  console.log("Backend JWT token saved to localStorage:", token);
}

// Utility function to clear the Backend JWT token from localStorage
function clearBackendAuthToken() {
  localStorage.removeItem('backendJwtToken');
  console.log("Backend JWT token cleared from localStorage");
}

// Monitor Firebase authentication state changes
onAuthStateChanged(auth, async (user) => {
  console.log('Firebase Auth state changed:', user);

  if (user) {
    try {
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      setFirebaseAuthToken(idToken);

      // Redirect to subdomain if already on it
      if (window.location.hostname === 'labase.languapps.com') {
        window.location.href = `https://labase.languapps.com/?authToken=${idToken}`;
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
  } else {
    // Clear Firebase auth token
    clearFirebaseAuthToken();

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

    // Debugging: Log individual properties
    console.log("data.success:", data.success, "data.jwtToken:", data.jwtToken);

    // Step 5: Handle the backend response
    if (data.success && data.jwtToken) {
      setBackendAuthToken(data.jwtToken);
      console.log("Backend JWT token saved to localStorage");

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

async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User signed in:", userCredential.user);

    // Get Firebase ID token
    const idToken = await userCredential.user.getIdToken();
    setFirebaseAuthToken(idToken);

    // Optionally, send the ID token to your backend to get a custom JWT
    /*
    const response = await fetch('https://your-backend.com/getCustomToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken }),
    });
    const data = await response.json();
    if (data.success && data.jwtToken) {
      setBackendAuthToken(data.jwtToken);
    }
    */

    // Redirect or update UI as needed
    // Example: transitionModalStep('loginStep', 'dashboardStep');
    console.log("Sign-in successful and tokens are set.");
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
    clearFirebaseAuthToken();
    clearBackendAuthToken();
    alert('Signed out successfully.');
    window.location.href = "https://languapps.com";
  } catch (error) {
    console.error('Error during sign out:', error);
    alert('Sign-out failed: ' + error.message);
  }
}

// Function to send the Backend JWT token to the Lambda function
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
