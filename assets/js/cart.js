// assets/js/cart.js
// Shared class cart for languapps.com pages (/hours, the main site, /services).
//
// The cart is a `bookings` document owned by the signed-in student:
//   {uid, email, sessionIds: [0..2], timezone, status: pending|checkout|paid}
// Adding a class holds a seat by raising that session's bookedCount, in the
// same transaction that checks capacity. Removing a class gives the seat back.
// A small widget at the bottom-right of the page shows the cart.

import { auth, db, onAuthStateChanged } from './firebaseInit.js';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    runTransaction,
    updateDoc,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// TODO: paste the Payment Link made for the €19.90 quick-lesson product.
const STRIPE_LINK = 'https://buy.stripe.com/REPLACE_WITH_QUICK_LESSON_LINK';
const PRODUCT_CATEGORY = 'quick-lesson';
const MAX_ITEMS = 2;
const PRICE_LABEL = '€19.90';

let user = null;
let booking = null; // {id, sessionIds, status}
let picks = [];     // [{id, name, startsAt}] for the sessions in the cart
let stopWatching = null;
let panelOpen = false;
let ready = false; // true once the first login check has finished
let notice = '';
const sessionCache = new Map();
const listeners = new Set();

// ---------------------------------------------------------------------------
// state
// ---------------------------------------------------------------------------

function snapshot() {
    return { user, booking, picks, ready, max: MAX_ITEMS };
}

function notify() {
    const state = snapshot();
    listeners.forEach((fn) => fn(state));
    renderWidget();
}

function subscribe(fn) {
    listeners.add(fn);
    fn(snapshot());
    return () => listeners.delete(fn);
}

function fail(code) {
    const error = new Error(code);
    error.code_ = code;
    return error;
}

function millis(stamp) {
    return stamp && stamp.toMillis ? stamp.toMillis() : 0;
}

async function resolvePicks(ids) {
    return Promise.all(ids.map(async (id) => {
        if (!sessionCache.has(id)) {
            const snap = await getDoc(doc(db, 'sessions', id));
            if (snap.exists()) {
                const data = snap.data();
                sessionCache.set(id, {
                    id,
                    name: data.name,
                    startsAt: data.startsAt && data.startsAt.toDate ?
                        data.startsAt.toDate() : null,
                });
            }
        }
        return sessionCache.get(id) || { id, name: 'Class', startsAt: null };
    }));
}

function watch(id) {
    if (stopWatching) stopWatching();
    stopWatching = onSnapshot(doc(db, 'bookings', id), async (snap) => {
        if (!snap.exists()) {
            booking = null;
            picks = [];
            notify();
            return;
        }
        const data = snap.data();
        booking = {
            id: snap.id,
            sessionIds: data.sessionIds || [],
            status: data.status,
        };
        picks = await resolvePicks(booking.sessionIds);
        notify();
    });
}

async function findOpenBooking(uid) {
    const snap = await getDocs(
        query(collection(db, 'bookings'), where('uid', '==', uid)));
    const open = snap.docs.filter((d) =>
        ['pending', 'checkout'].includes(d.data().status));
    open.sort((a, b) =>
        millis(b.data().createdAt) - millis(a.data().createdAt));
    return open.length ? open[0].id : null;
}

onAuthStateChanged(auth, async (u) => {
    user = u;
    if (stopWatching) {
        stopWatching();
        stopWatching = null;
    }
    booking = null;
    picks = [];
    panelOpen = false;
    notice = '';
    if (u) {
        try {
            const id = await findOpenBooking(u.uid);
            if (id) watch(id);
        } catch (error) {
            console.error('Could not load the cart:', error);
        }
    }
    ready = true;
    notify();
});

// ---------------------------------------------------------------------------
// actions
// ---------------------------------------------------------------------------

