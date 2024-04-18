const functions = require("firebase-functions");
const axios = require("axios");

exports.verifyRecaptcha = functions.https.onRequest(async (req, res) => {
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
      res.send({success: true});
    } else {
      res.send({success: false, message: "Verification failed"});
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    res.status(500).send({success: false, message: "Server error"});
  }
});

// fetch("https://us-central1.cloudfunctions.net/verifyRecaptcha", {
//  method: "POST",
//  headers: {
//    "Content-Type": "application/json",
//  },
//  body: JSON.stringify({token: "reCAPTCHA_token_here"}),
// })
//    .then((response) => response.json())
//    .then((data) => {
//      if (data.success) {
//        // The token is valid
//      } else {
// The token is invalid or verification failed
//      }
//    })
//    .catch((error) => {
//      console.error("Error verifying reCAPTCHA token:", error);
//    });
