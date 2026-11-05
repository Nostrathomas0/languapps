// privateLessons.js: private/trial slot booking and manual credit grants.
// Registered on the Express app from index.js:
//   require("./privateLessons")(app, {admin, transporter});
// Credits and bookings are written ONLY here (Admin SDK); rules block clients.

const ADMIN_UID = "v8Zomt6yfhheZexXQJCCm6b2v502";
const OWNER_EMAIL = "thomas@languapps.com";
const MIN_NOTICE_MS = 2 * 60 * 60 * 1000; // no bookings starting within 2h

/**
 * Formats a Date as an iCalendar UTC timestamp.
 * @param {Date} d the date
 * @return {string} e.g. 20261110T143000Z
 */
function icsStamp(d) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Escapes text for HTML emails.
 * @param {string} s raw text
 * @return {string} escaped text
 */
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"})[c]);
}

module.exports = function register(app, {admin, transporter}) {
  const db = () => admin.firestore();
  const FieldValue = admin.firestore.FieldValue;

  /**
   * Verifies the Bearer Firebase ID token.
   * @param {Object} req request
   * @return {Promise<Object|null>} decoded token or null
   */
  async function authed(req) {
    const h = req.headers.authorization || "";
    if (!h.startsWith("Bearer ")) return null;
    try {
      return await admin.auth().verifyIdToken(h.slice(7));
    } catch (e) {
      return null;
    }
  }

  /**
   * Sends the student's confirmation and Thomas's notification.
   * @param {Object} o details
   * @return {Promise<void>}
   */
  async function sendEmails(o) {
    const start = o.start;
    const end = new Date(start.getTime() + o.durationMin * 60000);
    const when = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris", dateStyle: "full", timeStyle: "short",
    }).format(start) + " (Paris time)";
    const title = o.category === "trial" ?
      "Languapps free trial lesson" : "Languapps private lesson";
    const gcal = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${icsStamp(start)}/${icsStamp(end)}` +
      `&details=${encodeURIComponent("Thomas will send the ClassIn link.")}`;
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Languapps//EN",
      "METHOD:PUBLISH", "BEGIN:VEVENT",
      `UID:${o.sessionId}-${o.uid}@languapps.com`,
      `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
      `SUMMARY:${title}`, "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    try {
      await transporter.sendMail({
        from: "\"Languapps\" <thomas@languapps.com>",
        to: o.email,
        subject: `Booked: ${title}, ${when}`,
        html: `<p>You're booked.</p><p><strong>${esc(when)}</strong>, ` +
          `${o.durationMin} minutes, one to one with Thomas.</p>` +
          `<p><a href="${gcal}">Add to Google Calendar</a> ` +
          "(an .ics file is attached for other calendars).</p>" +
          "<p>Thomas will send the ClassIn link before the lesson.</p>",
        text: `You're booked: ${when}. Add to Google Calendar: ${gcal}`,
        icalEvent: {method: "PUBLISH", content: ics},
      });
      await transporter.sendMail({
        from: "\"Languapps\" <thomas@languapps.com>",
        to: OWNER_EMAIL,
        subject: `New ${o.category} booking: ${o.email}`,
        text: `${o.email} booked ${when} (${o.category}).`,
      });
    } catch (e) {
      console.error("Booking email failed:", e.message);
    }
  }

  app.post("/bookPrivateSlot", async (req, res) => {
    const user = await authed(req);
    if (!user) return res.status(401).json({ok: false, code: "auth"});
    const sessionId = String((req.body || {}).sessionId || "");
    if (!sessionId || sessionId.includes("/")) {
      return res.status(400).json({ok: false, code: "missing"});
    }
    const sRef = db().collection("sessions").doc(sessionId);
    const cRef = db().collection("credits").doc(user.uid);
    const bRef = db().collection("privateBookings")
        .doc(`${user.uid}_${sessionId}`);
    try {
      const result = await db().runTransaction(async (tx) => {
        const [sSnap, cSnap, bSnap] = await Promise.all(
            [tx.get(sRef), tx.get(cRef), tx.get(bRef)]);
        if (!sSnap.exists) return {ok: false, code: "missing"};
        const s = sSnap.data();
        if (!["private", "trial"].includes(s.category)) {
          return {ok: false, code: "category"};
        }
        if (s.active === false) return {ok: false, code: "inactive"};
        if (bSnap.exists && bSnap.data().status === "booked") {
          return {ok: false, code: "duplicate"};
        }
        const start = s.startsAt.toDate();
        if (start.getTime() - Date.now() < MIN_NOTICE_MS) {
          return {ok: false, code: "tooSoon"};
        }
        if ((s.bookedCount || 0) >= (s.capacity || 1)) {
          return {ok: false, code: "full"};
        }
        const c = cSnap.exists ? cSnap.data() : {balance: 0};
        let cost = 0;
        if (s.category === "trial") {
          if (c.trialUsed) return {ok: false, code: "trialUsed"};
        } else {
          cost = s.credits || 1;
          if ((c.balance || 0) < cost) return {ok: false, code: "credits"};
        }
        tx.update(sRef, {bookedCount: FieldValue.increment(1)});
        const patch = {updatedAt: FieldValue.serverTimestamp()};
        if (s.category === "trial") patch.trialUsed = true;
        if (cost) patch.balance = FieldValue.increment(-cost);
        tx.set(cRef, patch, {merge: true});
        if (cost) {
          tx.set(cRef.collection("ledger").doc(), {
            delta: -cost, reason: "booking", sessionId,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
        tx.set(bRef, {
          uid: user.uid, email: user.email || "", sessionId,
          category: s.category, startsAt: s.startsAt,
          durationMin: s.durationMin || 25, creditsCharged: cost,
          status: "booked", createdAt: FieldValue.serverTimestamp(),
        });
        return {
          ok: true, start, durationMin: s.durationMin || 25,
          category: s.category,
          balance: (c.balance || 0) - cost,
        };
      });
      if (!result.ok) return res.status(409).json(result);
      await sendEmails({
        uid: user.uid, email: user.email, sessionId, start: result.start,
        durationMin: result.durationMin, category: result.category,
      });
      return res.json({ok: true, balance: result.balance});
    } catch (e) {
      console.error("bookPrivateSlot failed:", e.message);
      return res.status(500).json({ok: false, code: "server"});
    }
  });

  app.post("/adminGrantCredits", async (req, res) => {
    const user = await authed(req);
    if (!user || user.uid !== ADMIN_UID) {
      return res.status(403).json({ok: false, code: "auth"});
    }
    const {email, amount, note} = req.body || {};
    const n = Number(amount);
    if (!email || !Number.isFinite(n) || n === 0 ||
        Math.abs(n) > 100 || (n * 2) % 1 !== 0) {
      return res.status(400).json({ok: false, code: "invalid"});
    }
    try {
      const target = await admin.auth().getUserByEmail(String(email).trim());
      const cRef = db().collection("credits").doc(target.uid);
      let balance = 0;
      await db().runTransaction(async (tx) => {
        const snap = await tx.get(cRef);
        balance = ((snap.exists && snap.data().balance) || 0) + n;
        if (balance < 0) throw new Error("negative");
        tx.set(cRef, {
          balance, email: target.email || "",
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
        tx.set(cRef.collection("ledger").doc(), {
          delta: n, reason: "admin-grant",
          note: String(note || "").slice(0, 200),
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      return res.json({ok: true, balance, email: target.email});
    } catch (e) {
      const code = e.code === "auth/user-not-found" ? "nouser" :
        e.message === "negative" ? "negative" : "server";
      return res.status(code === "server" ? 500 : 404).json({ok: false, code});
    }
  });
};
