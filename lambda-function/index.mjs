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

export const handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    console.log("Received event:", JSON.stringify(event));

    if (!headers['cookie']) {
        console.log("No cookie found, allowing request.");
        return request;  // Allow the request to pass through
    }

    const authToken = headers['cookie'][0].value
        .split(';')
        .find(cookie => cookie.trim().startsWith('authToken='))
        ?.split('=')[1];

    if (!authToken) {
        console.log("No authToken found in cookies, allowing request.");
        return request;  // Allow the request to pass through
    }

    const secretName = "languFunct/secret/jwt";  // Ensure this is the exact secret name

    let jwtSecret;
    try {
        jwtSecret = await getSecretValue(secretName);
        console.log("Retrieved JWT Secret:", jwtSecret);
    } catch (err) {
        console.error("Error retrieving secret:", err);
        return request;  // Allow the request to pass through
    }

    try {
        const decoded = jwt.verify(authToken, jwtSecret);
        console.log("JWT verified successfully:", decoded);

        // You can add any additional logic here based on the decoded JWT.

        return request;  // Allow the request to pass through
    } catch (err) {
        console.error("JWT verification failed:", err);
        return request;  // Allow the request to pass through even if verification fails
    }
};
