// assets/js/stripeCheckout.js
import { auth } from './firebaseInit.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';

// TODO: replace with the real Payment Link from Stripe Dashboard
// (Product Catalog -> your product -> Create Payment Link).
// This is NOT a working link yet — it's a placeholder.
const basePaymentLink = "https://buy.stripe.com/REPLACE_WITH_REAL_LINK";

const checkoutButton = document.getElementById("confirm-booking");
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (!checkoutButton) return; // modal may not be open/in the DOM yet

  if (user) {
    checkoutButton.removeAttribute("disabled");
    checkoutButton.title = "";
  } else {
    checkoutButton.setAttribute("disabled", "true");
    checkoutButton.title = "Sign in first to book a lesson";
  }
});

if (checkoutButton) {
  checkoutButton.addEventListener("click", (e) => {
    e.preventDefault();

    if (!currentUser) {
      // Reuse the existing auth modal instead of just logging an error —
      // nudges the user straight into sign-in rather than a dead click.
      const authModal = document.getElementById("auth-modal");
      if (authModal) authModal.style.display = "block";
      return;
    }

    const dynamicLink = `${basePaymentLink}?client_reference_id=${currentUser.uid}`;
    window.location.href = dynamicLink;
  });
}