// assets/js/firebaseAuth.js
import { generateRecaptchaToken } from './recapAuth.js';
import { 
  auth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from './firebaseInit.js';
import { storeJwtInFirestore, getJwtFromFirestore } from './firebaseUtils.js'

/// Utility function to clear the JWT token from cookies and localStorage
function clearAuthToken() {
  console.log("Before clearing:", document.cookie);
  
  // Use a hardcoded past date string instead of using date variable
  const pastDateStr = 'Thu, 01 Jan 1970 00:00:00 GMT';
  
  // Clear JWT cookie (standardized name)
  document.cookie = `JWT=; expires=${pastDateStr}; path=/; domain=.languapps.com; secure; SameSite=None;`;
  
  // Clean up legacy cookie if it exists
  document.cookie = `backendJwtToken=; expires=${pastDateStr}; path=/; domain=.languapps.com; secure; SameSite=None;`;
  
  // Also clear from localStorage if present
  if (localStorage) {
    localStorage.removeItem('JWT');
    localStorage.removeItem('emulatorJWT');
  }
  
  console.log("After clearing:", document.cookie);
}

// Function to set the JWT token - SIMPLIFIED to use only JWT cookie
function setAuthToken(token) {
  // Set only JWT cookie (our standardized name)
  document.cookie = `JWT=${encodeURIComponent(token)}; max-age=3600; path=/; domain=.languapps.com; secure; SameSite=None`;
  
  console.log("JWT cookie set successfully");
} 

// Monitor authentication state changes
onAuthStateChanged(auth, async (user) => {
  console.log('Auth state changed:', user);

  if (user) {
    try {
      // Get the JWT token from Firestore for the authenticated user
      const jwtToken = await getJwtFromFirestore(user.uid);
      if (jwtToken) {
        setAuthToken(jwtToken); // Set the retrieved token as a cookie
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

    // Step 1: Generate the reCAPTCHA token
    const recaptchaToken = await generateRecaptchaToken('signup');
    console.log('Generated reCAPTCHA token:', recaptchaToken);

    // Step 2: Send data to the backend for user creation
    const response = await fetch('https://us-central1-languapps.cloudfunctions.net/app/verifyRecaptchaAndSignup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: recaptchaToken, email, password }),
    });
    console.log("Fetch response status:", response.status);

    if (!response.ok) {
    // Get the actual error message from the server
    const errorData = await response.text();
    console.error("Server error response:", errorData);
    
    // Show user-friendly error messages
    if (errorData.includes("Email already exists")) {
      alert("This email is already registered. Please try signing in instead, or use a different email address.");
      return; // Stop the signup process
    } else {
      alert("Sign-up failed: " + errorData);
      return; // Stop the signup process
    }
  }

    // Step 3: Parse the backend response
    const data = await response.json();
    if (!data.success || !data.jwtToken) {
      throw new Error(data.message || 'reCAPTCHA verification or sign-up failed');
    }
    console.log("Backend returned a valid JWT token.");

    // Set JWT token in cookie
    setAuthToken(data.jwtToken);
    console.log("Backend JWT token set successfully as cookie.");

    // Step 4: Explicitly sign in with Firebase Authentication to access auth.currentUser
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    console.log("User authenticated with Firebase:", userId);

    // Step 5: Store JWT in Firestore
    await storeJwtInFirestore(userId, data.jwtToken);
    console.log("User data stored in Firestore with JWT token:", userId);

    // Transition to next step in your flow
    transitionModalStep('step1', 'step2');
    console.log("Transitioned to step2 successfully");
    
    // Add a longer delay for signUp to allow users to see the step2 content
    setTimeout(() => {
      // Redirect to subdomain with the JWT token
      window.location.href = `https://labase.languapps.com/?authToken=${encodeURIComponent(data.jwtToken)}`;
      console.log("Redirecting to subdomain after showing step2...");
    }, 3000); // 3 second delay to give users time to see step2

  } catch (error) {
    console.error('Sign-up error:', error);
    alert('Sign-up failed: ' + error.message);
  }
}

async function signIn(email, password) {
  try {
    // Sign in the user with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    console.log("User signed in:", userCredential.user);

    // Retrieve JWT token from Firestore
    const jwtToken = await getJwtFromFirestore(userId);
    if (jwtToken) {
      console.log("JWT token retrieved from Firestore:", jwtToken);

      // Set the JWT token as a cookie for subdomain access
      setAuthToken(jwtToken);
      
      // Pre redirect
      const subdomain = "https://labase.languapps.com";
      const redirectUrl = `${subdomain}/?authToken=${encodeURIComponent(jwtToken)}`;
      
      // Close modals
      document.querySelectorAll('.modal').forEach(modal => {
        if (modal.style.display === 'block') {
          modal.style.display = 'none';
        }
      });

      // Clear URL
      const cleanUrl = new URL(window.location);
      cleanUrl.search = '';
      window.history.pushState({}, '', cleanUrl);

      console.log("Redirecting to:", subdomain);

      // Execute redirect
      executeRedirect(redirectUrl);

      return true;
    } else {
      console.error("No Token found for user", userId);
      alert("Sign-in failed: Unable to retrieve auth token.");
      return false
    }
  } catch (error) {
    console.error("Error during sign-in process:", error);
    alert("Sign-in failed: " + error.message);
    return false;
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