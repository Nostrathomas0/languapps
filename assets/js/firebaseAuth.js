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
    // Create the user in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created:', userCredential.user);

    // Send the email verification
    await sendVerificationEmail(userCredential.user);
    console.log('Verification email sent. Please verify your email before continuing.');
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
