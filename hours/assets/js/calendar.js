// functions/sessionGenerator.js
// Keeps a rolling window of dated `sessions` topped up from the weekly
// `classes` templates. Runs daily; safe to run again at any time.
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {DateTime} = require("luxon");

const DAY_NAMES = [
  "", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
  "Saturday", "Sunday",
];

/**
 * Works out which dated sessions should exist in the rolling window and
 * returns only the ones that don't exist yet. Pure function: no Firebase
 * calls, so the date logic can be tested on its own.
 * @param {Array<Object>} classes Active class templates, each with an id.
 * @param {Object} settings Contents of the settings/schedule document.
 * @param {Set<string>} existingIds IDs of sessions that already exist.
 * @param {DateTime} now The current moment.
 * @return {Array<Object>} New sessions as {id, data} pairs.
 */
function planSessions(classes, settings, existingIds, now) {
  const zone = settings.timezone || "Europe/Paris";
  const windowDays = settings.windowDays || 28;
  const blackout = new Set(settings.blackoutDates || []);

  const today = now.setZone(zone).startOf("day");
  const lastDay = today.plus({days: windowDays - 1});

  // Nothing is created before the start date, so templates can sit ready
  // for months without filling the calendar.
  let first = today;
  if (settings.startDate) {
    const start = DateTime.fromISO(settings.startDate, {zone}).startOf("day");
    if (start > first) first = start;
  }

  const planned = [];
  for (let day = first; day <= lastDay; day = day.plus({days: 1})) {
    const iso = day.toISODate();
    if (blackout.has(iso)) continue;

    classes.forEach((cls) => {
      if (cls.day !== DAY_NAMES[day.weekday]) return;

      const parts = String(cls.time || "").split(":");
      const hour = Number(parts[0]);
      const minute = Number(parts[1] || 0);
      if (Number.isNaN(hour) || Number.isNaN(minute)) return;

      // One session per class per date, so a re-run never duplicates.
      const id = `${cls.id}_${iso}`;
      if (existingIds.has(id)) return;

      planned.push({
        id,
        data: {
          classId: cls.id,
          name: cls.name || "",
          level: cls.level || "",
          color: cls.color || "",
          description: cls.description || "",
          startsAt: day.set({hour, minute}).toJSDate(),
          durationMin: cls.durationMin || 20,
          capacity: cls.capacity || 5,
          bookedCount: 0,
          active: true,
        },
      });
    });
  }
  return planned;
}

/**
 * Reads the settings and active class templates, then creates whichever
 * sessions are missing from the rolling window.
 * @return {Promise<number>} How many sessions were created.
 */
async function generateSessions() {
  const db = admin.firestore();

  const settingsSnap = await db.doc("settings/schedule").get();
  const settings = settingsSnap.exists ? settingsSnap.data() : {};
  const now = DateTime.now().setZone(settings.timezone || "Europe/Paris");

  const classSnap = await db.collection("classes")
      .where("active", "==", true).get();
  const classes = classSnap.docs.map((d) => ({id: d.id, ...d.data()}));

  // A range on one field needs no composite index.
  const existingSnap = await db.collection("sessions")
      .where("startsAt", ">=", now.startOf("day").toJSDate()).get();
  const existingIds = new Set(existingSnap.docs.map((d) => d.id));

  const planned = planSessions(classes, settings, existingIds, now);

  for (let i = 0; i < planned.length; i += 400) {
    const batch = db.batch();
    planned.slice(i, i + 400).forEach((item) => {
      batch.set(db.collection("sessions").doc(item.id), item.data);
    });
    await batch.commit();
  }
  return planned.length;
}

exports.dailyGenerator = functions.pubsub
    .schedule("0 3 * * *")
    .timeZone("Europe/Paris")
    .onRun(async () => {
      const created = await generateSessions();
      console.log("dailyGenerator created sessions:", created);
      return null;
    });

exports.planSessions = planSessions;