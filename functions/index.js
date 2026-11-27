// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const {verifyRecaptcha} = require("./recaptchaUtils");
const {SESClient, SendEmailCommand} = require("@aws-sdk/client-ses");
const sesClient = new SESClient({region: "us-east-1"});
const Stripe = require("stripe");

// Lazily create the Stripe client on first real request, not at module
// load time — firebase deploy's local analysis pass runs this file before
// secrets are injected into process.env, so calling Stripe(...) up here
// at the top level crashes that analysis step with "Neither apiKey nor
// config.authenticator provided", even though the secret is set correctly.
let stripeClient = null;
/**
 * Lazily creates and caches the Stripe client on first real request.
 * Deferred until then because firebase deploy's local analysis pass
 * loads this file before secrets are injected into process.env, so
 * constructing it at module load time crashes that step.
 * @return {Stripe} the cached Stripe client instance.
 */
function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}
admin.initializeApp();
const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    "http://127.0.0.1:2000",
    "https://languapps.com",
    "https://www.languapps.com",
    "https://labase.languapps.com",
    "https://www.labase.languapps.com"],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply CORS with the defined options
app.use(cors(corsOptions));
// Handle preflight requests
app.options("/*", (req, res) => {
  res.set("Access-Control-Allow-Origin", req.headers.origin);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Credentials", "true");
  res.status(204).send(""); // Send no content for preflight
});

// ─────────────────────────────────────────────────────────────────────────
// Stripe webhook — MUST be registered before app.use(express.json()) below.
// Signature verification needs the raw, untouched request body; the global
// JSON parser would otherwise consume and reformat it first, breaking the
// signature check. This route uses its own scoped express.raw() instead.
// ─────────────────────────────────────────────────────────────────────────
app.post(
    "/stripeWebhook",
    express.raw({type: "application/json"}),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const stripe = getStripeClient();
      let event;

      try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        console.error("Stripe signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const rawReference = session.client_reference_id;

        // Format: uid_classId1_classId2. A Payment Link silently drops any
        // client_reference_id character other than letters, digits, dashes
        // and underscores, so "|" and "," can't be used as separators.
        // Firebase UIDs and Firestore auto-IDs never contain "_", so
        // splitting on it is safe as long as class doc IDs stay auto-IDs.
        const parts = (rawReference || "").split("_");

        if (parts.length !== 3 || parts.some((p) => !p)) {
          console.error("Malformed/missing client_reference_id:", session.id);
          return res.status(200).json({received: true, warning: "Bad ref"});
        }

        const [uid, ...classIds] = parts;

        try {
          // Fetch the 2 booked classes for the confirmation emails below.
          const classDocs = await Promise.all(
              classIds.map((id) =>
                admin.firestore().collection("classes").doc(id).get()),
          );
          const bookedClasses = classDocs
              .filter((d) => d.exists)
              .map((d) => ({id: d.id, ...d.data()}));

          // accessGranted is the field checkAccess.js at labase actually
          // checks — this is the one that matters for real access.
          // lessonsRemaining now reflects the 2 classes actually purchased
          // (increment, not a flat overwrite) rather than a guessed number.
          await admin.firestore().collection("users").doc(uid).set({
            accessGranted: true,
            premium: true,
            lessonsRemaining: admin.firestore.FieldValue.increment(2),
            bookedClasses: admin.firestore.FieldValue.arrayUnion(...classIds),
            lastPaymentTime: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});

          console.log("Access granted for user:", uid, "classes:", classIds);

          // Prefer the Auth record's email (tied to the uid we're actually
          // granting access to) over Stripe's, falling back if that lookup
          // fails for any reason.
          let buyerEmail =
            session.customer_details && session.customer_details.email;
          try {
            const userRecord = await admin.auth().getUser(uid);
            buyerEmail = userRecord.email || buyerEmail;
          } catch (e) {
            console.error("Could not look up user email:", e.message);
          }

          const classListHtml = bookedClasses
              .map((c) => `<li>${c.name} — ${c.day} ${c.time} CET</li>`)
              .join("");

          if (buyerEmail) {
            await transporter.sendMail({
              from: `Languapps <noreply@languapps.com>`,
              to: buyerEmail,
              subject: "Your Languapps classes are booked!",
              html: `
                <p>You're booked in for:</p>
                <ul>${classListHtml}</ul>
                <p>Need to adjust your times? Reply to this email and
                we'll sort it out.</p>
              `,
            });
          }

          await transporter.sendMail({
            from: `Languapps <noreply@languapps.com>`,
            to: "thomas@languapps.com",
            subject: "New booking received",
            html: `
              <p>${buyerEmail || uid} just booked:</p>
              <ul>${classListHtml}</ul>
            `,
          });
        } catch (err) {
          console.error("Failed to process booking for",
              rawReference, ":", err.message);
          // Still return 200 — Stripe retries on non-2xx, and the payment
          // already succeeded; a failure here needs manual follow-up, not
          // an infinite Stripe retry loop.
        }
      }

      res.status(200).json({received: true});
    },
);

app.use(express.json()); // For parsing application/json (all routes below)

