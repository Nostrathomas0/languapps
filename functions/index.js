const functions = require("firebase-functions");
const cors = require("cors")({origin: true});
const axios = require("axios");

exports.verifyRecaptcha = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({success: false, message: "No Good"});
      }

      const userToken = req.body.token;
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      const apiUrl = "https://www.google.com/recaptcha/api/siteverify";
      const params = {
        secret: secretKey,
        response: userToken,
      };

      const response = await axios.post(apiUrl, null, {params});
      const data = response.data;

      if (data.success) {
        res.json({success: true});
      } else {
        res.json({
          success: false,
          message: "reCAPTCHA verification failed",
          errorCodes: data["error-codes"],
        });
      }
    } catch (error) {
      console.error("Error verifying reCAPTCHA:", error);
      res.status(500).json({
        success: false,
        message: "error",
        error: error.message});
    }
  });
});
