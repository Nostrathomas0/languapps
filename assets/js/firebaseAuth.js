import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  sendEmailVerification, 
  signOut as firebaseSignOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from './firebaseInit.js';
import { verifyRecaptchaAndSignup } from './recapAuth.js';

function setAuthTokenCookie(token) {
  const domain = window.location.hostname.endsWith('.languapps.com') ? '.languapps.com' : window.location.hostname;
  document.cookie = `authToken=${token}; max-age=3600; path=/; domain=${domain}; secure; samesite=none; httponly`;
  console.log('Auth token set:', token);
}

// Monitor authentication state changes
onAuthStateChanged(auth, user => {
  console.log('Auth state changed:', user);
  if (user) {
    handleAuthenticatedUser(user);
  } else {
    handleUnauthenticatedUser();
  }
});

async function handleAuthenticatedUser(user) {
  try {
    if (user.emailVerified) {
      const token = await user.getIdToken();
      setAuthTokenCookie(token);
      await sendJWTToLambda(token); // Send JWT token after email is verified
      if (window.location.hostname === 'labase.languapps.com') {
        window.location.href = `https://labase.languapps.com/?authToken=${token}`;
      }
    } else {
      console.log('Email not verified yet.');
      // Optionally, you can remind the user to verify their email here
    }
  } catch (error) {
    console.error('Error handling authenticated user:', error);
  }
}

function handleUnauthenticatedUser() {
  document.cookie = "authToken=; max-age=0; path=/; domain=.languapps.com; secure; samesite=none; httponly";
  if (window.location.hostname === 'labase.languapps.com') {
    window.location.href = "https://languapps.com/?auth-modal";
  }
}

async function signUp(email, password, recaptchaToken) {
  try {
    const signupResponse = await verifyRecaptchaAndSignup(email, password, recaptchaToken);
    
    if (signupResponse && signupResponse.success) {
      console.log('Sign-up and reCAPTCHA verification successful');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendVerificationEmail(userCredential.user);
      console.log('Please verify your email before continuing.');
      
      // Remove the JWT token handling here since we will handle it after email verification
    } else {
      console.error('Sign-up failed: reCAPTCHA verification or sign-up failed');
      throw new Error(signupResponse ? signupResponse.message : 'Unknown error during sign-up');
    }
  } catch (error) {
    console.error('Sign-up error:', error);
    alert('Sign-up failed: ' + error.message);
  }
}

async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (!userCredential.user.emailVerified) {
      throw new Error('Email not verified.');
    }
    console.log("User signed in:", userCredential.user);
    const token = await userCredential.user.getIdToken();
    setAuthTokenCookie(token);
    window.location.href = "https://labase.languapps.com";
  } catch (error) {
    console.error("Error signing in:", error);
    alert('Sign-in failed: ' + error.message);
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

export { signUp, signIn, sendPasswordResetEmail, handleSignOut };
