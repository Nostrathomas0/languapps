// functions/recaptchaUtils.js
const {RecaptchaEnterpriseServiceClient} =
require("@google-cloud/recaptcha-enterprise");
const functions = require("firebase-functions");

const projectId = functions.config().languapps.project_id;
const recaptchaKey = functions.config().recaptcha.site_key;

// Initialize the RecaptchaEnterpriseServiceClient
const client = new RecaptchaEnterpriseServiceClient();

/**
 * Verifies reCAPTCHA token using Google reCAPTCHA Enterprise.
 * @param {string} token - The reCAPTCHA token provided by the client.
 * @param {string} userAgent - The user agent of the client.
 * @param {string} userIpAddress - The IP address of the client.
 * @param {string} expectedAction - The expected action name.
 * @return {Object} - The reCAPTCHA verification response.
 * @throws {Error} - If the reCAPTCHA verification fails.
 */
const verifyRecaptcha = async (token,
    userAgent, userIpAddress, expectedAction = "default") => {
  console.log("Starting reCAPTCHA verification...");
  console.log("Token:", token);
  console.log("User Agent:", userAgent);
  console.log("User IP Address:", userIpAddress);
  console.log("Expected Action:", expectedAction);

  const projectPath = client.projectPath(projectId);

  const request = {
    assessment: {
      event: {
        token: token,
        siteKey: recaptchaKey,
        userAgent: userAgent,
        userIpAddress: userIpAddress,
        expectedAction: expectedAction,
      },
    },
    parent: projectPath,
  };

  console.log("Request Body:", JSON.stringify(request, null, 2));

  try {
    const [response] = await client.createAssessment(request);

    console.log("Full reCAPAPI Response:", JSON.stringify(response, null, 2));

    if (!response.tokenProperties.valid) {
      console.error(`Invalid token: ${response.tokenProperties.invalidReason}`);
      throw new Error(`Inval token: ${response.tokenProperties.invalidReason}`);
    }

    return response;
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error.message);
    throw new Error(`Error verifying reCAPTCHA: ${error.message}`);
  }
};

module.exports = {verifyRecaptcha};
