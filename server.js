const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use(cors({
    origin: [/lightning\.force\.com$/, /force\.com$/],
    credentials: true
}));

// Temporary ticket store
const validTickets = new Map();


// ============================
// PRE AUTH ENDPOINT
// ============================
app.post('/api/auth/pre-auth', (req, res) => {

    const ticket =
        'TICKET-' +
        Math.random().toString(36).substr(2, 9);

    validTickets.set(ticket, req.body.userName);

    console.log("Generated ticket:", ticket);

    res.json({
        ticket: ticket
    });

});


// ============================
// WIDGET ENDPOINT
// ============================
app.get('/agent-widget', (req, res) => {

    const ticket = req.query.ticket;

    if (!validTickets.has(ticket)) {

        res.status(403).send("Invalid Session Ticket");
        return;

    }

    const userName = validTickets.get(ticket);

    validTickets.delete(ticket);

    // Secure cookie
    res.cookie(
        "agent_jwt",
        "mock-jwt-token",
        {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        }
    );

    res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<title>Agent Widget</title>

<style>

body{
font-family:Arial;
background:#f8f9fb;
padding:20px;
}

.card{
background:white;
border:1px solid #d8dde6;
padding:20px;
border-radius:4px;
}

button{
background:#0070d2;
color:white;
border:0;
padding:10px 20px;
border-radius:4px;
cursor:pointer;
}

</style>

</head>

<body>

<div class="card">

<h2>Hello ${userName}</h2>

<p><b>Status:</b> Authenticated via Secure Cookie</p>

<p style="color:#54698d">
Prompt Context: "User is seeking Financials support"
</p>

<hr>

<button id="startBtn">

Start Agent Simulation

</button>

</div>


<script>

console.log("CMty iframe booted");

// Wait until DOM loads
document.addEventListener("DOMContentLoaded", function(){

    const btn = document.getElementById("startBtn");

    if(!btn){
        console.error("Button not found");
        return;
    }

    btn.addEventListener("click", function(){

        console.log("Button clicked");

        // Send message to Salesforce
        window.parent.postMessage(
        {action:'CHAT_OPENED'},
        '*'
        );

    });

});

</script>

</body>
</html>
    `);

});


// ============================
// TOKEN REFRESH ENDPOINT
// ============================
app.post('/api/auth/refresh', (req, res) => {

    res.cookie(
        "agent_jwt",
        "refreshed-token",
        {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        }
    );

    res.json({
        status: "refreshed"
    });

});


// ============================
// START SERVER
// ============================
app.listen(
    3000,
    () => console.log("Middleware running on port 3000")
);