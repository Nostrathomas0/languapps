// assets/js/firebaseAuth.js
import { generateRecaptchaToken } from './recapAuth.js';
import { 
  auth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from './firebaseInit.js';
import { storeJwtInFirestore } from './firebaseUtils.js'

// Utility function to clear the JWT token from cookies and localStorage
function clearAuthToken() {
  document.cookie = `backendJwtToken=; max-age=0; path=/; domain=.languapps.com; secure; SameSite=None;`;
  console.log("JWT tokens cleared from cookies and localStorage");
}

// Function to set the Backend JWT token in localStorage and as a cookie
function setBackendAuthToken(token) {

    document.cookie = `backendJwtToken=${encodeURIComponent(token)}; max-age=3600; path=/; domain=.languapps.com; secure; SameSite=None`;
    console.log("Backend JWT token set as cookie for subdomains.");
}

// Monitor authentication state changes
// Monitor authentication state changes
onAuthStateChanged(auth, async (user) => {
  console.log('Auth state changed:', user);

  if (user) {
    try {
      // Get the JWT token from Firestore for the authenticated user
      const jwtToken = await getJwtFromFirestore(user.uid);
      if (jwtToken) {
        setBackendAuthToken(jwtToken); // Set the retrieved token as a cookie
        console.log("JWT token set as cookie successfully:", jwtToken);

        // Redirect to subdomain if necessary
        if (window.location.hostname === 'labase.languapps.com') {
          window.location.href = `https://labase.languapps.com/?authToken=${jwtToken}`;
        }
      } else {
        console.error("No JWT token found in Firestore for user:", user.uid);
      }
    } catch (error) {
      console.error('Error retrieving JWT token from Firestore:', error);
    }
  } else {
    // User is signed out: clear the auth token cookies
    clearAuthToken();

    // Redirect to the main domain if signed out
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
    const data = await response.json();
    console.log("Response from server:", data);

    // **Enhanced Logging**
    console.log("data.success:", data.success, "type:", typeof data.success);
    console.log("data.jwtToken:", data.jwtToken, "type:", typeof data.jwtToken);

    // Step 5: Handle the backend response
    if (data.success === true && typeof data.jwtToken === 'string' && data.jwtToken.trim() !== '') {
      console.log("Entering if condition: data.success === true && typeof data.jwtToken === 'string' && jwtToken is not empty");

      // Debugging log
      console.log("setBackendAuthToken defined inside signUp:", typeof setBackendAuthToken);

      // Step 6 Set JWT token in cookie
      setBackendAuthToken(data.jwtToken);
      console.log("Backend JWT token set successfully");
      
       // Step 7: Store JWT token in Firestore
       const userId = auth.currentUser?.uid;
       if (userId) {
         await storeJwtInFirestore(userId, data.jwtToken);
         console.log("JWT token stored in Firestore for user:", userId);
       } else {
         console.error("User ID not found; unable to store JWT in Firestore");
       }

      transitionModalStep('step1', 'step2'); 
      console.log("Transitioned to step2 successfully");
     
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

async function signIn(email, password) {
  try {
    // Sign in the user with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid; // Retrieve user ID
    console.log("User signed in:", userCredential.user);

    // Retrieve JWT token from Firestore for the authenticated user
    const jwtToken = await getJwtFromFirestore(userId);
    if (jwtToken) {
      console.log("JWT token retrieved from Firestore:", jwtToken);

      // Set the JWT token as a cookie for subdomain access
      setBackendAuthToken(jwtToken);
      console.log("JWT token set as cookie successfully");
    } else {
      console.error("No JWT token found in Firestore for user:", userId);
    }
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
    alert('Signed out successfully.');
    clearAuthToken();
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
