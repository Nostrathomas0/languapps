// index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

admin.initializeApp();

const app = express();
app.use(cors({origin: true}));
app.use(express.json()); // For parsing application/json

// Use the reCaptcha router for the /verifyRecaptcha route
const reCaptchaRouter = require("./reCaptcha");
app.use("/verifyRecaptcha", reCaptchaRouter);

// Endpoint to verify reCAPTCHA and sign up a user
app.post("/verifyRecaptchaAndSignup", async (req, res) => {
  const {token, email, password} = req.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY ||
                    "6Ld47LUpAAAAAFbzW3dQTUybi3-2FrxuLOiv-zVl";

  try {
    const apiUrl = "https://www.google.com/recaptcha/api/siteverify";
    const params = {secret: secretKey, response: token};
    const recaptchaResponse = await axios.post(apiUrl, null, {params});
    const recaptchaData = recaptchaResponse.data;

    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return res.json({
        success: false,
        message: "reCAPTCHA verification failed",
        errorCodes: recaptchaData["error-codes"],
      });
    }
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
    });
    // Log user information
    console.log("User created:", userRecord);
    const verificationLink = await
    admin.auth().generateEmailVerificationLink(email);
    // You can send this link to the user's email using a custom email service

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

// Firebase Function wrapping the Express app
exports.app = functions.https.onRequest(app);
