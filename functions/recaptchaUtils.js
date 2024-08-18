// recaptchaUtils
const axios = require("axios");
const functions = require("firebase-functions");

const apiKey = functions.config().recaptcha.api_key;
const siteKey = functions.config().recaptcha.site_key;
const projectId = functions.config().recaptcha.project_id;

const verifyRecaptcha = async (token) => {
  const apiUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
  const requestBody = {
    event: {
      token: token,
      siteKey: siteKey,
      expectedAction: "signup",
    }};

  try {
    const recaptchaResponse = await axios.post(apiUrl, requestBody);
    console.log("reCAPTCHA API Response:", recaptchaResponse.data);
    return recaptchaResponse.data;
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error.message);
    throw new Error("Error verifying reCAPTCHA");
  }
};

module.exports = {verifyRecaptcha};
