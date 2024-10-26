// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const {verifyRecaptcha} = require("./recaptchaUtils");
const {SESClient, SendEmailCommand} = require("@aws-sdk/client-ses");
const sesClient = new SESClient({region: "us-east-1"});
admin.initializeApp();
const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    "http://127.0.0.1:2000",
    "https://languapps.com",
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
app.use(express.json()); // For parsing application/json

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

    // Return the response with JWT token
    const tokenPayload = {uid: userRecord.uid, email: email};
    const jwtToken = jwt.sign(tokenPayload,
        functions.config().jwt.secret, {expiresIn: "24h"});

    res.json({
      success: true,
      message: "User registered and verification email sent.",
      jwtToken: jwtToken,
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

exports.app = functions.https.onRequest(app);
