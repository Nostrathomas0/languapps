// assets/js/authModal.js
// Sign-out for the main-site auth modal, plus "log out everywhere" for
// links coming from labase (https://languapps.com/?logout=1).
import { auth, onAuthStateChanged } from './firebaseInit.js';
import { handleSignOut } from './firebaseAuth.js';

const signOutButton = document.getElementById('signOut');
const signedInBox = document.getElementById('signedInBox');
const signedInAs = document.getElementById('signedInAs');
const loggedOutParts = document.querySelectorAll('#step1 > h2, #signupForm, #signinForm');

// Labase sends people here after clearing its cookie, so the main site's
// own Firebase session ends too.
if (new URLSearchParams(window.location.search).get('logout') === '1') {
    handleSignOut();
}

if (signOutButton) {
    signOutButton.addEventListener('click', (event) => {
        event.preventDefault();
        signOutButton.disabled = true;
        handleSignOut();
    });
}

// Show the forms when signed out, the sign-out box when signed in.
onAuthStateChanged(auth, (user) => {
    if (!signedInBox) return;
    loggedOutParts.forEach((el) => { el.style.display = user ? 'none' : ''; });
    signedInBox.style.display = user ? '' : 'none';
    if (signedInAs) signedInAs.textContent = user ? `Signed in as ${user.email}` : '';
    if (signOutButton) signOutButton.disabled = false;
});