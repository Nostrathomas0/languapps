// reCaptcha.js
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
app.use(cors({origin: true}));
app.use(express.json()); // For parsing application/json

// reCAPTCHA verification endpoint
app.post("/verifyRecaptcha", async (req, res) => {
  const token = req.body.token;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY ||
                    "6Ld47LUpAAAAAFbzW3dQTUybi3-2FrxuLOiv-zVl";

  try {
    console.log("Token received:", token);
    const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: {
        secret: secretKey,
        response: token,
      },
    });
    console.log("reCAPTCHA API Response:", response.data);
    const data = response.data;
    console.log("reCaptcha API Response:", data);
    console.log("Token received:", token);
    console.log("reCAPTCHA API response:", data);
    if (data.success && data.score >= 0.5) {
      res.json({success: true});
    } else {
      res.json({success: false, message:
        "Verification failed", errorCodes: data["error-codes"]});
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    res.status(500).json({success: false, message: "Server error"});
  }
});

exports.app = functions.https.onRequest(app);

