// /functions/recaptchaUtils.js

const axios = require("axios");
const functions = require("firebase-functions");

const getSecretKey = () => {
  return functions.config().recaptcha.secret_key || "YOUR_FALLBACK_SECRET_KEY";
};

const verifyRecaptcha = async (token) => {
  const secretKey = getSecretKey();
  const apiUrl = "https://www.google.com/recaptcha/api/siteverify";
  const params = {secret: secretKey, response: token};

  try {
    const recaptchaResponse = await axios.post(apiUrl, null, {params});
    return recaptchaResponse.data;
  } catch (error) {
    throw new Error("Error verifying reCAPTCHA");
  }
};

module.exports = {verifyRecaptcha, getSecretKey};
