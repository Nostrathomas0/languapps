// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const {verifyRecaptcha} = require("./recaptchaUtils");

admin.initializeApp();

const app = express();
app.use(cors({
  origin: [
    "http://127.0.0.1:2000", "https://languapps.com", "https://www.labase.languapps.com",
  ], // Allow your specific domains
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Handle preflight requests
app.options("/*", (req, res) => {
  res.set("Access-Control-Allow-Origin", req.headers.origin);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Credentials", "true");
  res.status(204).send(""); // Send no content for preflight
});
app.use(express.json()); // For parsing application/json

// Endpoint to verify reCAPTCHA and sign up a user
app.post("/verifyRecaptchaAndSignup", async (req, res) => {
  const {token, email, password} = req.body;

  console.log("Received token for verification:", token);
  console.log("Received email:", email);
  console.log("Received password: [Hidden for security]");

  try {
    console.log("Starting reCAPTCHA verification for signup");

    const userAgent = req.headers["user-agent"] || "";
    const userIpAddress = req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress || "";

    console.log("User Agent:", userAgent);
    console.log("User IP Address:", userIpAddress);

    const recaptchaResponse = await
    verifyRecaptcha(token, userAgent, userIpAddress, "signup");

    console.log("Verification Result:",
        JSON.stringify(recaptchaResponse, null, 2));

    if (!recaptchaResponse.tokenProperties.valid) {
      console.error("Invalid", recaptchaResponse.tokenProperties.invalidReason);
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification failed",
        errorCodes: recaptchaResponse.tokenProperties.invalidReason,
      });
    }

    console.log("reCAPTCHA verification passed");

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
    });

    console.log("User creation successful. UID:", userRecord.uid);

    const tokenPayload = {
      uid: userRecord.uid,
      email: email,
    };

    const jwtToken = jwt.sign(tokenPayload,
        functions.config().jwt.secret, {expiresIn: "24h"});
    console.log("Generated JWT Token:", jwtToken);

    res.json({
      success: true,
      message: "User registered and verification email sent.",
      jwtToken: jwtToken,
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    } else {
      console.error("Error during signup:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
});

exports.app = functions.https.onRequest(app);
