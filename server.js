// Import required libraries
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// Middleware setup
app.use(express.json());
app.use(cookieParser());

// CORS configuration (IMPORTANT for Salesforce)
app.use(cors({
    origin: true,   // Allow requests from any origin (for POC)
    credentials: true
}));

// --------------------------------------------------
// 1️⃣ Start Server on Port 3000
// --------------------------------------------------
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Dummy Middleware running on port ${PORT}`);
});


// --------------------------------------------------
// 2️⃣ /api/auth/pre-auth
// Called by Apex before loading agent
// --------------------------------------------------
app.post('/api/auth/pre-auth', (req, res) => {

    // Generate dummy ticket
    const ticket = 'TICKET-' + Math.floor(Math.random() * 100000);

    console.log('Generated Ticket:', ticket);

    // Create dummy JWT token
    const dummyJwt = 'dummy-jwt-token-' + Date.now();

    // Set cookie in browser
    res.cookie('agent_jwt', dummyJwt, {
        httpOnly: false,      // allow browser access (POC only)
        secure: false,        // true only in HTTPS
        sameSite: 'lax'
    });

    res.json({
        success: true,
        ticket: ticket
    });
});


// --------------------------------------------------
// 3️⃣ /api/auth/refresh
// Called when session refresh needed
// --------------------------------------------------
app.post('/api/auth/refresh', (req, res) => {

    console.log('Refreshing session...');

    const newJwt = 'refreshed-jwt-' + Date.now();

    res.cookie('agent_jwt', newJwt, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
    });

    res.json({
        success: true,
        message: 'Session refreshed'
    });
});