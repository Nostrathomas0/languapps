const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const axios = require("axios");

admin.initializeApp();

exports.verifyRecaptchaAndSignup = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          message: "Method not allowed",
        });
      }

      const {token, email, password} = req.body;
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      const apiUrl = "https://www.google.com/recaptcha/api/siteverify";
      const params = {secret: secretKey, response: token};

      const recaptchaResponse = await axios.post(apiUrl, null, {params});
      const recaptchaData = recaptchaResponse.data;

      if (!recaptchaData.success) {
        return res.json({
          success: false,
          message: "reCAPTCHA verification failed",
          errorCodes: recaptchaData["error-codes"],
        });
      }

      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        emailVerified: false,
      });

      await admin.auth().sendEmailVerification(userRecord.uid);

      res.json({
        success: true,
        message: "User registered and verification email sent.",
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
});

