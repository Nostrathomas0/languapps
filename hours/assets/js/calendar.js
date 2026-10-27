// hours/assets/js/calendar.js
// Rolling 28-day class calendar for /hours.
// Sessions come live from Firestore (public read). The day pop-out reuses the
// CodyHouse modal animation and styles from style.css.
//
// Add ?demo=1 to the URL to preview the layout with made-up sessions and no
// Firebase connection.

(function () {
  'use strict';

  const WINDOW_DAYS = 28;
  const PARIS = 'Europe/Paris';
  const PRODUCT_CATEGORY = 'quick-lesson'; // the €19.90 promo classes
  const DEMO = new URLSearchParams(window.location.search).get('demo') === '1';
  const MODAL_MAX_W = 800;
  const MODAL_MAX_H = 480;

  const root = document.getElementById('cd-cal');
  const gridEl = document.getElementById('cal-grid');
  const statusEl = document.getElementById('cal-status');
  const modal = root.querySelector('.cd-schedule-modal');
  const modalHeader = root.querySelector('.cd-schedule-modal__header');
  const modalHeaderBg = root.querySelector('.cd-schedule-modal__header-bg');
  const modalBody = root.querySelector('.cd-schedule-modal__body');
  const modalBodyBg = root.querySelector('.cd-schedule-modal__body-bg');
  const modalClose = root.querySelector('.cd-schedule-modal__close');
  const modalDate = root.querySelector('.cd-schedule-modal__date');
  const modalName = root.querySelector('.cd-schedule-modal__name');
  const modalInfo = root.querySelector('.cd-schedule-modal__event-info');
  const coverLayer = root.querySelector('.cd-schedule__cover-layer');

  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || PARIS;
  const tzLabel = document.getElementById('cal-tz');
  if (tzLabel) tzLabel.textContent = userTz.replace(/_/g, ' ');

  const timeFmt = (tz) => new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz,
  });
  const localTime = timeFmt(userTz);
  const parisTime = timeFmt(PARIS);
  const longDay = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const shortDay = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const monthShort = new Intl.DateTimeFormat('en-GB', {month: 'short'});

  let sessions = [];
  let byDay = new Map();
  let selectedCell = null;
  let selectedKey = null;
  let animating = false;
  let renderPending = false;
  let cartApi = null; // set once the cart has loaded
  let cartState = {user: null, booking: null, picks: []};

  // ---------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function keyOf(date) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
  }

  function windowBounds() {
    const today = startOfDay(new Date());
    return {
      today,
      lastDay: addDays(today, WINDOW_DAYS - 1),
      end: addDays(today, WINDOW_DAYS),
    };
  }

  // Monday on or before today, through the Sunday on or after the last day.
  function buildCells(today, lastDay) {
    const start = addDays(today, -((today.getDay() + 6) % 7));
    const end = addDays(lastDay, 6 - ((lastDay.getDay() + 6) % 7));
    const cells = [];
    for (let d = start; d <= end; d = addDays(d, 1)) cells.push(d);
    return cells;
  }

  function colorFor(s) {
    if (/^event-[1-4]$/.test(s.color || '')) return s.color;
    const key = String(s.classId || s.name || '');
    let h = 0;
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return 'event-' + (1 + (h % 4));
  }

  function spotsInfo(s) {
    const left = Math.max(0, (s.capacity || 0) - (s.bookedCount || 0));
    if (left === 0) return {text: 'Full', cls: 'cd-cal__spots--full'};
    return {
      text: left + (left === 1 ? ' spot left' : ' spots left'),
      cls: left <= 2 ? 'cd-cal__spots--low' : '',
    };
  }

  function timeLabel(date) {
    const mine = localTime.format(date);
    const paris = parisTime.format(date);
    return {
      chip: mine,
      long: mine === paris ?
        `${mine} · Paris time` : `${mine} your time · ${paris} Paris`,
    };
  }

  // ---------------------------------------------------------------------
  // grid
  // ---------------------------------------------------------------------

  function groupByDay() {
    byDay = new Map();
    sessions.forEach((s) => {
      const k = keyOf(s.startsAt);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k).push(s);
    });
    byDay.forEach((list) => list.sort((a, b) => a.startsAt - b.startsAt));
  }

  function renderGrid() {
    renderPending = false;
    groupByDay();
    const {today, lastDay} = windowBounds();

    gridEl.replaceChildren();
    buildCells(today, lastDay).forEach((d, i) => {
      const key = keyOf(d);
      const list = byDay.get(key) || [];
      const inWindow = d >= today && d <= lastDay;

      const cell = el('button', 'cd-cal__day');
      cell.type = 'button';
      cell.dataset.key = key;
      if (!inWindow) cell.classList.add('cd-cal__day--muted');
      else if (!list.length) cell.classList.add('cd-cal__day--empty');
      if (d.getTime() === today.getTime()) {
        cell.classList.add('cd-cal__day--today');
      }

      const showMonth = d.getDate() === 1 || i === 0;
      cell.append(
          el('span', 'cd-cal__daynum',
          showMonth ? `${d.getDate()} ${monthShort.format(d)}` : d.getDate()),
          el('span', 'cd-cal__daylabel', shortDay.format(d)),
      );

      if (inWindow && list.length) {
        const chips = el('span', 'cd-cal__chips');
        list.forEach((s) => {
          const picked = inCart(s);
          const chip = el('span', 'cd-cal__chip' +
              (picked ? ' cd-cal__chip--picked' : ''),
          `${picked ? '✓ ' : ''}${timeLabel(s.startsAt).chip} ${s.name}`);
          chip.dataset.event = colorFor(s);
          chips.append(chip);
        });
        cell.append(chips);
        if (list.length > 3) {
          cell.append(el('span', 'cd-cal__more', `+${list.length - 3} more`));
        }
        cell.setAttribute('aria-label',
            `${longDay.format(d)}, ${list.length} ` +
            (list.length === 1 ? 'class' : 'classes'));
        cell.addEventListener('click', () => openModal(cell, d, key));
      } else {
        cell.disabled = true;
      }
      gridEl.append(cell);
    });

    if (DEMO) {
      statusEl.textContent = 'Demo data: these are not real classes.';
    } else if (sessions.length === 0) {
      statusEl.textContent = 'No classes are scheduled yet. Check back soon.';
    } else {
      statusEl.textContent = `${sessions.length} ` +
        (sessions.length === 1 ? 'class' : 'classes') +
        ' in the next 4 weeks. Tap a day for details.';
    }
  }

  // ---------------------------------------------------------------------
  // pop-out panel (CodyHouse animation, driven by the clicked day cell)
  // ---------------------------------------------------------------------

  function mq() {
    return window.getComputedStyle(root, '::before')
        .getPropertyValue('content').replace(/'|"/g, '');
  }

  function isOpen() {
    return modal.classList.contains('cd-schedule-modal--open');
  }

  function sessionRow(s) {
    const row = el('div', 'cd-cal__session');
    row.dataset.event = colorFor(s);

    const main = el('div', 'cd-cal__session-main');
    main.append(el('strong', 'cd-cal__session-name', s.name));
    const meta = [s.level, s.durationMin ? `${s.durationMin} min` : '']
        .filter(Boolean).join(' · ');
    if (meta) main.append(el('span', 'cd-cal__session-meta', meta));
    main.append(el('span', 'cd-cal__session-time',
        timeLabel(s.startsAt).long));
    if (s.description) {
      main.append(el('span', 'cd-cal__session-meta', s.description));
    }

    const spots = spotsInfo(s);
    const side = el('div', 'cd-cal__side');
    side.append(el('span', 'cd-cal__spots ' + spots.cls, spots.text));
    const action = actionFor(s, main);
    if (action) side.append(action);
    row.append(main, side);
    return row;
  }

  function inCart(s) {
    return !!(cartState.booking && cartState.booking.sessionIds.includes(s.id));
  }

  const MESSAGES = {
    full: 'That class just filled up.',
    limit: 'Your cart already has 2 classes.',
    locked: 'Your cart is waiting for payment. Edit it first.',
    duplicate: 'That class is already in your cart.',
    category: 'This class is not part of the €19.90 offer.',
    auth: 'Please log in first.',
    inactive: 'This class was cancelled.',
    missing: 'That class is no longer available.',
  };

  // The Add / Remove control for one session, or a short reason why not.
  function actionFor(s, main) {
    if (!cartApi) return null;
    if (s.category !== PRODUCT_CATEGORY) {
      return el('span', 'cd-cal__msg', 'Booking opens soon.');
    }
    if (!cartState.user) {
      const link = el('a', 'cd-cal__btn', 'Log in to add');
      link.href = '/?openModal=auth-modal';
      link.target = '_top';
      return link;
    }
    const mine = inCart(s);
    const locked = cartState.booking && cartState.booking.status !== 'pending';
    const full = Math.max(0, (s.capacity || 0) - (s.bookedCount || 0)) === 0;
    const cartFull = cartState.booking &&
      cartState.booking.sessionIds.length >= cartApi.MAX_ITEMS;

    if (!mine && full) return null;
    const button = el('button',
        'cd-cal__btn' + (mine ? ' cd-cal__btn--remove' : ''),
        locked ? 'In checkout' : mine ? 'Remove' : cartFull ? 'Cart full' : 'Add');
    button.type = 'button';
    button.disabled = !!locked || (!mine && !!cartFull);
    button.addEventListener('click', async () => {
      button.disabled = true;
      const result = await cartApi[mine ? 'remove' : 'add'](s.id);
      if (!result.ok) {
        button.disabled = false;
        const old = main.querySelector('.cd-cal__msg');
        if (old) old.remove();
        main.append(el('span', 'cd-cal__msg',
            MESSAGES[result.code] || 'Could not update your cart. Try again.'));
      }
    });
    return button;
  }

  function renderPanel() {
    const list = byDay.get(selectedKey) || [];
    const wrap = el('div');
    list.forEach((s) => wrap.append(sessionRow(s)));
    if (!cartApi) {
      wrap.append(el('p', 'cd-cal__note', 'Booking opens soon.'));
    }
    modalInfo.replaceChildren(wrap);
    modalDate.textContent = `${list.length} ` +
      (list.length === 1 ? 'class' : 'classes');
  }

  // Runs fn once the element's transition ends, or after a safety delay so
  // a missed transitionend can never leave the panel stuck.
  function whenDone(node, fn) {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      node.removeEventListener('transitionend', onEnd);
      fn();
    };
    const onEnd = (e) => {
      if (e.target === node) run();
    };
    node.addEventListener('transitionend', onEnd);
    setTimeout(run, 900);
  }

  function openModal(cell, date, key) {
    if (animating) return;
    animating = true;
    selectedCell = cell;
    selectedKey = key;

    modalName.textContent = longDay.format(date);
    modal.setAttribute('data-event', 'event-1');
    renderPanel();

    modal.classList.add('cd-schedule-modal--open',
        'cd-schedule-modal--content-loaded');
    setTimeout(() => cell.classList.add('cd-cal__day--selected'), 10);

    if (mq() === 'mobile') {
      whenDone(modal, () => {
        animating = false;
      });
      return;
    }

    const pos = cell.getBoundingClientRect();
    const eventTop = pos.top;
    const eventLeft = pos.left;
    const eventHeight = cell.offsetHeight;
    const eventWidth = cell.offsetWidth;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const modalWidth = winW * 0.8 > MODAL_MAX_W ? MODAL_MAX_W : winW * 0.8;
    const modalHeight = winH * 0.8 > MODAL_MAX_H ? MODAL_MAX_H : winH * 0.8;
    const moveX = parseInt((winW - modalWidth) / 2 - eventLeft, 10);
    const moveY = parseInt((winH - modalHeight) / 2 - eventTop, 10);
    const scaleY = modalHeight / eventHeight;
    const scaleX = modalWidth - eventWidth;

    modal.setAttribute('style',
        `top:${eventTop}px;left:${eventLeft}px;height:${modalHeight}px;` +
        `width:${modalWidth}px;transform: translateY(${moveY}px) ` +
        `translateX(${moveX}px)`);
    modalHeader.setAttribute('style', `width:${eventWidth}px`);
    modalBody.setAttribute('style', `margin-left:${eventWidth}px`);
    modalBodyBg.setAttribute('style',
        `height:${eventHeight}px; width: 1px; ` +
        `transform: scaleY(${scaleY}) scaleX(${scaleX})`);
    modalHeaderBg.setAttribute('style',
        `height: ${eventHeight}px; width: ${eventWidth}px; ` +
        `transform: scaleY(${scaleY})`);

    whenDone(modalHeaderBg, () => {
      animating = false;
      modal.classList.add('cd-schedule-modal--animation-completed');
    });
  }

  function finishClose() {
    if (selectedCell) selectedCell.classList.remove('cd-cal__day--selected');
    modal.classList.remove('cd-schedule-modal--content-loaded');
    selectedCell = null;
    selectedKey = null;
    animating = false;
    if (renderPending) renderGrid();
  }

  function closeModal() {
    if (animating || !isOpen() || !selectedCell) return;
    animating = true;
    const cell = selectedCell;

    if (mq() === 'mobile') {
      modal.classList.remove('cd-schedule-modal--open');
      whenDone(modal, finishClose);
      return;
    }

    const pos = cell.getBoundingClientRect();
    const style = window.getComputedStyle(modal);
    const modalTop = Number(style.getPropertyValue('top').replace('px', ''));
    const modalLeft = Number(style.getPropertyValue('left').replace('px', ''));
    const moveX = pos.left - modalLeft;
    const moveY = pos.top - modalTop;

    modal.classList.remove('cd-schedule-modal--open',
        'cd-schedule-modal--animation-completed');
    modal.style.width = cell.offsetWidth + 'px';
    modal.style.height = cell.offsetHeight + 'px';
    modal.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`;
    modalBodyBg.style.transform = 'scaleX(0) scaleY(1)';
    modalHeaderBg.style.transform = 'scaleY(1)';

    whenDone(modalHeaderBg, () => {
      modal.classList.add('cd-schedule-modal--no-transition');
      setTimeout(() => {
        [modal, modalBody, modalHeader, modalHeaderBg, modalBodyBg]
            .forEach((node) => node.removeAttribute('style'));
      }, 10);
      setTimeout(() => {
        modal.classList.remove('cd-schedule-modal--no-transition');
      }, 20);
      finishClose();
    });
  }

  // On resize the animation geometry is stale, so just snap everything shut.
  function resetModal() {
    modal.classList.remove('cd-schedule-modal--open',
        'cd-schedule-modal--animation-completed',
        'cd-schedule-modal--content-loaded');
    [modal, modalBody, modalHeader, modalHeaderBg, modalBodyBg]
        .forEach((node) => node.removeAttribute('style'));
    finishClose();
  }

  modalClose.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  });
  coverLayer.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  window.addEventListener('resize', () => {
    if (isOpen()) resetModal();
  });

  // ---------------------------------------------------------------------
  // data
  // ---------------------------------------------------------------------

  function onData(list) {
    sessions = list;
    if (isOpen() && selectedKey) {
      // keep the open panel live (spots left) and redraw the grid afterwards
      groupByDay();
      renderPanel();
      renderPending = true;
    } else {
      renderGrid();
    }
  }

  async function loadFromFirestore() {
    const {db} = await import('/assets/js/firebaseInit.js');
    const fs = await import(
        'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js');
    const {today, end} = windowBounds();

    // A range on one field needs no composite index; `active` is filtered
    // in code below.
    const q = fs.query(
        fs.collection(db, 'sessions'),
        fs.where('startsAt', '>=', fs.Timestamp.fromDate(today)),
        fs.where('startsAt', '<', fs.Timestamp.fromDate(end)),
    );
    fs.onSnapshot(q, (snap) => {
      onData(snap.docs
          .map((d) => ({id: d.id, ...d.data()}))
          .filter((s) => s.active !== false && s.startsAt)
          .map((s) => ({...s, startsAt: s.startsAt.toDate()})));
    }, (error) => {
      console.error('Failed to load sessions:', error);
      statusEl.textContent =
        'The calendar is unavailable right now. Please try again shortly.';
    });
  }

  // ---------------------------------------------------------------------
  // demo data (?demo=1): made-up sessions so the layout can be previewed
  // ---------------------------------------------------------------------

  function tzOffsetMs(date, tz) {
    const parts = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(date).forEach((p) => {
      parts[p.type] = p.value;
    });
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day,
        +parts.hour, +parts.minute, +parts.second);
    return asUtc - (date.getTime() - date.getMilliseconds());
  }

  function parisToDate(y, m, d, h, min) {
    const guess = Date.UTC(y, m, d, h, min);
    const first = tzOffsetMs(new Date(guess), PARIS);
    const second = tzOffsetMs(new Date(guess - first), PARIS);
    return new Date(guess - second);
  }

  function demoSessions() {
    const templates = [
      {id: 'ielts-speaking', name: 'IELTS Speaking', level: 'Upper Intermediate', day: 1, time: '09:00', color: 'event-1'},
      {id: 'ielts-writing', name: 'IELTS Writing', level: 'Upper Intermediate', day: 1, time: '09:30', color: 'event-1'},
      {id: 'contemporary', name: 'Contemporary Expression', level: 'Intermediate', day: 2, time: '09:00', color: 'event-4'},
      {id: 'question-answer', name: 'Question & Answer', level: 'Beginner', day: 2, time: '09:30', color: 'event-4'},
      {id: 'word-pron', name: 'Word Pronunciation', level: 'Beginner', day: 4, time: '09:00', color: 'event-3'},
      {id: 'phrase-pron', name: 'Phrase Pronunciation', level: 'Elementary', day: 4, time: '09:30', color: 'event-3'},
      {id: 'accent', name: 'Accent Adjustment', level: 'Advanced', day: 5, time: '09:00', color: 'event-2'},
      {id: 'camera', name: 'Speaking on Camera', level: 'Intermediate', day: 5, time: '09:30', color: 'event-2'},
      {id: 'weekend-lab', name: 'Weekend Pronunciation Lab', level: 'Pre-Intermediate', day: 6, time: '10:00', color: 'event-3'},
    ];
    const {today, lastDay} = windowBounds();
    const out = [];
    for (let d = today; d <= lastDay; d = addDays(d, 1)) {
      templates.filter((t) => t.day === d.getDay()).forEach((t) => {
        const [h, min] = t.time.split(':').map(Number);
        let seed = 7;
        for (const c of t.id + keyOf(d)) seed = (seed * 31 + c.charCodeAt(0)) % 97;
        out.push({
          id: `${t.id}_${keyOf(d)}`,
          classId: t.id,
          name: t.name,
          level: t.level,
          color: t.color,
          category: t.id === 'weekend-lab' ? 'workshop' : 'quick-lesson',
          startsAt: parisToDate(d.getFullYear(), d.getMonth(), d.getDate(), h, min),
          durationMin: 20,
          capacity: 5,
          bookedCount: seed % 6,
        });
      });
    }
    return out;
  }

  // ---------------------------------------------------------------------

  // In-memory stand-in for the real cart, used only by ?demo=1.
  function demoCart() {
    const state = {user: {uid: 'demo'}, booking: null, picks: []};
    const subs = new Set();
    const emit = () => subs.forEach((fn) => fn({...state, max: 2}));
    const find = (id) => sessions.find((s) => s.id === id);
    return {
      MAX_ITEMS: 2,
      subscribe(fn) {
        subs.add(fn);
        fn({...state, max: 2});
      },
      async add(id) {
        const s = find(id);
        if (!state.booking) {
          state.booking = {id: 'demo', sessionIds: [], status: 'pending'};
        }
        if (state.booking.sessionIds.length >= 2) return {ok: false, code: 'limit'};
        if ((s.bookedCount || 0) >= s.capacity) return {ok: false, code: 'full'};
        s.bookedCount += 1;
        state.booking.sessionIds.push(id);
        emit();
        onData(sessions.slice());
        return {ok: true};
      },
      async remove(id) {
        const s = find(id);
        s.bookedCount = Math.max(0, s.bookedCount - 1);
        state.booking.sessionIds = state.booking.sessionIds.filter((x) => x !== id);
        emit();
        onData(sessions.slice());
        return {ok: true};
      },
    };
  }

  async function loadCart() {
    if (DEMO) {
      cartApi = demoCart();
    } else {
      try {
        cartApi = (await import('/assets/js/cart.js')).cart;
      } catch (error) {
        console.error('The cart could not be loaded:', error);
        return;
      }
    }
    cartApi.subscribe((state) => {
      cartState = state;
      if (isOpen() && selectedKey) {
        renderPanel();
        renderPending = true;
      } else if (sessions.length || DEMO) {
        renderGrid();
      }
    });
  }

  if (DEMO) {
    onData(demoSessions());
  } else {
    loadFromFirestore();
  }
  loadCart();
})();