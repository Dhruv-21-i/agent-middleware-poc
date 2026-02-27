// --------------------------------------------------
// Required Imports
// --------------------------------------------------
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// --------------------------------------------------
// Middleware Setup
// --------------------------------------------------
app.use(express.json());
app.use(cookieParser());

// IMPORTANT: Replace with your actual Salesforce domain in production
app.use(cors({
    origin: true, // For POC allow all. Lock to Salesforce domain later.
    credentials: true
}));

// Serve static files from /public folder
app.use(express.static(path.join(__dirname, 'public')));

// --------------------------------------------------
// Temporary In-Memory Ticket Store (POC Only)
// In production use Redis / DB
// --------------------------------------------------
const validTickets = new Set();

// --------------------------------------------------
// 1️⃣ Pre-Auth Endpoint (Called by Apex)
// --------------------------------------------------
app.post('/api/auth/pre-auth', (req, res) => {

    const { salesforceUserId } = req.body;

    if (!salesforceUserId) {
        return res.status(400).json({ error: 'Missing Salesforce User ID' });
    }

    // Generate single-use ticket
    const ticket = 'TICKET-' + Math.random().toString(36).substring(2, 10);

    validTickets.add(ticket);

    console.log('Generated Ticket:', ticket);

    res.json({
        ticket: ticket
    });
});

// --------------------------------------------------
// 2️⃣ Agent Widget Endpoint (Loaded in iframe)
// --------------------------------------------------
app.get('/agent-widget', (req, res) => {

    const ticket = req.query.ticket;

    if (!ticket || !validTickets.has(ticket)) {
        return res.status(401).send('Invalid or expired ticket');
    }

    // Single-use ticket → remove after validation
    validTickets.delete(ticket);

    console.log('Validated Ticket:', ticket);

    // Generate JWT (POC dummy token)
    const jwtToken = 'dummy-jwt-' + Date.now();

    // IMPORTANT for cross-site iframe cookies
    res.cookie('agent_jwt', jwtToken, {
        httpOnly: true,
        secure: true,       // Required for SameSite=None
        sameSite: 'none'    // Required for iframe cross-domain
    });

    // Send your original HTML file
    res.sendFile(path.join(__dirname, 'public', 'minimal-custom-button.html'));
});

// --------------------------------------------------
// 3️⃣ Refresh Endpoint
// --------------------------------------------------
app.post('/api/auth/refresh', (req, res) => {

    console.log('Refreshing session...');

    const newJwt = 'refreshed-jwt-' + Date.now();

    res.cookie('agent_jwt', newJwt, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });

    res.json({
        success: true
    });
});

// --------------------------------------------------
// Start Server (Render Compatible)
// --------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Middleware running on port ${PORT}`);
});