// assets/js/firebaseAuth.js
import { generateRecaptchaToken } from './recapAuth.js';
import { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut } from './firebaseInit.js';

// Function to set the JWT token as a cookie
function setAuthToken(token) {
  const cookieName = 'authToken';
  const maxAge = 3600; // 1 hour in seconds, adjust as needed
  document.cookie = `${cookieName}=${token}; max-age=${maxAge}; path=/; secure; samesite=strict`;
}

// Utility function to clear the JWT token from cookies and localStorage
function clearAuthToken() {
  document.cookie = `jwtToken=; max-age=0; path=/; domain=.languapps.com; secure; samesite=none;`;
  localStorage.removeItem('jwtToken');
  console.log("JWT token cleared from cookie and localStorage");
}

// Monitor authentication state changes
onAuthStateChanged(auth, async (user) => {
  console.log('Auth state changed:', user);

  if (user) {
    try {
      const token = await user.getIdToken();

      // Set the auth token cookie
      document.cookie = `jwtToken=${data.jwtToken}; max-age=3600; path=/; domain=.languapps.com; secure; samesite=none`;
      console.log("JWT token from response:", data.jwtToken);
      console.log("Document cookie after setting:", document.cookie);
      setAuthToken(idToken);

      // Redirect to subdomain if already on it
      if (window.location.hostname === 'labase.languapps.com') {
        window.location.href = `https://labase.languapps.com/?authToken=${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
  } else {
    // Clear the auth token cookie
    clearAuthToken;


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
    console.log("Initiating sign-up process for:", email);

    // Step 1: Generate the reCAPTCHA token on the frontend
    const recaptchaToken = await generateRecaptchaToken('signup');
    console.log('Generated reCAPTCHA token:', recaptchaToken);

    // Step 2: Prepare the request body with the recaptchaToken, email, and password
    const requestBody = { token: recaptchaToken, email, password };
    console.log("Request body for sign-up:", requestBody);

    // Step 3: Send the data to the backend for verification and user creation
    const response = await fetch('https://us-central1-languapps.cloudfunctions.net/app/verifyRecaptchaAndSignup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    console.log("Fetch response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fetch response not ok:", errorText);
      throw new Error("Server responded with an error");
    }

    // Step 4: Parse the response from the backend
    let data;
    try {
      data = await response.json();
      console.log("Parsed response from server:", data);
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid server response");
    }
      // **Enhanced Logging**
      console.log("data.success:", data.success, "type:", typeof data.success);
      console.log("data.jwtToken:", data.jwtToken, "type:", typeof data.jwtToken);
  

    // Step 5: Handle the backend response
    if (data.success === true && typeof data.jwtToken === 'string' && data.jwtToken.trim() !== '') {
      console.log("Entering if condition: data.success === true && typeof data.jwtToken === 'string' && jwtToken is not empty");

      try {
        setBackendAuthToken(data.jwtToken);
        console.log("Backend JWT token set successfully");
      } catch (tokenError) {
        console.error("Error setting backend JWT token:", tokenError);
        throw new Error("Failed to set backend JWT token");
      }

      try {
        transitionModalStep('step1', 'step2'); 
        console.log("Transitioned to step2 successfully");
      } catch (transitionError) {
        console.error("Error during modal transition:", transitionError);
        throw new Error("Failed to transition modal");
      }

      // Ensure the function exits here to prevent further execution
      return;
    } else {
      console.log("Entering else condition: data.success !== true || typeof data.jwtToken !== 'string' || jwtToken is empty");
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
     // Get Firebase ID token
     const idToken = await userCredential.user.getIdToken();
     setAuthToken(idToken);
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
