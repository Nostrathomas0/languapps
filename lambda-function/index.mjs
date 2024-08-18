import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import jwt from "jsonwebtoken";

const client = new SecretsManagerClient({ region: "us-east-1" });

const getSecretValue = async (secretName) => {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  try {
    const data = await client.send(command);
    if ("SecretString" in data) {
      return data.SecretString;
    }
    const buff = Buffer.from(data.SecretBinary, "base64");
    return buff.toString("ascii");
  } catch (err) {
    console.error("Error retrieving secret:", err);
    throw err;
  }
};

const createJWTToken = (uid, email, jwtSecret) => {
  const payload = {
    uid,
    email,
    progress: {}, // Add some default progress information perhaps
  };
  return jwt.sign(payload, jwtSecret, { expiresIn: '23h' });
};

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));

  // Check if this is a request to create a JWT token
  if (event.httpMethod === 'POST' && event.path === '/createJWT') {
    const { uid, email } = JSON.parse(event.body);

    const secretName = "languFunct/secret/jwt";

    let jwtSecret;
    try {
      jwtSecret = await getSecretValue(secretName);
      console.log("Retrieved JWT Secret:", jwtSecret);
    } catch (err) {
      console.error("Error retrieving secret:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error retrieving secret' }),
      };
    }

    try {
      const token = createJWTToken(uid, email, jwtSecret);
      return {
        statusCode: 200,
        body: JSON.stringify({ token }),
      };
    } catch (err) {
      console.error("Error creating JWT token:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error creating JWT token' }),
      };
    }
  }

  // Existing JWT verification logic
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  if (!headers['cookie']) {
    return {
      status: '403',
      statusDescription: 'Forbidden',
      body: 'Unauthorized'
    };
  }

  const authToken = headers['cookie'][0].value
    .split(';')
    .find(cookie => cookie.trim().startsWith('authToken='))
    .split('=')[1];

  const secretName = "languFunct/secret/jwt";

  let jwtSecret;
  try {
    jwtSecret = await getSecretValue(secretName);
    console.log("Retrieved JWT Secret:", jwtSecret);
  } catch (err) {
    console.error("Error retrieving secret:", err);
    return {
      status: '500',
      statusDescription: 'Internal Server Error',
      body: 'Error retrieving secret'
    };
  }

  try {
    const decoded = jwt.verify(authToken, jwtSecret);
    console.log("JWT verified successfully:", decoded);

    const userProgress = decoded.progress;

    return {
      status: '200',
      statusDescription: 'OK',
      body: JSON.stringify({ userProgress })
    };
  } catch (err) {
    console.error("JWT verification failed:", err);
    return {
      status: '403',
      statusDescription: 'Forbidden',
      body: 'Unauthorized'
    };
  }

  return request;
};
