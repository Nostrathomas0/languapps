const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const {verifyRecaptcha, getSecretKey} = require("./recaptchaUtils");

admin.initializeApp();

const app = express();
const corsOptions = {
  origin: "*", // Adjust this as necessary for your security needs
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions)); // Apply CORS options here
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
      res.json({success: true});
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
    console.log("Received token:", token);
    console.log("Received email:", email);
    console.log("Received password:", password);

    const recaptchaData = await verifyRecaptcha(token);
    console.log("Received response from reCAPTCHA API:", recaptchaData);

    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      const errorMessage = "reCAPTCHA verification failed";
      const errorCodes = recaptchaData["error-codes"];
      console.error("Verification failed:", errorMessage, errorCodes);
      return res.status(400).json({
        success: false,
        message: errorMessage,
        errorCodes: errorCodes,
      });
    }

    console.log("reCAPTCHA verification passed Authentication");

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
    });

    console.log("User created:", userRecord);

    // Send verification email to the user using the Firebase Admin SDK
    const verificationLink = await
    admin.auth().generateEmailVerificationLink(email);
    console.log("Verification email sent to:", email);

    res.json({
      success: true,
      message: "User registered and verification email sent.",
      verificationLink: verificationLink,
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
exports.checkRecaptchaSecret = functions.https.onRequest((req, res) => {
  try {
    const secretKey = getSecretKey();
    res.send(`reCAPTCHA Secret Key: ${secretKey}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
