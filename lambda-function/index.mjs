import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import jwt from "jsonwebtoken";

// Initialize the Secrets Manager client
const secretsClient = new SecretsManagerClient({ region: "us-east-1" });

async function getSecretValue(secretName) {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);
    return response.SecretString;
}

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

    const authToken = headers['cookie'][0].value.split(';').find(cookie => cookie.trim().startsWith('authToken=')).split('=')[1];

    try {
        // Fetch the JWT secret from AWS Secrets Manager
        const jwtSecret = await getSecretValue('languFunct/secret/jwt'); 
        console.log("Retrieved JWT secret:", jwtSecret);

        // Verify the JWT token
        jwt.verify(authToken, jwtSecret);
        console.log("JWT verified successfully.");
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
