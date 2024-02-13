const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const VoiceResponse = twilio.twiml.VoiceResponse;

app.post('/answer', (req, res) => {
    const twiml = new VoiceResponse();

    // Use <Gather> to collect user input or say something to the user
    const gather = twiml.gather({
        input: 'speech',
        action: '/process_speech',
        method: 'POST',
    });
    gather.say('Please tell us your request after the beep.');

    // If the user doesn't say anything, loop back to the beginning
    twiml.redirect('/answer');

    res.type('text/xml');
    res.send(twiml.toString());
});

app.post('/process_speech', async (req, res) => {
    const twiml = new VoiceResponse();

    // Process speech-to-text result here
    // For example, send text to your AI bot and get a response

    // Placeholder for AI response
    const aiResponse = "Here's a response from the AI based on user input.";

    // Respond to the user with the AI's response
    twiml.say(aiResponse);

    // Optionally, redirect to another step or end the call
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
