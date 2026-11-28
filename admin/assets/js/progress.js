// admin/assets/js/progress.js
// Student progress for the admin page: a list of students and one student's
// report (by topic, questions they get wrong, recent answers). The data comes
// from the admin-only /admin/students function; nothing is shown to others.
import { auth, onAuthStateChanged } from '/assets/js/firebaseInit.js';

const ADMIN_UID = 'v8Zomt6yfhheZexXQJCCm6b2v502';
const API = 'https://us-central1-languapps.cloudfunctions.net/app';

const $ = (id) => document.getElementById(id);

function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'class') node.className = v;
        else if (k === 'onclick') node.addEventListener('click', v);
        else node.setAttribute(k, v);
    });
    children.flat().forEach((c) => {
        if (c === null || c === undefined) return;
        node.append(c instanceof Node ? c : String(c));
    });
    return node;
}

function when(ms) {
    if (!ms) return '—';
    const days = Math.floor((Date.now() - ms) / 86400000);
    const date = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris', day: 'numeric', month: 'short',
    }).format(new Date(ms));
    if (days <= 0) return `today (${date})`;
    if (days === 1) return `yesterday (${date})`;
    return `${days} days ago (${date})`;
}

// Answers are saved as text; arrays and objects arrive as JSON
function readable(value) {
    if (!value) return '';
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed.map((p) => (typeof p === 'object' ? JSON.stringify(p) : p)).join(' / ');
        }
        if (parsed && typeof parsed === 'object') {
            return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return String(parsed);
    } catch (e) {
        return value;
    }
}

const where = (x) => [x.level, x.topic, x.page ? `p${x.page}` : ''].filter(Boolean).join(' · ');

async function call(path) {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

let students = [];

function renderList() {
    const filter = $('studentFilter').value.trim().toLowerCase();
    const body = $('studentTable').querySelector('tbody');
    body.innerHTML = '';
    const shown = students.filter((s) => !filter
        || s.email.toLowerCase().includes(filter) || s.name.toLowerCase().includes(filter));
    shown.forEach((s) => {
        body.append(el('tr', {},
            el('td', {}, s.name ? `${s.name} ` : '', el('span', { class: 'muted' }, s.email || s.uid)),
            el('td', {}, when(s.lastActive)),
            el('td', {}, `${s.pagesCompleted} / ${s.pagesStarted}`),
            el('td', {}, `${s.averageScore}%`),
            el('td', {}, el('button', { type: 'button', onclick: () => openReport(s.uid) }, 'Report')),
        ));
    });
    $('studentCount').textContent = students.length
        ? `${shown.length} of ${students.length} students`
        : 'No student progress saved yet.';
}

async function loadStudents() {
    $('studentCount').textContent = 'Loading…';
    try {
        const data = await call('/admin/students');
        students = data.students || [];
        renderList();
    } catch (e) {
        $('studentCount').textContent = `Could not load students (${e.message}).`;
    }
}

function table(headers, rows) {
    return el('table', {},
        el('thead', {}, el('tr', {}, headers.map((h) => el('th', {}, h)))),
        el('tbody', {}, rows));
}

async function openReport(uid) {
    const box = $('report');
    box.hidden = false;
    box.innerHTML = '';
    box.append(el('p', {}, 'Loading report…'));
    box.scrollIntoView({ behavior: 'smooth' });
    let r;
    try {
        r = await call(`/admin/students/${encodeURIComponent(uid)}`);
    } catch (e) {
        box.innerHTML = '';
        box.append(el('p', { class: 'error' }, `Could not load the report (${e.message}).`));
        return;
    }
    const s = r.summary;
    box.innerHTML = '';
    box.append(
        el('div', { class: 'report-head' },
            el('h2', {}, r.student.name || r.student.email || uid),
            el('div', { class: 'no-print' },
                el('button', { type: 'button', onclick: () => window.print() }, 'Print / PDF'),
                ' ',
                el('button', { type: 'button', onclick: () => { box.hidden = true; } }, 'Close'))),
        el('p', { class: 'muted' }, r.student.email, ` · last active ${when(s.lastActive)}`),
        el('ul', { class: 'stats' },
            el('li', {}, el('strong', {}, `${s.accuracy}%`), ' answers right'),
            el('li', {}, el('strong', {}, s.answers), ' answers'),
            el('li', {}, el('strong', {}, `${s.pagesCompleted} / ${s.pagesStarted}`), ' pages finished'),
            el('li', {}, el('strong', {}, `${s.averageScore}%`), ' average page score')),
        s.truncated ? el('p', { class: 'muted' }, 'Based on their most recent 2,000 answers.') : '',

        el('h3', {}, 'By topic'),
        r.byTopic.length ? table(
            ['Topic', 'Pages finished', 'Page score', 'Answers right / wrong', 'Last active'],
            r.byTopic.map((t) => el('tr', {},
                el('td', {}, `${t.level} · ${t.topic}`),
                el('td', {}, `${t.pagesCompleted} / ${t.pagesStarted}`),
                el('td', {}, `${t.averageScore}%`),
                el('td', {}, `${t.right} / `, el('span', { class: t.wrong ? 'bad' : '' }, t.wrong)),
                el('td', {}, when(t.lastActive))))) : el('p', {}, 'Nothing yet.'),

        el('h3', {}, 'Questions they get wrong'),
        r.weakSpots.length ? table(
            ['Where', 'Question', 'Their answer', 'Correct answer', 'Wrong', 'Now'],
            r.weakSpots.map((w) => el('tr', {},
                el('td', { class: 'nowrap' }, where(w)),
                el('td', {}, w.questionText || el('span', { class: 'muted' }, '(question saved before text was recorded)')),
                el('td', { class: 'bad' }, readable(w.lastWrongAnswer)),
                el('td', { class: 'good' }, readable(w.correctAnswer)),
                el('td', {}, `${w.wrongCount}×`),
                el('td', {}, w.latestCorrect ? el('span', { class: 'good' }, '✓ fixed') : el('span', { class: 'bad' }, 'still wrong'))))
        ) : el('p', {}, 'No wrong answers so far.'),

        el('h3', {}, 'Recent answers'),
        r.recent.length ? table(
            ['When', 'Where', 'Question', 'Answer', ''],
            r.recent.map((a) => el('tr', {},
                el('td', { class: 'nowrap' }, when(a.at)),
                el('td', { class: 'nowrap' }, where(a)),
                el('td', {}, a.questionText || el('span', { class: 'muted' }, a.questionId)),
                el('td', {}, readable(a.userAnswer)),
                el('td', {}, a.isCorrect ? el('span', { class: 'good' }, '✓') : el('span', { class: 'bad' }, '✗'))))
        ) : el('p', {}, 'No answers yet.'),
    );
}

let started = false;
onAuthStateChanged(auth, (user) => {
    if (!user || user.uid !== ADMIN_UID || started) return;
    started = true;
    $('studentFilter').addEventListener('input', renderList);
    $('reloadStudents').addEventListener('click', loadStudents);
    loadStudents();
});
