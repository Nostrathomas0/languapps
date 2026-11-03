// assets/js/bookingModal.js
// Quick-lesson picker in the main-site booking modal.
// The student ticks two classes. Nothing is saved and no seats are held; the
// second tick sends them to /hours/, which puts the next open session of each
// class in their cart. Logged-out visitors can browse and tick, and are asked
// to log in at the second tick.

import { auth, db, onAuthStateChanged } from './firebaseInit.js';
import {
    collection,
    query,
    where,
    onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

(function () {
    'use strict';

    const PRODUCT_CATEGORY = 'quick-lesson';
    const SCHEDULE_URL = '/hours/';
    const MAX_PICKS = 2;
    const STORE_KEY = 'quickPicks';

    // Only used to keep the list in weekday order.
    const DAY_ORDER = {
        Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5,
        Saturday: 6, Sunday: 7,
    };

    const BASE = 'display:flex;justify-content:space-between;align-items:center;' +
        'gap:12px;width:100%;margin:0 0 8px;padding:10px 14px;text-align:left;' +
        'font:inherit;color:#39454b;background:#fff;border:2px solid #e5e6e7;' +
        'border-radius:6px;cursor:pointer;';
    const ON = 'background:#fff1e8;border-color:#f35e08;';
    const OFF = 'opacity:.5;cursor:default;';

    const status = document.getElementById('booking-user-status');
    const container = document.getElementById('booking-calendar-container');

    // Do nothing on any page that doesn't carry the modal markup.
    if (!status || !container) return;

    let currentUser = null;
    let classes = [];
    let loaded = false;
    let picked = [];
    let waitingForLogin = false;

    try {
        const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
        if (saved) {
            picked = saved.picked || [];
            waitingForLogin = !!saved.waitingForLogin;
        }
    } catch (error) {
        picked = [];
    }

    function remember() {
        try {
            sessionStorage.setItem(STORE_KEY,
                JSON.stringify({ picked, waitingForLogin }));
        } catch (error) {
            // private browsing: the picks just won't survive a reload
        }
    }

    // ========================================================================
    // AUTH
    // ========================================================================

    function setStatus(text, color) {
        status.textContent = text;
        status.style.color = color;
    }

    // Close the booking modal with the site's own close handler, then open
    // the site's own login modal through its existing button.
    function openLogin() {
        const closeButton = document.querySelector('#booking-modal .close');
        const loginButton = document.getElementById('openModalButton');
        if (closeButton) closeButton.click();
        if (loginButton) {
            loginButton.click();
        } else {
            // Pages without the login modal (e.g. /services): go to the home page's.
            window.location.href = '/?openModal=auth-modal';
        }
    }

    function goToSchedule() {
        picked = picked.slice(0, MAX_PICKS);
        waitingForLogin = false;
        remember();
        window.location.href = `${SCHEDULE_URL}?pick=${picked.join(',')}`;
    }

    // Called whenever the picks change or the login state changes.
    function maybeGo() {
        if (picked.length !== MAX_PICKS) return;
        if (currentUser) {
            goToSchedule();
        } else if (!waitingForLogin) {
            waitingForLogin = true;
            remember();
            openLogin();
        }
    }

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            setStatus(`Logged in as ${user.email}`, '#27ae60');
            if (waitingForLogin) maybeGo();
        } else {
            setStatus('Pick any 2. You\'ll log in on the next step.', '#39454b');
        }
        render();
    });

    // ========================================================================
    // CLASS LIST, live from Firestore (public read)
    // ========================================================================

    onSnapshot(
        query(collection(db, 'classes'), where('active', '==', true)),
        (snapshot) => {
            classes = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((c) => c.category === PRODUCT_CATEGORY);

            classes.sort((a, b) =>
                ((DAY_ORDER[a.day] || 9) - (DAY_ORDER[b.day] || 9)) ||
                (a.time || '').localeCompare(b.time || ''));

            picked = picked.filter((id) => classes.some((c) => c.id === id));
            loaded = true;
            render();
        },
        (error) => {
            console.error('Failed to load classes:', error);
            container.textContent =
                'Classes are unavailable right now. Please try again shortly.';
        },
    );

    // ========================================================================
    // DISPLAY
    // ========================================================================

    function whenText(c) {
        const slot = [c.day ? `${c.day}s` : '', c.time || '']
            .filter(Boolean).join(' ');
        return [c.level, slot ? `${slot} Paris time` : '']
            .filter(Boolean).join(' · ');
    }

    function render() {
        if (!loaded) {
            container.textContent = 'Loading classes…';
            return;
        }
        if (classes.length === 0) {
            container.textContent = 'No classes are open right now. Check back soon.';
            return;
        }

        container.replaceChildren();
        classes.forEach((c) => {
            const on = picked.includes(c.id);
            const blocked = !on && picked.length >= MAX_PICKS;

            const row = document.createElement('button');
            row.type = 'button';
            row.dataset.id = c.id;
            row.setAttribute('aria-pressed', String(on));
            row.disabled = blocked;
            row.style.cssText = BASE + (on ? ON : '') + (blocked ? OFF : '');

            const text = document.createElement('span');
            const name = document.createElement('strong');
            name.textContent = c.name;
            const when = document.createElement('small');
            when.textContent = whenText(c);
            text.append(name, document.createElement('br'), when);

            const mark = document.createElement('span');
            mark.textContent = on ? '✓ Selected' : '';
            mark.style.cssText = 'font-weight:700;color:#f35e08;white-space:nowrap;';

            row.append(text, mark);
            row.addEventListener('click', () => toggle(c.id));
            container.append(row);
        });

        const help = document.createElement('p');
        help.style.cssText = 'margin-top:10px;font-size:.9em;';
        help.textContent = picked.length === 0 ?
            'Pick 2 classes. Next you will see the next open session of each.' :
            picked.length === 1 ? 'Pick 1 more.' :
            waitingForLogin ? 'Log in to continue to the schedule.' :
            'Taking you to the schedule…';
        container.append(help);
    }

    function toggle(id) {
        if (picked.includes(id)) {
            picked = picked.filter((x) => x !== id);
            waitingForLogin = false;
        } else if (picked.length < MAX_PICKS) {
            picked = [...picked, id];
        }
        remember();
        render();
        maybeGo();
    }
})();