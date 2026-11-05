// admin/assets/js/admin.js
// Schedule admin for Thomas only. The page hides itself for anyone else,
// but the real lock is in the Firestore rules (isAdmin()).
import { auth, db, onAuthStateChanged } from '/assets/js/firebaseInit.js';
import {
    collection, doc, getDoc, getDocs, query, where, orderBy,
    writeBatch, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// Paste your own Firebase uid (Firebase console > Authentication). It must be
// the same uid used in the Firestore rules.
const ADMIN_UID = 'v8Zomt6yfhheZexXQJCCm6b2v502';
const TZ = 'Europe/Paris';
const MIN_GAP_MIN = 5;
const MAX_RANGE_DAYS = 120;

const $ = (id) => document.getElementById(id);

// ============================================================================
// TIME HELPERS (Paris wall time <-> UTC, DST safe)
// ============================================================================

function parisOffsetMinutes(date) {
    const parts = new Intl.DateTimeFormat('en-US', {timeZone: TZ, timeZoneName: 'longOffset'})
        .formatToParts(date);
    const name = parts.find((p) => p.type === 'timeZoneName').value;
    const m = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0));
}

function parisToUtc(dateStr, timeStr) {
    const [y, mo, d] = dateStr.split('-').map(Number);
    const [h, mi] = timeStr.split(':').map(Number);
    const guess = Date.UTC(y, mo - 1, d, h, mi);
    const off = parisOffsetMinutes(new Date(guess));
    let t = guess - off * 60000;
    const off2 = parisOffsetMinutes(new Date(t));
    if (off2 !== off) t = guess - off2 * 60000;
    return new Date(t);
}

function parisLabel(date) {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
    }).format(date);
}

function parisDateKey(date) {
    return date.toLocaleDateString('en-CA', {timeZone: TZ});
}

function* eachDate(from, to) {
    const [y, m, d] = from.split('-').map(Number);
    const [y2, m2, d2] = to.split('-').map(Number);
    const end = Date.UTC(y2, m2 - 1, d2);
    for (let t = Date.UTC(y, m - 1, d); t <= end; t += 86400000) {
        const dt = new Date(t);
        yield {iso: dt.toISOString().slice(0, 10), weekday: dt.getUTCDay()};
    }
}

function addDays(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function daysBetween(from, to) {
    const a = from.split('-').map(Number);
    const b = to.split('-').map(Number);
    return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
}

// ============================================================================
// SLOT PLANNING (pure)
// ============================================================================

function planSlots(o) {
    const slots = [];
    const step = (o.lengthMin + o.gapMin) * 60000;
    for (const {iso, weekday} of eachDate(o.from, o.to)) {
        if (!o.weekdays.includes(weekday)) continue;
        const winStart = parisToUtc(iso, o.startTime).getTime();
        const winEnd = parisToUtc(iso, o.endTime).getTime();
        for (let t = winStart; t + o.lengthMin * 60000 <= winEnd; t += step) {
            slots.push({start: new Date(t), end: new Date(t + o.lengthMin * 60000)});
        }
    }
    return slots;
}

function slotId(category, start) {
    return `${category}_${start.toISOString().slice(0, 16).replace(/[-:T]/g, '')}`;
}

function markConflicts(slots, existing, category, gapMin) {
    const gap = Math.max(gapMin, MIN_GAP_MIN) * 60000;
    return slots.map((s) => {
        const id = slotId(category, s.start);
        if (existing.some((e) => e.id === id)) return {...s, id, status: 'exists'};
        const clash = existing.find((e) =>
            s.start.getTime() < e.end.getTime() + gap && e.start.getTime() < s.end.getTime() + gap);
        if (clash) return {...s, id, status: 'conflict', with: clash.name};
        return {...s, id, status: 'new'};
    });
}

function longestRun(slots, gapMin) {
    let best = 0;
    let run = 0;
    slots.forEach((s, i) => {
        const prev = slots[i - 1];
        run = prev && s.start.getTime() - prev.end.getTime() <= gapMin * 60000 ? run + 1 : 1;
        if (run > best) best = run;
    });
    return best;
}

// ============================================================================
// UI HELPERS
// ============================================================================

function say(text, kind) {
    const m = $('message');
    m.textContent = text || '';
    m.className = kind || '';
}

function cell(text, className) {
    const td = document.createElement('td');
    td.textContent = text;
    if (className) td.className = className;
    return td;
}

function button(label, onClick, disabled) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.disabled = !!disabled;
    b.addEventListener('click', onClick);
    return b;
}

