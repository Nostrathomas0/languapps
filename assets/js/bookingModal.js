// assets/js/bookingModal.js
// Quick-lesson picker for the main-site booking modal. Lists the classes
// from Firestore with live spots left, lets the student add 2 to a cart,
// then sends them to the shared Stripe Payment Link.

import { auth, db, onAuthStateChanged } from './firebaseInit.js';
import {
    collection,
    doc,
    query,
    where,
    onSnapshot,
    updateDoc,
    increment,
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

(function () {
    'use strict';

    // TODO: paste the Payment Link created for this modal only.
    const STRIPE_LINK = 'https://buy.stripe.com/REPLACE_WITH_MODAL_LINK';

    // Only used to keep the list in weekday order; days are never shown.
    const DAY_ORDER = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };

    const status = document.getElementById('booking-user-status');
    const container = document.getElementById('booking-calendar-container');

    // Do nothing on any page that doesn't carry the modal markup.
    if (!status || !container) return;

    let currentUser = null;
    let unsubscribe = null;
    let classes = [];
    let cart = []; // class ids, max 2

    // ========================================================================
    // AUTH
    // ========================================================================

    function setStatus(html, color) {
        status.innerHTML = html;
        status.style.color = color;
    }

    function openLogin(event) {
        event.preventDefault();
        // Reuse the site's own login button so its modal logic runs.
        const modal = document.getElementById('booking-modal');
        const loginButton = document.getElementById('openModalButton');
        if (modal) modal.style.display = 'none';
        if (loginButton) loginButton.click();
    }

    onAuthStateChanged(auth, (user) => {
        currentUser = user;

        // Always drop the previous listener so signing in twice never
        // stacks two live queries on top of each other.
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        if (!user) {
            cart = [];
            container.innerHTML = '';
            setStatus('Please <a href="#" id="booking-login-link">log in</a> to book.', '#e74c3c');
            const link = document.getElementById('booking-login-link');
            if (link) link.addEventListener('click', openLogin);
            return;
        }

        setStatus(`Logged in as ${user.email}`, '#27ae60');
        listen();
    });

    // ========================================================================
    // CLASS LIST — live from Firestore
    // ========================================================================

    function listen() {
        const classesQuery = query(
            collection(db, 'classes'),
            where('active', '==', true),
        );

        unsubscribe = onSnapshot(classesQuery, (snapshot) => {
            classes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

            classes.sort((a, b) =>
                ((DAY_ORDER[a.day] || 9) - (DAY_ORDER[b.day] || 9)) ||
                (a.time || '').localeCompare(b.time || ''));

            // Forget cart entries for classes that were retired meanwhile.
            cart = cart.filter((id) => classes.some((c) => c.id === id));
            render();
        }, (error) => {
            console.error('Failed to load classes:', error);
            container.innerHTML = '<p>Classes are unavailable right now. Please try again shortly.</p>';
        });
    }

    function render() {
        if (classes.length === 0) {
            container.innerHTML = '<p>No classes are open right now. Check back soon.</p>';
            return;
        }

        const rows = classes.map((c) => {
            const left = (c.capacity || 0) - (c.bookedCount || 0);
            const full = left <= 0;
            const picked = cart.includes(c.id);
            const blocked = !picked && (full || cart.length >= 2);
            const label = full ? 'Full' : `${left} ${left === 1 ? 'spot' : 'spots'} left`;

            return `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #e5e6e7;">
                    <div><strong>${c.name}</strong><br><small>${label}</small></div>
                    <button type="button" class="site-cta ${picked ? 'site-cta--orange' : 'site-cta--green'}" data-id="${c.id}" ${blocked ? 'disabled' : ''}>${picked ? 'Remove' : 'Add'}</button>
                </div>`;
        }).join('');

        const picks = cart
            .map((id) => classes.find((c) => c.id === id))
            .filter(Boolean);

        let cartHtml;
        if (picks.length === 0) {
            cartHtml = '<p>Pick 2 classes.</p>';
        } else if (picks.length === 1) {
            cartHtml = `<p><strong>Your picks:</strong> ${picks[0].name}</p><p>Pick 1 more.</p>`;
        } else {
            cartHtml = `<p><strong>Your picks:</strong> ${picks.map((c) => c.name).join(' + ')}</p>
                <button type="button" id="booking-checkout" class="site-cta site-cta--orange">Confirm &amp; pay — €19.90</button>`;
        }

        container.innerHTML = `${rows}<div style="padding-top:14px;">${cartHtml}</div>`;

        container.querySelectorAll('button[data-id]').forEach((button) => {
            button.addEventListener('click', () => toggle(button.dataset.id));
        });

        const checkout = document.getElementById('booking-checkout');
        if (checkout) checkout.addEventListener('click', goToStripe);
    }

    // ========================================================================
    // CART — bookedCount moves the moment a class is added or removed
    // ========================================================================

    async function toggle(id) {
        if (!currentUser) return;

        const adding = !cart.includes(id);
        if (adding && cart.length >= 2) return;

        // Update the cart first so the UI answers instantly; undo on failure.
        cart = adding ? [...cart, id] : cart.filter((x) => x !== id);
        render();

        try {
            await updateDoc(doc(db, 'classes', id), {
                bookedCount: increment(adding ? 1 : -1),
            });
        } catch (error) {
            console.error('Could not update the class count:', error);
            cart = adding ? cart.filter((x) => x !== id) : [...cart, id];
            render();
        }
    }

    // ========================================================================
    // STRIPE
    // ========================================================================

    function goToStripe() {
        if (!currentUser || cart.length !== 2) return;

        if (STRIPE_LINK.includes('REPLACE')) {
            alert('The payment link is not set up yet.');
            return;
        }

        // Stripe Payment Links keep only letters, digits, dashes and
        // underscores in client_reference_id, so this is uid_class1_class2.
        // The webhook splits it back apart on "_".
        const reference = [currentUser.uid, ...cart].join('_');
        window.location.href = `${STRIPE_LINK}?client_reference_id=${reference}`;
    }
})();