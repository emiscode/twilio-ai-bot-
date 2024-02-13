const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const VoiceResponse = twilio.twiml.VoiceResponse;

app.post('/answer', (req, res) => {
    const twiml = new VoiceResponse({voice: "Polly.Joanna"});

    console.log('Request received');
    console.log(req.body);

    // Use <Gather> to collect user input or say something to the user
    const gather = twiml.gather({
        input: 'speech',
        action: '/process_speech',
        method: 'POST',
        timeout: 2,
    });
    gather.say('Hello, how can I help you today?');

    // If the user doesn't say anything, loop back to the beginning
    twiml.redirect('/answer');

    res.type('text/xml');
    res.send(twiml.toString());
});

app.post('/process_speech', async (req, res) => {
    console.log('Processing the speech input');
    console.log(req.body);

    const twiml = new VoiceResponse({voice: "Polly.Joanna"});

    // Assuming you've processed the speech-to-text result and obtained an AI response
    const aiResponse = "Here's the AI response for you order. It will be delivered in 30 minutes.";

    // Respond to the user with the AI's response
    twiml.say(aiResponse);

    // Add a pause for a few seconds before ending the call
    // You can adjust the length attribute to change the pause duration (in seconds)
    twiml.pause({ length: 1 });

    // Say goodbye and then end the call
    twiml.say("Thank you for using our service. Goodbye!");
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