// ============================================================================
// OPEN SLOTS
// ============================================================================

let plannedSlots = [];
let plannedMeta = null;

async function loadExisting(from, to) {
    const q = query(
        collection(db, 'sessions'),
        where('startsAt', '>=', Timestamp.fromDate(from)),
        where('startsAt', '<', Timestamp.fromDate(to)),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        const data = d.data();
        const start = data.startsAt.toDate();
        return {
            id: d.id,
            name: data.name || d.id,
            start,
            end: new Date(start.getTime() + (data.durationMin || 20) * 60000),
        };
    });
}

async function previewSlots(event) {
    event.preventDefault();
    say('');
    $('createSlots').hidden = true;

    const category = $('slotCategory').value;
    const from = $('slotFrom').value;
    const to = $('slotTo').value;
    const startTime = $('slotStart').value;
    const endTime = $('slotEnd').value;
    const lengthMin = Number($('slotLength').value);
    const stepMin = Number($('slotStep').value);
    const gapMin = stepMin - lengthMin;
    const weekdays = [...document.querySelectorAll('input[name="weekday"]:checked')]
        .map((c) => Number(c.value));

    if (to < from) return say('"To" is before "From".', 'error');
    if (daysBetween(from, to) > MAX_RANGE_DAYS) return say(`Keep the range under ${MAX_RANGE_DAYS} days.`, 'error');
    if (endTime <= startTime) return say('The window must end after it starts.', 'error');
    if (weekdays.length === 0) return say('Pick at least one day.', 'error');
    if (gapMin < MIN_GAP_MIN) return say(`Lessons must start at least ${lengthMin + MIN_GAP_MIN} minutes apart (${lengthMin} min lesson + ${MIN_GAP_MIN} min gap).`, 'error');

    const raw = planSlots({from, to, weekdays, startTime, endTime, lengthMin, gapMin});
    if (raw.length === 0) return say('No slots fit in that window.', 'error');

    try {
        const existing = await loadExisting(
            new Date(raw[0].start.getTime() - 3600000),
            new Date(raw[raw.length - 1].end.getTime() + 3600000));
        plannedSlots = markConflicts(raw, existing, category, gapMin);
    } catch (error) {
        console.error(error);
        return say('Could not read the existing sessions: ' + error.message, 'error');
    }
    plannedMeta = {category, lengthMin};

    const list = $('preview');
    list.textContent = '';
    plannedSlots.forEach((s) => {
        const li = document.createElement('li');
        li.className = s.status;
        const note = s.status === 'exists' ? ' (already exists, skipped)'
            : s.status === 'conflict' ? ` (too close to "${s.with}", skipped)` : '';
        li.textContent = `${parisLabel(s.start)} – ${lengthMin} min${note}`;
        list.appendChild(li);
    });

    const fresh = plannedSlots.filter((s) => s.status === 'new');
    $('previewSummary').textContent =
        `${fresh.length} new, ${plannedSlots.length - fresh.length} skipped. ` +
        `Longest run without a break: ${longestRun(fresh, gapMin)} lessons.`;
    $('createSlots').hidden = fresh.length === 0;
    $('createSlots').textContent = `Create ${fresh.length} slots`;
}

