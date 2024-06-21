// reCaptcha.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
// eslint-disable-next-line new-cap
const router = express.Router();
router.use(cors({origin: true}));
router.use(express.json()); // For parsing application/json

// reCAPTCHA verification endpoint
router.post("/", async (req, res) => {
  const token = req.body.token;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY ||
                    "6Ld47LUpAAAAAFbzW3dQTUybi3-2FrxuLOiv-zVl";

  try {
    const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: {
        secret: secretKey,
        response: token,
      },
    });
    const data = response.data;
    console.log("reCaptcha API Response:", data);

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

module.exports = router;
