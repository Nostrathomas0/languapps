// /functions/recaptchaUtils.js

const axios = require("axios");
const functions = require("firebase-functions");

const getSecretKey = () => {
  const secretKey = functions.config().recaptcha.secret_key;
  if (!secretKey) {
    throw new Error("reCAPTCHA secret key is not set in environment variables");
  }
  return secretKey;
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
