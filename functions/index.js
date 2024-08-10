const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const {verifyRecaptcha, getSecretKey} = require("./recaptchaUtils");

admin.initializeApp();

const app = express();
app.use(cors({origin: true})); // Allow all origins
app.use(express.json()); // For parsing application/json

// Test endpoint to check the secret key
app.get("/checkRecaptchaSecret", (req, res) => {
  try {
    const secretKey = getSecretKey();
    res.send(`reCAPTCHA Secret Key: ${secretKey}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// reCAPTCHA verification endpoint
app.post("/verifyRecaptcha", async (req, res) => {
  const token = req.body.token;

  console.log("Received token:", token); // Log the request body
  try {
    const data = await verifyRecaptcha(token);
    console.log("reCAPTCHA API Response:", data);

    if (data.success && data.score >= 0.5) {
      res.json({success: true, score: data.score});
    } else {
      console.error("Verification failed:", data);
      res.status(400).json({
        success: false,
        message: "Verification failed",
        errorCodes: data["error-codes"],
      });
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    res.status(500).json({success: false, message: "Server error"});
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

    const jwtToken = jwt.sign(tokenPayload, getSecretKey(),
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