// Create Nodemailer SES transporter
const transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-1.amazonaws.com",
  port: 587,
  secure: false, // true for 465, false for other ports like 587
  auth: {
    user: functions.config().smtp.user,
    pass: functions.config().smtp.pass,
  },
});

// Endpoint to verify reCAPTCHA and sign up a user
const SCORE_THRESHOLD = .5;
const rateLimiter = {};

const MAX_REQUESTS_PER_MINUTE = 30;
const TIME_WINDOW_MS = 60000;
// Endpoint to verify reCAPTCHA and sign up a user
app.post("/verifyRecaptchaAndSignup", async (req, res) => {
  const {token, email, password} = req.body;
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  if (!rateLimiter[ip]) {
    rateLimiter[ip] = {count: 1, lastRequest: Date.now()};
  } else {
    const timeElapsed = Date.now() - rateLimiter[ip].lastRequest;

    // Reset count after time window has passed
    if (timeElapsed > TIME_WINDOW_MS) {
      rateLimiter[ip] = {count: 1, lastRequest: Date.now()};
    } else {
      rateLimiter[ip].count++;
    }

    // If the count exceeds the limit, reject the request
    if (rateLimiter[ip].count > MAX_REQUESTS_PER_MINUTE) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }
  }

  try {
    console.log("Starting reCAPTCHA verification for signup");

    const recaptchaResponse = await verifyRecaptcha(
        token,
        req.headers["user-agent"],
        ip,
        "signup",
    );

    if (!recaptchaResponse.tokenProperties.valid) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification failed",
      });
    }

    // Step 3: Check the reCAPTCHA score
    const score = recaptchaResponse.riskAnalysis.score;
    console.log("reCAPTCHA score:", score);

    if (score < SCORE_THRESHOLD) {
      return res.status(403).json({
        success: false,
        message: "Low reCAPTCHA score. Signup blocked.",
      });
    }

    console.log("reCAPTCHA passed with score:", score);

    const userExists = await
    admin.auth().getUserByEmail(email).catch(() => null);
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
    });

    // Step 3: Generate email verification link
    const verificationLink = await
    admin.auth().generateEmailVerificationLink(email, {
      url: "https://labase.languapps.com", // Adjust URL as needed
      handleCodeInApp: true,
    });

    // Step 4: Send the email using Nodemailer (SES)
    const mailOptions = {
      from: `Languapps <noreply@languapps.com>`,
      to: email,
      subject: "Verify your email for Languapps",
      html: `<p>Click the link to verify: 
      <a href="${verificationLink}">Verify Email</a></p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", email);

    res.json({
      success: true,
      message: "User registered and verification email sent.",
    });
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Website → app hand-off. The website sends the signed-in user's Firebase ID
// token; we answer with a short-lived, one-time custom token that the app
// uses to sign the same user in (signInWithCustomToken).
// The function's service account needs the "Service Account Token Creator"
// role (iam.serviceAccounts.signBlob) for createCustomToken to work.
app.post("/appHandoff", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!idToken) {
    return res.status(401).json({success: false, message: "Not signed in"});
  }
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken, true);
  } catch (error) {
    return res.status(401)
        .json({success: false, message: "Sign-in expired"});
  }
  try {
    const token = await admin.auth().createCustomToken(decoded.uid);
    res.set("Cache-Control", "no-store");
    return res.json({success: true, token});
  } catch (error) {
    console.error("App hand-off failed:", error.code || error.message);
    return res.status(500).json({success: false, message: "Hand-off failed"});
  }
});

// Only send further transactional emails once the user is verified
exports.sendTransactionalEmail =
functions.https.onCall(async (data, context) => {
  const email = data.email;
  const ip = context.rawRequest.ip;// Get IP
  if (!rateLimiter[ip]) {
    rateLimiter[ip] = {count: 1, lastRequest: Date.now()};
  } else {
    const timeElapsed = Date.now() - rateLimiter[ip].lastRequest;

    if (timeElapsed > TIME_WINDOW_MS) {
      rateLimiter[ip] = {count: 1, lastRequest: Date.now()};
    } else {
      rateLimiter[ip].count++;
    }

    if (rateLimiter[ip].count > MAX_REQUESTS_PER_MINUTE) {
      throw new functions.https.HttpsError("resource-exhausted requests");
    }
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    if (!user.emailVerified) {
      throw new Error("Email not verified. Cannot send email via SES.");
    }

    // Send transactional email via SES
    const sesParams = {
      Destination: {ToAddresses: [email]},
      Message: {
        Body: {Text: {Data: "Languapps Welcomes"}},
        Subject: {Data: "You're now part of the early community"},
      },
      Source: "thomas@languapps.com", // Must be a verified sender in SES
    };
    const command = new SendEmailCommand(sesParams);
    const result = await sesClient.send(command);
    console.log("Transactional email sent via SES:", result);
    return {success: true, message: "Email sent"};
  } catch (error) {
    console.error("Error sending email via SES:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

require("./privateLessons")(app, {admin, transporter});

exports.dailyGenerator = require("./sessionGenerator").dailyGenerator;

exports.app = functions
    .runWith({secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]})
    .https.onRequest(app);
