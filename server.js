const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use(cors({
    origin:[/force\.com$/, /salesforce\.com$/],
    credentials:true
}));

const validTickets = new Map();


app.post('/api/auth/pre-auth',(req,res)=>{

    const ticket =
        'TICKET-'+
        Math.random().toString(36).substr(2,9);

    validTickets.set(ticket,req.body.userName);

    console.log("Generated Ticket:",ticket);

    res.json({ticket});

});


app.get('/agent-widget',(req,res)=>{

    const ticket=req.query.ticket;

    if(!validTickets.has(ticket)){

        res.status(403).send('Invalid Ticket');
        return;

    }

    const userName=validTickets.get(ticket);

    validTickets.delete(ticket);

    res.cookie(
        'agent_jwt',
        'mock-jwt-token',
        {
            httpOnly:true,
            secure:true,
            sameSite:'none'
        }
    );

res.send(`
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">

<link rel="stylesheet" href="/cmty-agent-widget.min.css">

</head>

<body>

<script src="/react.production.min.js"></script>
<script src="/react-dom.production.min.js"></script>
<script src="/cmty-agent-widget.min.js"></script>

<script>

console.log("CMty iframe booted");

const agent = new window.CmtyAgent({
    apiUrl: 'https://poc.community-workday.com/api',
    assistantId: 'community-agent'
});

window.openCmtyAgent = () => agent.handleOpen();

function openAgentSafely(){

    if(typeof window.openCmtyAgent === "function"){
        window.openCmtyAgent();
    }
    else{
        setTimeout(openAgentSafely,300);
    }

}

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


app.post('/api/auth/refresh',(req,res)=>{

    res.cookie(
        'agent_jwt',
        'refreshed-token',
        {
            httpOnly:true,
            secure:true,
            sameSite:'none'
        }
    );

    res.json({status:'refreshed'});

});


app.listen(
3000,
()=>console.log("Middleware running on port 3000")
);