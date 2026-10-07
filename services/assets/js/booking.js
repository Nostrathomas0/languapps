// booking.js - Quick-lesson booking modal (languapps.com)
// Lists all offered classes live from Firestore with a real "pick 2"
// shopping-cart style selection, then checks out through one shared
// Stripe Payment Link (price is flat regardless of which 2 are picked).

import { auth, db, onAuthStateChanged } from '/assets/js/firebaseInit.js';
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

    // TODO: paste the real shared Payment Link URL here before deploying.
    const STRIPE_LINK = 'https://buy.stripe.com/7sY4gsg8C2u0aMqcGpefC04';

    let currentUser = null;
    let unsubscribeClasses = null;
    let allClasses = [];
    let cart = []; // array of class ids, max 2

    // ========================================================================
    // AUTH
    // ========================================================================

    function updateAuthUI(user) {
        const status = document.getElementById('booking-user-status');
        const container = document.getElementById('booking-calendar-container');

        if (!user) {
            status.innerHTML = '🔒 Please <a href="https://languapps.com/?openModal=auth-modal">log in</a> to book lessons';
            status.style.color = '#e74c3c';
            container.style.display = 'none';
            currentUser = null;
            if (unsubscribeClasses) unsubscribeClasses();
            return;
        }

        status.innerHTML = `✅ Logged in as ${user.email}`;
        status.style.color = '#27ae60';
        container.style.display = 'block';
        currentUser = user;
        listenForClasses();
    }

    function initAuth() {
        onAuthStateChanged(auth, updateAuthUI);
    }

    // ========================================================================
    // CLASS LIST — live from Firestore
    // ========================================================================

    function listenForClasses() {
        const container = document.getElementById('booking-calendar-container');
        const classesQuery = query(
            collection(db, 'classes'),
            where('active', '==', true),
        );

        unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
            allClasses = [];
            snapshot.forEach((d) => allClasses.push({id: d.id, ...d.data()}));

            allClasses.sort((a, b) => {
                if (a.day !== b.day) return (a.day || '').localeCompare(b.day || '');
                return (a.time || '').localeCompare(b.time || '');
            });

            render(container);
        }, (error) => {
            console.error('Failed to load classes:', error);
            container.innerHTML = '<p>Unable to load classes right now — please try again shortly.</p>';
        });
    }

    function render(container) {
        let html = `
            <p class="booking-intro">
                Pick any 2 classes below — one flat price, €19.90, no matter which you choose.
                Each short lesson pairs a live session with follow-up practice on
                <a href="https://labase.languapps.com" target="_blank" rel="noopener noreferrer">labase</a>.
                See full details on the <a href="/hours" target="_blank" rel="noopener noreferrer">class schedule page</a>.
            </p>
            <div class="class-list">
        `;

        allClasses.forEach((cls) => {
            const slotsLeft = (cls.capacity || 0) - (cls.bookedCount || 0);
            const isFull = slotsLeft <= 0;
            const inCart = cart.includes(cls.id);
            const cartFull = cart.length >= 2 && !inCart;

            html += `
                <div class="class-row ${isFull ? 'class-row--full' : ''} ${inCart ? 'class-row--selected' : ''}">
                    <div class="class-row__info">
                        <strong>${cls.name}</strong>
                        <span class="class-row__time">${cls.day} · ${cls.time} CET</span>
                        <span class="class-row__slots">${isFull ? 'Full' : `${slotsLeft} spot${slotsLeft === 1 ? '' : 's'} left`}</span>
                    </div>
                    <button
                        class="site-cta ${inCart ? 'site-cta--orange' : 'site-cta--green'}"
                        data-class-id="${cls.id}"
                        ${isFull || cartFull ? 'disabled' : ''}
                    >${inCart ? 'Remove' : 'Add'}</button>
                </div>
            `;
        });

        html += '</div>';
        html += renderCart();

        container.innerHTML = html;

        container.querySelectorAll('button[data-class-id]').forEach((btn) => {
            btn.addEventListener('click', () => toggleCartItem(btn.dataset.classId, container));
        });

        const confirmBtn = container.querySelector('#cart-confirm-btn');
        if (confirmBtn) confirmBtn.addEventListener('click', confirmBooking);
    }

    function renderCart() {
        if (cart.length === 0) {
            return '<div class="booking-cart"><p>No classes selected yet — pick 2 above.</p></div>';
        }

        const items = cart
            .map((id) => allClasses.find((c) => c.id === id))
            .filter(Boolean);

        let html = '<div class="booking-cart"><h3>Your 2 classes</h3><ul>';
        items.forEach((cls) => {
            html += `<li>${cls.name} — ${cls.day} ${cls.time}</li>`;
        });
        html += '</ul>';

        if (cart.length === 2) {
            html += '<button id="cart-confirm-btn" class="site-cta site-cta--orange">Confirm & Pay — €19.90</button>';
        } else {
            html += `<p>Pick ${2 - cart.length} more to continue.</p>`;
        }

        html += '</div>';
        return html;
    }

    // ========================================================================
    // CART — adds/removes locally, writes bookedCount immediately on add
    // ========================================================================

    async function toggleCartItem(classId, container) {
        const inCart = cart.includes(classId);

        if (inCart) {
            cart = cart.filter((id) => id !== classId);
            try {
                await updateDoc(doc(db, 'classes', classId), {
                    bookedCount: increment(-1),
                });
            } catch (err) {
                console.error('Failed to release slot:', err);
            }
        } else {
            if (cart.length >= 2) return; // guard, button should already be disabled
            cart.push(classId);
            try {
                await updateDoc(doc(db, 'classes', classId), {
                    bookedCount: increment(1),
                });
            } catch (err) {
                console.error('Failed to reserve slot:', err);
                cart = cart.filter((id) => id !== classId); // roll back locally on failure
            }
        }

        // onSnapshot will re-render with fresh counts automatically; this
        // local render call just updates cart UI immediately for snappier
        // feedback before the Firestore round-trip resolves.
        render(container);
    }

    // ========================================================================
    // STRIPE CHECKOUT
    // ========================================================================

    function confirmBooking() {
        if (!currentUser) {
            alert('Please log in to continue');
            window.location.href = 'https://languapps.com/?openModal=auth-modal';
            return;
        }

        if (cart.length !== 2) {
            alert('Please select exactly 2 classes');
            return;
        }

        // Compact reference: uid|classId1,classId2 — well under Stripe's
        // 200-character client_reference_id limit. The webhook splits on
        // "|" then "," to recover both pieces. No JSON, nothing encoded.
        const reference = `${currentUser.uid}|${cart.join(',')}`;

        window.top.location.href = `${STRIPE_LINK}?client_reference_id=${encodeURIComponent(reference)}`;
    }

    // ========================================================================
    // INIT
    // ========================================================================

    function init() {
        initAuth();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();