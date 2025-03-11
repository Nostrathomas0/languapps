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
  
  // Clear both token names for consistency
  document.cookie = `JWT=; expires=${pastDateStr}; path=/; domain=.languapps.com; secure; SameSite=None;`;
  document.cookie = `backendJwtToken=; expires=${pastDateStr}; path=/; domain=.languapps.com; secure; SameSite=None;`;
  
  // Also clear from localStorage if present
  if (localStorage) {
    localStorage.removeItem('JWT');
    localStorage.removeItem('emulatorJWT');
  }
  
  console.log("After clearing:", document.cookie);
}

// Function to set the Backend JWT token in localStorage and as a cookie
function setAuthToken(token) {
  // Just use one consistent name
  document.cookie = `JWT=${encodeURIComponent(token)}; max-age=3600; path=/; domain=.languapps.com; secure; SameSite=None`;
  document.cookie = `backendJwtToken=${encodeURIComponent(token)}; max-age=3600; path=/; domain=.languapps.com; secure; SameSite=None`;

  if (localStorage) {
    localStorage.setItem('JWT', token);
  }

  console.log("JWT set in cookies");
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
      throw new Error("Server responded with an error");
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
    const userId = userCredential.user.uid; // Retrieve user ID
    console.log("User signed in:", userCredential.user);

    // Retrieve JWT token from Firestore for the authenticated user
    const jwtToken = await getJwtFromFirestore(userId);
    if (jwtToken) {
      console.log("JWT token retrieved from Firestore:", jwtToken);

      // Set the JWT token as a cookie for subdomain access
      setAuthToken(jwtToken);
      console.log("JWT token set as cookie successfully");

      // Explicitly redirect to the subdomain with the JWT token
      const subdomain = "https://labase.languapps.com";
      console.log("Redirecting to:", subdomain);
      
      // Force redirect to the subdomain
      window.location.href = `${subdomain}/?authToken=${encodeURIComponent(jwtToken)}`;
    } else {
      console.error("No JWT token found in Firestore for user:", userId);
      alert("Sign-in failed: Unable to retrieve JWT token.");
    }
  } catch (error) {
    console.error("Error during sign-in process:", error);
    alert("Sign-in failed: " + error.message);
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
