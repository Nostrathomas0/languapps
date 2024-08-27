/**
 * functions/recaptchaUtils.js Utility functions for reCAPTCHA verification.
 */

const {RecaptchaEnterpriseServiceClient} =
    require("@google-cloud/recaptcha-enterprise");
const functions = require("firebase-functions");

const projectId = functions.config().languapps.project_id;
const recaptchaKey = functions.config().recaptcha.site_key;

/**
 * Verifies reCAPTCHA token using Google reCAPTCHA Enterprise.
 * @param {string} token - The reCAPTCHA token provided by the client.
 * @param {string} userAgent - The user agent of the client.
 * @param {string} userIpAddress - The IP address of the client.
 * @param {string} expectedAction - The expected action name.
 * @return {Object} - The reCAPTCHA verification response.
 * @throws {Error} - If the reCAPTCHA verification fails.
 */
const verifyRecaptcha = async (
    token,
    userAgent,
    userIpAddress,
    expectedAction = "default",
) => {
  const client = new RecaptchaEnterpriseServiceClient();
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

    if (!response.tokenProperties.valid) {
      throw new Error(`Invalid token:
        ${response.tokenProperties.invalidReason}`);
    }

    console.log("reCAPTCHA API Response:", response);
    return response;
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error.message);
    throw new Error("Error verifying reCAPTCHA");
  }
};

module.exports = {verifyRecaptcha};
