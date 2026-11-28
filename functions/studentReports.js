// studentReports.js: student progress reports for the admin page.
// Registered on the Express app from index.js:
//   require("./studentReports")(app, {admin});
// Reads users/{uid}/pages and users/{uid}/attempts (written by La Base) with
// the Admin SDK, so the Firestore rules can keep students' records private.

const ADMIN_UID = "v8Zomt6yfhheZexXQJCCm6b2v502";
const MAX_ATTEMPTS = 2000; // most recent answers read for one report
const MAX_RECENT = 60;
const MAX_WEAK = 40;

const toMillis = (ts) => {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  const t = new Date(ts).getTime();
  return isNaN(t) ? 0 : t;
};

const average = (nums) => (nums.length ?
  Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);

// Most recent day a student was active, from their saved pages
const lastActive = (pages) => pages.reduce((latest, p) => {
  const t = Math.max(toMillis(p.updatedAt),
      p.lastActiveDay ? toMillis(p.lastActiveDay) : 0);
  return Math.max(latest, t);
}, 0);

module.exports = function register(app, {admin}) {
  const db = () => admin.firestore();

  // Only the site owner may read reports
  const requireAdmin = async (req, res) => {
    const h = req.headers.authorization || "";
    if (!h.startsWith("Bearer ")) {
      res.status(401).json({ok: false, code: "auth"});
      return false;
    }
    try {
      const decoded = await admin.auth().verifyIdToken(h.slice(7));
      if (decoded.uid !== ADMIN_UID) {
        res.status(403).json({ok: false, code: "forbidden"});
        return false;
      }
      return true;
    } catch (e) {
      res.status(401).json({ok: false, code: "auth"});
      return false;
    }
  };

  // Email and name for a list of uids (Auth allows 100 per call)
  const accounts = async (uids) => {
    const out = {};
    for (let i = 0; i < uids.length; i += 100) {
      const chunk = uids.slice(i, i + 100).map((uid) => ({uid}));
      const result = await admin.auth().getUsers(chunk);
      result.users.forEach((u) => {
        out[u.uid] = {email: u.email || "", name: u.displayName || ""};
      });
    }
    return out;
  };

  // Every student with saved progress, most recently active first
  app.get("/admin/students", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const snap = await db().collectionGroup("pages").get();
      const byUid = {};
      snap.forEach((d) => {
        const owner = d.ref.parent.parent;
        if (!owner || owner.parent.id !== "users") return;
        const uid = owner.id;
        if (!byUid[uid]) byUid[uid] = [];
        byUid[uid].push(d.data());
      });
      const uids = Object.keys(byUid);
      const info = await accounts(uids);
      const students = uids.map((uid) => {
        const pages = byUid[uid];
        const scored = pages.filter((p) => p.totalQuestions > 0);
        return {
          uid,
          email: (info[uid] || {}).email || "",
          name: (info[uid] || {}).name || "",
          pagesStarted: pages.length,
          pagesCompleted: pages.filter((p) => p.completed).length,
          averageScore: average(scored.map((p) => p.bestScore || p.score || 0)),
          lastActive: lastActive(pages),
        };
      });
      students.sort((a, b) => b.lastActive - a.lastActive);
      res.set("Cache-Control", "no-store");
      return res.json({ok: true, students});
    } catch (e) {
      console.error("Student list failed:", e.message);
      return res.status(500).json({ok: false, code: "server"});
    }
  });

  // One student's report: by topic, weak spots, recent answers
  app.get("/admin/students/:uid", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const uid = String(req.params.uid || "");
    if (!uid || uid.includes("/")) {
      return res.status(400).json({ok: false, code: "missing"});
    }
    try {
      const userRef = db().collection("users").doc(uid);
      const [pagesSnap, attemptsSnap, info] = await Promise.all([
        userRef.collection("pages").get(),
        userRef.collection("attempts")
            .orderBy("createdAt", "desc").limit(MAX_ATTEMPTS).get(),
        accounts([uid]),
      ]);

      const pages = pagesSnap.docs.map((d) => d.data());
      const attempts = attemptsSnap.docs.map((d) => {
        const a = d.data();
        return {
          level: a.level || "",
          topic: a.topic || "",
          page: a.page || 0,
          questionId: a.questionId || "",
          questionType: a.questionType || "",
          questionText: a.questionText || "",
          userAnswer: a.userAnswer || "",
          correctAnswer: a.correctAnswer || "",
          isCorrect: a.isCorrect === true,
          at: toMillis(a.createdAt),
        };
      });

      // By topic: pages done, scores and answers right/wrong
      const topics = {};
      const topicOf = (level, topic) => {
        const key = `${level}|${topic}`;
        if (!topics[key]) {
          topics[key] = {level, topic, pagesStarted: 0, pagesCompleted: 0,
            scores: [], right: 0, wrong: 0, lastActive: 0};
        }
        return topics[key];
      };
      pages.forEach((p) => {
        const t = topicOf(p.level || "", p.topic || "");
        t.pagesStarted += 1;
        if (p.completed) t.pagesCompleted += 1;
        if (p.totalQuestions > 0) t.scores.push(p.bestScore || p.score || 0);
        t.lastActive = Math.max(t.lastActive, toMillis(p.updatedAt));
      });
      attempts.forEach((a) => {
        const t = topicOf(a.level, a.topic);
        if (a.isCorrect) t.right += 1;
        else t.wrong += 1;
        t.lastActive = Math.max(t.lastActive, a.at);
      });
      const byTopic = Object.values(topics).map((t) => ({
        level: t.level,
        topic: t.topic,
        pagesStarted: t.pagesStarted,
        pagesCompleted: t.pagesCompleted,
        averageScore: average(t.scores),
        right: t.right,
        wrong: t.wrong,
        lastActive: t.lastActive,
      })).sort((a, b) => b.lastActive - a.lastActive);

      // Weak spots: questions answered wrong, most often first.
      // attempts are newest first, so the first one seen is the latest.
      const questions = {};
      attempts.forEach((a) => {
        const key = `${a.level}|${a.topic}|${a.page}|${a.questionId}`;
        if (!questions[key]) {
          questions[key] = {
            level: a.level, topic: a.topic, page: a.page,
            questionText: a.questionText, questionType: a.questionType,
            correctAnswer: a.correctAnswer, wrongCount: 0, rightCount: 0,
            lastWrongAnswer: "", lastAt: a.at, latestCorrect: a.isCorrect,
          };
        }
        const q = questions[key];
        if (!q.questionText && a.questionText) q.questionText = a.questionText;
        if (a.isCorrect) {
          q.rightCount += 1;
        } else {
          q.wrongCount += 1;
          if (!q.lastWrongAnswer) q.lastWrongAnswer = a.userAnswer;
        }
      });
      const weakSpots = Object.values(questions)
          .filter((q) => q.wrongCount > 0)
          .sort((a, b) => (b.wrongCount - a.wrongCount) ||
            (Number(a.latestCorrect) - Number(b.latestCorrect)) ||
            (b.lastAt - a.lastAt))
          .slice(0, MAX_WEAK);

      const total = attempts.length;
      const right = attempts.filter((a) => a.isCorrect).length;
      const scored = pages.filter((p) => p.totalQuestions > 0);

      res.set("Cache-Control", "no-store");
      return res.json({
        ok: true,
        student: {
          uid,
          email: (info[uid] || {}).email || "",
          name: (info[uid] || {}).name || "",
        },
        summary: {
          answers: total,
          right,
          wrong: total - right,
          accuracy: total ? Math.round((right / total) * 100) : 0,
          pagesStarted: pages.length,
          pagesCompleted: pages.filter((p) => p.completed).length,
          averageScore: average(scored.map((p) => p.bestScore || p.score || 0)),
          lastActive: Math.max(lastActive(pages), total ? attempts[0].at : 0),
          truncated: total >= MAX_ATTEMPTS,
        },
        byTopic,
        weakSpots,
        recent: attempts.slice(0, MAX_RECENT),
      });
    } catch (e) {
      console.error("Student report failed:", e.message);
      return res.status(500).json({ok: false, code: "server"});
    }
  });
};
