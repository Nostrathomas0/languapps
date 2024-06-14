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
  const secretKey = "6Ld47LUpAAAAAFbzW3dQTUybi3-2FrxuLOiv-zVl";

  try {
    const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: {
        secret: secretKey,
        response: token,
      },
    });

    console.log("reCaptcha API Response:", response.data);
    if (response.data.success) {
      res.json({success: true});
    } else {
      res.json({success: false, message: "Verification failed"});
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    res.status(500).json({success: false, message: "Server error"});
  }
});

// Firebase Function wrapping the Express app
exports.app = functions.https.onRequest(app);