async function ensureBooking() {
    if (booking) return booking.id;
    const ref = await addDoc(collection(db, 'bookings'), {
        uid: user.uid,
        email: user.email || '',
        sessionIds: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    watch(ref.id);
    return ref.id;
}

async function add(sessionId) {
    if (!user) return { ok: false, code: 'auth' };
    try {
        const bookingId = await ensureBooking();
        await runTransaction(db, async (tx) => {
            const sessionRef = doc(db, 'sessions', sessionId);
            const bookingRef = doc(db, 'bookings', bookingId);
            const sessionSnap = await tx.get(sessionRef);
            const bookingSnap = await tx.get(bookingRef);
            if (!sessionSnap.exists() || !bookingSnap.exists()) {
                throw fail('missing');
            }
            const s = sessionSnap.data();
            const b = bookingSnap.data();
            if (b.status !== 'pending') throw fail('locked');
            if (s.active === false) throw fail('inactive');
            if (s.category !== PRODUCT_CATEGORY) throw fail('category');
            if (b.sessionIds.includes(sessionId)) throw fail('duplicate');
            if (b.sessionIds.length >= MAX_ITEMS) throw fail('limit');
            if ((s.bookedCount || 0) >= (s.capacity || 0)) throw fail('full');

            tx.update(sessionRef, { bookedCount: (s.bookedCount || 0) + 1 });
            tx.update(bookingRef, {
                sessionIds: [...b.sessionIds, sessionId],
                updatedAt: serverTimestamp(),
            });
        });
        return { ok: true };
    } catch (error) {
        return { ok: false, code: error.code_ || 'error', error };
    }
}

async function remove(sessionId) {
    if (!booking) return { ok: false, code: 'missing' };
    try {
        await runTransaction(db, async (tx) => {
            const sessionRef = doc(db, 'sessions', sessionId);
            const bookingRef = doc(db, 'bookings', booking.id);
            const sessionSnap = await tx.get(sessionRef);
            const bookingSnap = await tx.get(bookingRef);
            if (!sessionSnap.exists() || !bookingSnap.exists()) {
                throw fail('missing');
            }
            const s = sessionSnap.data();
            const b = bookingSnap.data();
            if (b.status !== 'pending') throw fail('locked');
            if (!b.sessionIds.includes(sessionId)) throw fail('missing');

            tx.update(sessionRef, {
                bookedCount: Math.max(0, (s.bookedCount || 0) - 1),
            });
            tx.update(bookingRef, {
                sessionIds: b.sessionIds.filter((id) => id !== sessionId),
                updatedAt: serverTimestamp(),
            });
        });
        return { ok: true };
    } catch (error) {
        return { ok: false, code: error.code_ || 'error', error };
    }
}

// Locks the cart (so it can't change while the student is paying) and sends
// them to Stripe. Only the booking ID travels in the link.
async function checkout() {
    if (!booking || booking.status !== 'pending' ||
        booking.sessionIds.length !== MAX_ITEMS) {
        return { ok: false, code: 'incomplete' };
    }
    if (STRIPE_LINK.includes('REPLACE')) return { ok: false, code: 'no-link' };
    try {
        await updateDoc(doc(db, 'bookings', booking.id), {
            status: 'checkout',
            updatedAt: serverTimestamp(),
        });
        window.location.href =
            `${STRIPE_LINK}?client_reference_id=${booking.id}`;
        return { ok: true };
    } catch (error) {
        return { ok: false, code: 'error', error };
    }
}

// Back from Stripe without paying: reopen the cart for editing.
async function unlock() {
    if (!booking || booking.status !== 'checkout') return { ok: false };
    try {
        await updateDoc(doc(db, 'bookings', booking.id), {
            status: 'pending',
            updatedAt: serverTimestamp(),
        });
        return { ok: true };
    } catch (error) {
        return { ok: false, code: 'error', error };
    }
}

function openPanel() {
    panelOpen = true;
    renderWidget();
}

export const cart = {
    subscribe,
    openPanel,
    add,
    remove,
    checkout,
    unlock,
    state: snapshot,
    PRODUCT_CATEGORY,
    MAX_ITEMS,
};

// ---------------------------------------------------------------------------
// widget (self-contained styles so it looks the same on every page)
// ---------------------------------------------------------------------------

const CSS = `
.lc-cart{position:fixed;right:16px;bottom:16px;z-index:9999;font:15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#39454b}
.lc-cart[hidden]{display:none}
.lc-pill{display:block;margin-left:auto;padding:10px 16px;border:0;border-radius:999px;background:#f35e08;color:#fff;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25)}
.lc-panel{width:min(320px,calc(100vw - 32px));margin-bottom:10px;padding:14px;border-radius:10px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.lc-panel[hidden]{display:none}
.lc-title{margin:0 0 8px;font-weight:700}
.lc-item{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid #e5e6e7}
.lc-item small{display:block;opacity:.75}
.lc-btn{padding:6px 12px;border:1px solid #39454b;border-radius:6px;background:#fff;color:#39454b;font:inherit;cursor:pointer}
.lc-btn:disabled{opacity:.5;cursor:default}
.lc-go{display:block;width:100%;margin-top:10px;padding:10px;border:0;border-radius:6px;background:#4caf50;color:#fff;font:inherit;font-weight:700;cursor:pointer}
.lc-note{margin:8px 0 0;font-size:13px;opacity:.8}
`;

let widget = null;
const when = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function h(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function ensureWidget() {
    if (widget) return widget;
    const style = document.createElement('style');
    style.id = 'lc-cart-style';
    style.textContent = CSS;
    document.head.append(style);

    widget = h('div', 'lc-cart');
    widget.hidden = true;
    document.body.append(widget);
    return widget;
}

async function onCheckout(button) {
    button.disabled = true;
    const result = await checkout();
    if (!result.ok) {
        button.disabled = false;
        notice = result.code === 'no-link' ?
            'The payment link is not set up yet.' :
            'Could not start checkout. Please try again.';
        renderWidget();
    }
}

function renderWidget() {
    const root = ensureWidget();
    const count = booking ? booking.sessionIds.length : 0;
    root.hidden = !(user && count > 0);
    if (root.hidden) return;

    const locked = booking.status !== 'pending';
    const panel = h('div', 'lc-panel');
    panel.hidden = !panelOpen;
    panel.append(h('p', 'lc-title',
        `Your ${count === 1 ? 'class' : 'classes'} (${count}/${MAX_ITEMS})`));

    picks.forEach((pick) => {
        const item = h('div', 'lc-item');
        const label = h('div');
        label.append(h('strong', '', pick.name));
        if (pick.startsAt) label.append(h('small', '', when.format(pick.startsAt)));
        item.append(label);
        if (!locked) {
            const button = h('button', 'lc-btn', 'Remove');
            button.type = 'button';
            button.addEventListener('click', async () => {
                button.disabled = true;
                await remove(pick.id);
            });
            item.append(button);
        }
        panel.append(item);
    });

    if (locked) {
        panel.append(h('p', 'lc-note', 'Waiting for payment.'));
        const edit = h('button', 'lc-btn', 'Edit my classes');
        edit.type = 'button';
        edit.addEventListener('click', () => unlock());
        panel.append(edit);
    } else if (count === MAX_ITEMS) {
        const go = h('button', 'lc-go', `Confirm & pay ${PRICE_LABEL}`);
        go.type = 'button';
        go.addEventListener('click', () => onCheckout(go));
        panel.append(go);
    } else {
        panel.append(h('p', 'lc-note',
            `Pick ${MAX_ITEMS - count} more to continue.`));
    }
    if (notice) panel.append(h('p', 'lc-note', notice));

    const pill = h('button', 'lc-pill',
        `Your classes ${count}/${MAX_ITEMS}`);
    pill.type = 'button';
    pill.addEventListener('click', () => {
        panelOpen = !panelOpen;
        renderWidget();
    });

    root.replaceChildren(panel, pill);
}