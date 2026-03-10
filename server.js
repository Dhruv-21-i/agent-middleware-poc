const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();

/* Required for secure cookies on Render */
app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.json());

/* Allowed Salesforce LWR Origin */
const allowedOrigins = [
    'https://orgfarm-90e36735e8-dev-ed.develop.my.site.com'
];

/* CORS configuration */
app.use(cors({
    origin: function(origin, callback) {

        /* allow server-to-server or curl requests */
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.log("Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));

    },
    credentials: true,
    methods: ['GET','POST','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
}));

/* Handle browser preflight */
app.options('*', cors());

/* Serve widget static files */
app.use(express.static(path.join(__dirname,'public')));

/* Ticket store */
const validTickets = new Map();


/* =====================================
   PRE-AUTH: Generate secure ticket
===================================== */

app.post('/api/auth/pre-auth',(req,res)=>{

    const ticket =
        'TICKET-' +
        Math.random().toString(36).substring(2,9);

    validTickets.set(ticket, req.body?.userName || "anonymous");

    console.log("Generated Ticket:", ticket);

    res.json({ ticket });

});


/* =====================================
   AGENT WIDGET PAGE
===================================== */

app.get('/agent-widget',(req,res)=>{

    const ticket = req.query.ticket;

    if(!validTickets.has(ticket)){
        res.status(403).send('Invalid Ticket');
        return;
    }

    const userName = validTickets.get(ticket);
    validTickets.delete(ticket);

    console.log("Valid ticket for:", userName);

    /* Set cross-site cookie */
    res.cookie(
        'agent_jwt',
        'mock-jwt-token',
        {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            path: '/'
        }
    );

res.send(`
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8">
<title>Agent Widget</title>

<link rel="stylesheet" href="/cmty-agent-widget.min.css">

</head>

<body>

<script src="/react.production.min.js"></script>
<script src="/react-dom.production.min.js"></script>
<script src="/cmty-agent-widget.min.js"></script>

<script>

console.log("CMty iframe booted");

let agentInstance;
let agentReady = false;

function initAgent(){

if(agentReady) return;

agentInstance = new window.CmtyAgent({

apiUrl:'https://poc.community-workday.com/api',
assistantId:'community-agent'

});

window.openCmtyAgent = () => agentInstance.handleOpen();

agentReady = true;

console.log("Agent initialized");

}

function openAgentSafely(){

if(typeof window.openCmtyAgent === "function"){
window.openCmtyAgent();
}else{
setTimeout(openAgentSafely,300);
}

}

function waitForAgentLib(){

if(window.CmtyAgent){
initAgent();
}else{
setTimeout(waitForAgentLib,100);
}

}

waitForAgentLib();

window.addEventListener("message",(event)=>{

console.log("Message received:",event.data);

if(event.data?.action === "CHAT_OPENED"){
openAgentSafely();
}

});

</script>

</body>
</html>
`);

});


/* =====================================
   REFRESH SESSION COOKIE
===================================== */

app.post('/api/auth/refresh',(req,res)=>{

    res.cookie(
        'agent_jwt',
        'refreshed-token',
        {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            path: '/'
        }
    );

    res.json({ status:'refreshed' });

});


/* =====================================
   START SERVER
===================================== */

const PORT = process.env.PORT || 3000;

app.listen(
PORT,
()=>console.log("Middleware running on port", PORT)
);
