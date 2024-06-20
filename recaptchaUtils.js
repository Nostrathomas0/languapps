// /functions/recaptchaUtils.js

const axios = require("axios");

const verifyRecaptcha = async (token) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const apiUrl = "https://www.google.com/recaptcha/api/siteverify";
  const params = { secret: secretKey, response: token };

  try {
    const recaptchaResponse = await axios.post(apiUrl, null, { params });
    return recaptchaResponse.data;
  } catch (error) {
    throw new Error("Error verifying reCAPTCHA");
  }
};

module.exports = { verifyRecaptcha };
