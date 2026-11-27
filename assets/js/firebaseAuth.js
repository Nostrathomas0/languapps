// assets/js/firebaseAuth.js
// Sign-up, sign-in, password reset and sign-out for languapps.com, all with
// Firebase Auth. Going to the app (La Base) uses a one-time Firebase custom
// token, so people arrive in the app already signed in.
import { generateRecaptchaToken } from './recapAuth.js';
import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signOut as firebaseSignOut,
} from './firebaseInit.js';

const FUNCTIONS_URL = 'https://us-central1-languapps.cloudfunctions.net/app';
const APP_URLS = {
  live: 'https://labase.languapps.com',
  staging: 'https://staging.languapps.com',
};

// ?app=staging (once) sends this browser to the staging app until ?app=live
(function rememberAppTarget() {
  const target = new URLSearchParams(window.location.search).get('app');
  if (target && APP_URLS[target]) sessionStorage.setItem('appTarget', target);
})();

function appUrl() {
  return APP_URLS[sessionStorage.getItem('appTarget')] || APP_URLS.live;
}

// Old cookies from the previous token system: removed on sign-out
function clearLegacyCookies() {
  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
  ['JWT', 'backendJwtToken', 'authToken'].forEach((name) => {
    document.cookie = `${name}=; expires=${expired}; path=/;`;
    document.cookie = `${name}=; expires=${expired}; path=/; domain=.languapps.com;`;
  });
}

// Send the signed-in user to the app, signed in. `path` is a page in the app,
// e.g. "/session/PB0". Without a signed-in user, the app shows its own sign-in.
async function goToApp(path = '/') {
  const target = appUrl() + (path.startsWith('/') ? path : `/${path}`);
  const user = auth.currentUser;
  if (!user) {
    window.location.href = target;
    return;
  }
  try {
    const idToken = await user.getIdToken();
    const response = await fetch(`${FUNCTIONS_URL}/appHandoff`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!response.ok) throw new Error(`hand-off ${response.status}`);
    const { token } = await response.json();
    window.location.href = `${target}#handoff=${encodeURIComponent(token)}`;
  } catch (error) {
    console.warn('Could not sign in to the app automatically:', error.message);
    window.location.href = target;
  }
}

// After signing in, go where the visitor was headed: ?returnTo=/hours/ keeps
// them on this site (booking, admin); otherwise they go to the app.
function afterSignIn() {
  const returnTo = new URLSearchParams(window.location.search).get('returnTo');
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    window.location.href = returnTo;
    return;
  }
  goToApp('/');
}

function signUpMessage(text) {
  if (text.includes('Email already exists')) {
    return 'This email is already registered. Please sign in instead, or use a different email address.';
  }
  if (text.includes('reCAPTCHA') || text.includes('Too many')) {
    return 'We could not confirm the sign-up. Please wait a moment and try again.';
  }
  return 'Sign-up failed. Please try again.';
}

// Creates the account (via the server, with reCAPTCHA), then signs in.
// Throws an Error with a message for the visitor if anything fails.
async function signUp(email, password) {
  const recaptchaToken = await generateRecaptchaToken('signup');
  const response = await fetch(`${FUNCTIONS_URL}/verifyRecaptchaAndSignup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: recaptchaToken, email, password }),
  });
  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text); } catch (e) { /* not JSON */ }
  if (!response.ok || !data.success) {
    throw new Error(signUpMessage(data.message || text));
  }
  await signInWithEmailAndPassword(auth, email, password);
  return true;
}

function signInMessage(error) {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Wrong email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes, or reset your password.';
    case 'auth/network-request-failed':
      return 'No connection. Please check your internet and try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

async function signIn(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (error) {
    alert(signInMessage(error));
    return false;
  }
  document.querySelectorAll('.modal').forEach((modal) => {
    if (modal.style.display === 'block') modal.style.display = 'none';
  });
  afterSignIn();
  return true;
}

// Always reports success, so the form doesn't reveal which emails have accounts
async function sendPasswordResetEmail(email) {
  try {
    await firebaseSendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    if (error.code === 'auth/invalid-email') {
      alert('Please enter a valid email address.');
      return false;
    }
    console.warn('Password reset:', error.code || error.message);
  }
  alert('If an account exists for this email, a reset link is on its way. Check your inbox and spam folder.');
  return true;
}

async function handleSignOut() {
  try {
    await firebaseSignOut(auth);
    clearLegacyCookies();
    window.location.href = 'https://languapps.com/?signed-out=true';
  } catch (error) {
    alert('Sign-out failed: ' + error.message);
  }
}

// After sign-up (guestbook step)
function proceedToApp() {
  goToApp('/');
}

export { signUp, signIn, sendPasswordResetEmail, handleSignOut, proceedToApp, goToApp };
