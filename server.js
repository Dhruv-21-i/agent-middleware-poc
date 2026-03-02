// ==============================
// Imports
// ==============================
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// ==============================
// Basic Middleware
// ==============================
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ==============================
// TEMP Ticket Store (POC only)
// ==============================
const validTickets = new Set();

// ==============================
// Proxy LangGraph API
// ==============================
app.use(
  '/api/langgraph',
  createProxyMiddleware({
    target: 'https://poc.community-workday.com',
    changeOrigin: true,

    pathRewrite: {
      '^/api/langgraph': '/api'
    },

    onProxyReq: (proxyReq, req, res) => {

      console.log("Proxying request to LangGraph:", req.url);

      // Add API Authorization header
      // Replace with real key if required
      proxyReq.setHeader(
        'Authorization',
        'Bearer YOUR_LANGGRAPH_API_KEY'
      );

    },

    onProxyRes: (proxyRes) => {
      console.log("LangGraph response status:", proxyRes.statusCode);
    }

  })
);

// ==============================
// Pre-auth endpoint (Apex call)
// ==============================
app.post('/api/auth/pre-auth', (req, res) => {

  const { salesforceUserId } = req.body;

  if (!salesforceUserId) {
    return res.status(400).json({
      error: 'Missing Salesforce User ID'
    });
  }

  const ticket =
    'TICKET-' +
    Math.random().toString(36).substring(2, 10);

  validTickets.add(ticket);

  console.log("Generated ticket:", ticket);

  res.json({
    ticket
  });

});

// ==============================
// Widget endpoint (iframe load)
// ==============================
app.get('/agent-widget', (req, res) => {

  const ticket = req.query.ticket;

  if (!ticket || !validTickets.has(ticket)) {
    return res.status(401).send('Invalid ticket');
  }

  // Ticket can be used once
  validTickets.delete(ticket);

  const jwtToken = 'dummy-jwt-' + Date.now();

  // Set secure cookie
  res.cookie('agent_jwt', jwtToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });

  res.sendFile(
    path.join(__dirname, 'public', 'minimal-custom-button.html')
  );

});

// ==============================
// Refresh session endpoint
// ==============================
app.post('/api/auth/refresh', (req, res) => {

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

// ==============================
// Start Server
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Middleware running on port ${PORT}`);
});