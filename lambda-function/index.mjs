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