async function createSlots() {
    const fresh = plannedSlots.filter((s) => s.status === 'new');
    if (fresh.length === 0) return;
    const {category, lengthMin} = plannedMeta;
    $('createSlots').disabled = true;
    say('Creating…');

    try {
        for (let i = 0; i < fresh.length; i += 400) {
            const batch = writeBatch(db);
            fresh.slice(i, i + 400).forEach((s) => {
                const data = {
                    category,
                    name: category === 'trial' ? 'Free trial' : 'Private lesson',
                    level: '',
                    startsAt: Timestamp.fromDate(s.start),
                    durationMin: lengthMin,
                    capacity: 1,
                    bookedCount: 0,
                    active: true,
                };
                if (category === 'private') data.credits = 1;
                batch.set(doc(db, 'sessions', s.id), data);
            });
            await batch.commit();
        }
        say(`Created ${fresh.length} slots.`, 'ok');
        $('preview').textContent = '';
        $('previewSummary').textContent = '';
        $('createSlots').hidden = true;
        await loadSessions();
    } catch (error) {
        console.error(error);
        say('Could not create the slots: ' + error.message, 'error');
    } finally {
        $('createSlots').disabled = false;
    }
}

// ============================================================================
// BLOCKED DATES
// ============================================================================

async function loadBlackouts() {
    const snap = await getDoc(doc(db, 'settings', 'schedule'));
    const dates = ((snap.exists() && snap.data().blackoutDates) || []).slice().sort();
    const list = $('blackoutList');
    list.textContent = '';
    dates.forEach((d) => {
        const li = document.createElement('li');
        li.append(d + ' ');
        li.appendChild(button('Remove', async () => {
            try {
                await setDoc(doc(db, 'settings', 'schedule'), {blackoutDates: arrayRemove(d)}, {merge: true});
                await loadBlackouts();
                say(`${d} is no longer blocked. Re-open the slots you want for that day.`, 'ok');
            } catch (error) {
                say('Could not remove the date: ' + error.message, 'error');
            }
        }));
        list.appendChild(li);
    });
    if (dates.length === 0) list.textContent = 'No blocked dates.';
}

async function blockDates(event) {
    event.preventDefault();
    const from = $('blockFrom').value;
    const to = $('blockTo').value;
    if (to < from) return say('"To" is before "From".', 'error');
    if (daysBetween(from, to) > MAX_RANGE_DAYS) return say(`Keep the range under ${MAX_RANGE_DAYS} days.`, 'error');

    const dates = [...eachDate(from, to)].map((d) => d.iso);
    say('Blocking…');
    try {
        await setDoc(doc(db, 'settings', 'schedule'),
            {blackoutDates: arrayUnion(...dates)}, {merge: true});

        const q = query(
            collection(db, 'sessions'),
            where('startsAt', '>=', Timestamp.fromDate(parisToUtc(from, '00:00'))),
            where('startsAt', '<', Timestamp.fromDate(parisToUtc(addDays(to, 1), '00:00'))),
        );
        const snap = await getDocs(q);
        const booked = [];
        const toClose = [];
        snap.docs.forEach((d) => {
            const data = d.data();
            if (data.active === false) return;
            if ((data.bookedCount || 0) > 0) booked.push(`${parisLabel(data.startsAt.toDate())} ${data.name || ''}`);
            else toClose.push(d.ref);
        });
        for (let i = 0; i < toClose.length; i += 400) {
            const batch = writeBatch(db);
            toClose.slice(i, i + 400).forEach((ref) => batch.update(ref, {active: false}));
            await batch.commit();
        }
        const tail = booked.length
            ? ` ${booked.length} booked session(s) were NOT touched and need cancelling by hand: ${booked.join('; ')}`
            : '';
        say(`Blocked ${dates.length} day(s), closed ${toClose.length} empty session(s).${tail}`,
            booked.length ? 'error' : 'ok');
        await loadBlackouts();
        await loadSessions();
    } catch (error) {
        console.error(error);
        say('Could not block the dates: ' + error.message, 'error');
    }
}

// ============================================================================
// SESSION LIST
// ============================================================================

