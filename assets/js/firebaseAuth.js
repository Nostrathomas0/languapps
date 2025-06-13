// assets/js/firebaseAuth.js
import { generateRecaptchaToken } from './recapAuth.js';
import { 
  auth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from './firebaseInit.js';
import { storeJwtInFirestore, getJwtFromFirestore } from './firebaseUtils.js'

// Utility function to get cookie value
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/// Utility function to clear the JWT token from cookies and localStorage
function clearAuthToken() {
  console.log("🔍 [DEBUG] Clearing auth tokens...");
  console.log("Before clearing:", document.cookie);
  
  const pastDateStr = 'Thu, 01 Jan 1970 00:00:00 GMT';
  const isSecure = window.location.protocol === 'https:';
  const domain = '.languapps.com';
  
  // Clear all possible JWT cookie variations
  const cookieNames = ['JWT', 'backendJwtToken', 'authToken'];
  
  cookieNames.forEach(cookieName => {
    // Clear for current domain
    document.cookie = `${cookieName}=; expires=${pastDateStr}; path=/;`;
    // Clear for main domain
    document.cookie = `${cookieName}=; expires=${pastDateStr}; path=/; domain=${domain};`;
    // Clear with secure flag if HTTPS
    if (isSecure) {
      document.cookie = `${cookieName}=; expires=${pastDateStr}; path=/; domain=${domain}; secure; SameSite=None;`;
    }
  });
  
  // Clear from localStorage
  if (typeof Storage !== "undefined") {
    localStorage.removeItem('JWT');
    localStorage.removeItem('authToken');
    localStorage.removeItem('emulatorJWT');
  }
  
  console.log("After clearing:", document.cookie);
  console.log("🔍 [DEBUG] Auth tokens cleared");
}

// Updated setAuthToken function with debug logging
function setAuthToken(token, maxAge = 3600) {
  console.log("🔍 [DEBUG] setAuthToken called with:", {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    maxAge: maxAge
  });

  if (!token) {
    console.error("🔍 [DEBUG] setAuthToken ERROR: Cannot set empty token");
    return false;
  }
  
  const isSecure = window.location.protocol === 'https:';
  const domain = '.languapps.com';
  
  let cookieString = `JWT=${encodeURIComponent(token)}; max-age=${maxAge}; path=/; domain=${domain}`;
  
  if (isSecure) {
    cookieString += '; secure; SameSite=None';
  } else {
    cookieString += '; SameSite=Lax';
  }
  
  console.log("🔍 [DEBUG] Setting cookie:", {
    isSecure: isSecure,
    domain: domain,
    cookieLength: cookieString.length
  });
  
  document.cookie = cookieString;
  
  // Verify cookie was set
  const verification = getCookie('JWT');
  console.log("🔍 [DEBUG] Cookie verification:", {
    cookieSet: !!verification,
    matches: verification === token
  });
  
  return !!verification;
}

// Monitor authentication state changes
onAuthStateChanged(auth, async (user) => {
  console.log('🔍 [DEBUG] Auth state changed:', user ? user.email : 'signed out');

  if (user) {
    // Check if we're in the middle of a signup flow
    if (window.signupJwtToken) {
      console.log("🔍 [DEBUG] Signup flow in progress, skipping automatic redirect");
      return; // Don't redirect during signup
    }
    
    try {
      // Get the JWT token from Firestore for the authenticated user
      const jwtToken = await getJwtFromFirestore(user.uid);
      if (jwtToken) {
        setAuthToken(jwtToken); // Set the retrieved token as a cookie
        console.log("🔍 [DEBUG] JWT token set as cookie successfully");

        // Only redirect if we're NOT on the main domain during signup
        if (window.location.hostname === 'labase.languapps.com') {
          window.location.href = `https://labase.languapps.com/?authToken=${jwtToken}`;
        }
      } else {
        console.error("🔍 [DEBUG] No JWT token found in Firestore for user:", user.uid);
      }
    } catch (error) {
      console.error('🔍 [DEBUG] Error retrieving JWT token from Firestore:', error);
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
    
    // Store the JWT token for later use in redirect
    window.signupJwtToken = data.jwtToken;
    console.log("JWT token stored for user choice redirect");
    
    // No automatic redirect - user controls when to proceed

  } catch (error) {
    console.error('Sign-up error:', error);
    alert('Sign-up failed: ' + error.message);
  }
}

// Function to handle redirects
function executeRedirect(url) {
  console.log("executeRedirect called with URL:", url);
  window.location.href = url;
}

// Debug version of signIn function with comprehensive logging
async function signIn(email, password) {
  console.log("🔍 [DEBUG] Starting sign-in process for:", email);
  
  try {
    // Step 1: Firebase Authentication
    console.log("🔍 [DEBUG] Step 1: Attempting Firebase sign-in...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    console.log("🔍 [DEBUG] Step 1 SUCCESS: Firebase auth completed for user:", userId);

    // Step 2: Get JWT from Firestore
    console.log("🔍 [DEBUG] Step 2: Retrieving JWT from Firestore...");
    let jwtToken;
    
    try {
      jwtToken = await getJwtFromFirestore(userId);
      console.log("🔍 [DEBUG] Step 2 RESULT: JWT retrieved:", jwtToken ? "✓ Found" : "✗ Not found");
    } catch (firestoreError) {
      console.error("🔍 [DEBUG] Step 2 ERROR: Firestore retrieval failed:", firestoreError);
      alert("Failed to retrieve authentication data. Please try again.");
      return false;
    }

    if (!jwtToken) {
      console.error("🔍 [DEBUG] FATAL: No JWT token found for user");
      alert("Sign-in failed: No authentication token found. Please sign up first.");
      return false;
    }

    // Step 3: Check if token is expired
    console.log("🔍 [DEBUG] Step 3: Checking token expiration...");
    let isExpired = false;
    let tokenPayload = null;
    
    try {
      tokenPayload = JSON.parse(atob(jwtToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      isExpired = tokenPayload.exp && tokenPayload.exp < currentTime;
      
      console.log("🔍 [DEBUG] Step 3 RESULT:", {
        currentTime: currentTime,
        tokenExp: tokenPayload.exp,
        isExpired: isExpired,
        expiredBy: isExpired ? (currentTime - tokenPayload.exp) + " seconds" : "N/A"
      });
    } catch (parseError) {
      console.error("🔍 [DEBUG] Step 3 ERROR: Token parsing failed:", parseError);
      alert("Invalid token format. Please sign up again.");
      return false;
    }

    // Step 4: Refresh token if expired
    if (isExpired) {
      console.log("🔍 [DEBUG] Step 4: Token is expired, attempting refresh...");
      
      try {
        // Extract existing progress
        const existingProgress = {
          currentSession: tokenPayload.currentSession || null,
          recentProgress: tokenPayload.recentProgress || [],
          overallStats: tokenPayload.overallStats || {
            totalTopicsCompleted: 0,
            averageScore: 0,
            totalTimeSpent: 0,
            streak: 0,
            lastActiveDate: new Date().toISOString().split('T')[0]
          },
          originalCreation: tokenPayload.originalCreation || tokenPayload.iat
        };
        
        console.log("🔍 [DEBUG] Step 4a: Extracted progress data:", {
          hasCurrentSession: !!existingProgress.currentSession,
          recentProgressCount: existingProgress.recentProgress.length,
          totalCompleted: existingProgress.overallStats.totalTopicsCompleted
        });

        // Make the refresh request
        console.log("🔍 [DEBUG] Step 4b: Making refresh request to Firebase Function...");
        
        const refreshResponse = await fetch('https://us-central1-languapps.cloudfunctions.net/app/refreshJWTWithProgress', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            userId: userId,
            email: email,
            existingProgress: existingProgress
          }),
        });
        
        console.log("🔍 [DEBUG] Step 4c: Refresh response status:", refreshResponse.status);
        console.log("🔍 [DEBUG] Step 4c: Refresh response headers:", Object.fromEntries(refreshResponse.headers.entries()));

        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text();
          console.error("🔍 [DEBUG] Step 4c ERROR: Refresh failed with response:", errorText);
          throw new Error(`JWT refresh failed: ${refreshResponse.status} - ${errorText}`);
        }

        const refreshData = await refreshResponse.json();
        console.log("🔍 [DEBUG] Step 4d: Refresh response data:", {
          success: refreshData.success,
          hasJwtToken: !!refreshData.jwtToken,
          message: refreshData.message,
          preservedProgress: refreshData.preservedProgress
        });

        if (!refreshData.success || !refreshData.jwtToken) {
          throw new Error(refreshData.message || 'JWT refresh response invalid');
        }

        jwtToken = refreshData.jwtToken;
        console.log("🔍 [DEBUG] Step 4 SUCCESS: JWT refreshed successfully");

        // Store refreshed token back to Firestore
        console.log("🔍 [DEBUG] Step 4e: Storing refreshed token to Firestore...");
        try {
          await storeJwtInFirestore(userId, jwtToken);
          console.log("🔍 [DEBUG] Step 4e SUCCESS: Refreshed token stored to Firestore");
        } catch (storeError) {
          console.error("🔍 [DEBUG] Step 4e ERROR: Failed to store refreshed token:", storeError);
          // Continue anyway, we have the token
        }

      } catch (refreshError) {
        console.error("🔍 [DEBUG] Step 4 FATAL ERROR: Token refresh failed:", refreshError);
        alert("Unable to refresh your session. Please try signing in again.");
        return false;
      }
    } else {
      console.log("🔍 [DEBUG] Step 4: Token is still valid, skipping refresh");
    }

    // Step 5: Set the JWT cookie
    console.log("🔍 [DEBUG] Step 5: Setting JWT cookie...");
    const cookieSet = setAuthToken(jwtToken);
    if (!cookieSet) {
      console.error("🔍 [DEBUG] Step 5 ERROR: Failed to set JWT cookie");
      return false;
    }
    console.log("🔍 [DEBUG] Step 5 SUCCESS: JWT cookie set");

    // Step 6: Clean up UI and redirect
    console.log("🔍 [DEBUG] Step 6: Cleaning up and redirecting...");
    
    // Close modals
    document.querySelectorAll('.modal').forEach(modal => {
      if (modal.style.display === 'block') {
        modal.style.display = 'none';
        console.log("🔍 [DEBUG] Step 6a: Closed modal:", modal.id);
      }
    });

    // Clean URL
    const cleanUrl = new URL(window.location);
    cleanUrl.search = '';
    window.history.pushState({}, '', cleanUrl);
    console.log("🔍 [DEBUG] Step 6b: URL cleaned");

    // Redirect
    const redirectUrl = `https://labase.languapps.com/?authToken=${encodeURIComponent(jwtToken)}`;
    console.log("🔍 [DEBUG] Step 6c: Redirecting to:", redirectUrl);
    
    window.location.href = redirectUrl;
    
    console.log("🔍 [DEBUG] SIGN-IN PROCESS COMPLETED SUCCESSFULLY");
    return true;

  } catch (error) {
    console.error("🔍 [DEBUG] FATAL ERROR in sign-in process:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
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
    console.log("🔍 [DEBUG] Starting sign-out process...");
    
    // Sign out from Firebase
    await firebaseSignOut(auth);
    
    // Clear all auth tokens and cookies
    clearAuthToken();
    
    // Clear any signup flow tokens
    if (window.signupJwtToken) {
      delete window.signupJwtToken;
    }
    
    // Redirect to main domain
    window.location.href = "https://languapps.com/?signed-out=true";
    
    console.log("🔍 [DEBUG] Sign-out completed successfully");
    
  } catch (error) {
    console.error('🔍 [DEBUG] Error during sign out:', error);
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

// Function to redirect to subdomain after signup
function proceedToApp() {
  const token = window.signupJwtToken;
  if (token) {
    window.location.href = `https://labase.languapps.com/?authToken=${encodeURIComponent(token)}`;
    console.log("Redirecting to subdomain...");
  } else {
    console.error("No JWT token found for redirect");
  }
}

export { signUp, signIn, sendPasswordResetEmail, handleSignOut, proceedToApp };