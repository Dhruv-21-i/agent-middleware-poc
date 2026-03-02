const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use(cors({
    origin: [/lightning\.force\.com$/],
    credentials: true
}));

const validTickets = new Map();

app.post('/api/auth/pre-auth', (req, res) => {

    const ticket =
        'TICKET-' +
        Math.random().toString(36).substr(2, 9);

    validTickets.set(ticket, req.body.userName);

    res.json({ ticket });

});

app.get('/agent-widget', (req, res) => {

    const ticket = req.query.ticket;

    if (!validTickets.has(ticket)) {

        res.status(403).send('Invalid Session Ticket');
        return;

    }

    const userName = validTickets.get(ticket);

    validTickets.delete(ticket);

    res.cookie(
        'agent_jwt',
        'mock-jwt-token',
        {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        }
    );

    res.send(`
        <html>
        <body style="font-family:Arial;padding:20px;background:#f8f9fb">

            <div style="background:white;border:1px solid #d8dde6;padding:20px">

                <h2>Hello ${userName}</h2>

                <p><b>Status:</b> Authenticated via secure cookie</p>

                <button
                    onclick="window.parent.postMessage({action:'CHAT_OPENED'}, '*')"
                    style="background:#0070d2;color:white;border:0;padding:10px 20px;border-radius:4px">

                    Start Agent Simulation

                </button>

            </div>

        </body>
        </html>
    `);

});

app.post('/api/auth/refresh', (req, res) => {

    res.cookie(
        'agent_jwt',
        'refreshed-token',
        {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        }
    );

    res.json({ status:'refreshed' });

});

app.listen(
    3000,
    () => console.log('Dummy Middleware active on port 3000')
);