const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const {verifyRecaptcha} = require("./recaptchaUtils");

admin.initializeApp();

const app = express();
app.use(cors({
  origin: ["http://127.0.0.1:2000", "https://languapps.com", "https://www.labase.languapps.com"], // Allow your specific domains
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

app.post("/verifyRecaptcha", async (req, res) => {
  const token = req.body.token;

  console.log("Received token:", token); // Log the request body
  try {
    const data = await verifyRecaptcha(token);
    console.log("reCAPTCHA API Response:", data); // Log the entire response

    if (data && data.success && data.score >= 0.5 && data.action === "signup") {
      res.json({success: true, score: data.score});
    } else {
      console.error("Verification failed:", data);
      res.status(400).json({
        success: false,
        message: "Verification failed",
        errorCodes: data ? data["error-codes"] : "No response from reCAPTCHA",
      });
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    res.status(500).json({success: false,
      message: "Server error", error: error.message});
  }
});


// Endpoint to verify reCAPTCHA and sign up a user
app.post("/verifyRecaptchaAndSignup", async (req, res) => {
  const {token, email, password} = req.body;

  console.log("Received token:", token); // Log the request body
  try {
    console.log("Starting reCAPTCHA verification for signup");
    const data = await verifyRecaptcha(token);
    console.log("reCAPTCHA API Response:", data);

    if (!data.success || data.score < 0.5) {
      const errorMessage = "reCAPTCHA verification failed";
      const errorCodes = data["error-codes"];
      console.error("Verification failed:", errorMessage, errorCodes);
      return res.status(400).json({
        success: false,
        message: errorMessage,
        errorCodes: errorCodes,
      });
    }

    console.log("reCAPTCHA verification passed");
    console.log("Received email:", email);
    console.log("Received password:", password);

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
    });

    console.log("User created:", userRecord);

    // Generate email verification link
    const verificationLink = await admin.auth()
        .generateEmailVerificationLink(email);

    // Send email verification link to the user
    await admin.auth().sendSignInLinkToEmail(email, {
      url: verificationLink,
      handleCodeInApp: true,
    });

    console.log("Verification email sent to:", email);

    // Create JWT Token
    const tokenPayload = {
      uid: userRecord.uid,
      email: email,
    };

    const jwtToken = jwt.sign(tokenPayload(),
        {expiresIn: "24h"});

    // Respond with the JWT token
    res.json({
      success: true,
      message: "User registered and verification email sent.",
      verificationLink: verificationLink,
      jwtToken: jwtToken, // Include the JWT token in the response
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

exports.app = functions.https.onRequest(app);