async function loadSessions(event) {
    if (event) event.preventDefault();
    const from = $('listFrom').value;
    const to = $('listTo').value;
    const category = $('listCategory').value;
    if (!from || !to || to < from) return;

    const q = query(
        collection(db, 'sessions'),
        where('startsAt', '>=', Timestamp.fromDate(parisToUtc(from, '00:00'))),
        where('startsAt', '<', Timestamp.fromDate(parisToUtc(addDays(to, 1), '00:00'))),
        orderBy('startsAt'),
    );
    const body = document.querySelector('#sessionTable tbody');
    try {
        const snap = await getDocs(q);
        body.textContent = '';
        snap.docs
            .map((d) => ({id: d.id, ref: d.ref, ...d.data()}))
            .filter((s) => !category || s.category === category)
            .forEach((s) => {
                const tr = document.createElement('tr');
                const booked = s.bookedCount || 0;
                tr.appendChild(cell(parisLabel(s.startsAt.toDate())));
                tr.appendChild(cell(s.name || ''));
                tr.appendChild(cell(s.category || ''));
                tr.appendChild(cell(`${booked}/${s.capacity || 0}`));
                tr.appendChild(cell(s.active === false ? 'Blocked' : 'Open', s.active === false ? 'inactive' : ''));

                const actions = document.createElement('td');
                if (booked > 0) {
                    actions.textContent = 'Booked: cancelling with a refund comes with the credits function';
                } else {
                    actions.appendChild(button(s.active === false ? 'Open' : 'Block', async () => {
                        try {
                            await updateDoc(s.ref, {active: s.active === false});
                            await loadSessions();
                        } catch (error) {
                            say('Could not update: ' + error.message, 'error');
                        }
                    }));
                    actions.appendChild(button('Delete', async () => {
                        if (!window.confirm('Delete this session for good?')) return;
                        try {
                            await deleteDoc(s.ref);
                            await loadSessions();
                        } catch (error) {
                            say('Could not delete: ' + error.message, 'error');
                        }
                    }));
                }
                tr.appendChild(actions);
                body.appendChild(tr);
            });
        if (!body.children.length) {
            const tr = document.createElement('tr');
            const td = cell('No sessions in that range.');
            td.colSpan = 6;
            tr.appendChild(td);
            body.appendChild(tr);
        }
    } catch (error) {
        console.error(error);
        say('Could not load sessions: ' + error.message, 'error');
    }
}

// ============================================================================
// START
// ============================================================================

function startPanel() {
    const today = parisDateKey(new Date());
    ['slotFrom', 'blockFrom', 'listFrom'].forEach((id) => { $(id).value = today; });
    ['slotTo', 'blockTo'].forEach((id) => { $(id).value = today; });
    $('listTo').value = addDays(today, 28);

    $('slotForm').addEventListener('submit', previewSlots);
    $('createSlots').addEventListener('click', createSlots);
    $('blockForm').addEventListener('submit', blockDates);
    $('listForm').addEventListener('submit', loadSessions);

    loadBlackouts().catch((e) => say('Could not read blocked dates: ' + e.message, 'error'));
    loadSessions();
}

let started = false;
onAuthStateChanged(auth, (user) => {
    const gate = $('gate');
    if (ADMIN_UID.includes('REPLACE')) {
        gate.textContent = 'Setup needed: paste your Firebase uid into ADMIN_UID in admin.js.';
        return;
    }
    if (!user) {
        gate.innerHTML = '';
        const a = document.createElement('a');
        a.href = '/?openModal=auth-modal';
        a.textContent = 'Sign in';
        gate.append(a, ' to continue.');
        $('panel').hidden = true;
        return;
    }
    if (user.uid !== ADMIN_UID) {
        gate.textContent = 'This page is only for the site owner.';
        $('panel').hidden = true;
        return;
    }
    gate.textContent = `Signed in as ${user.email}`;
    $('panel').hidden = false;
    if (!started) {
        started = true;
        startPanel();
    }
});

export {parisToUtc, planSlots, markConflicts, slotId, longestRun};