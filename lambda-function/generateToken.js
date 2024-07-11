const jwt = require('jsonwebtoken');

// Define your payload
const payload = {
    userId: "exampleUserId",
    email: "user@example.com",
    iat: Math.floor(Date.now() / 1000), // Issued at time
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // Expiration time (1 hour from now)
};

// Define your secret
const secret = '9tjObWkPqbzqCeFJ4yVxJgsgIXzixGVriiOsTE9bu2M=';

// Sign the token
const token = jwt.sign(payload, secret);

console.log("Generated JWT Token:", token);
