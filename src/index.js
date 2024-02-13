const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

// Setup express app
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Setup twilio client
const VoiceResponse = twilio.twiml.VoiceResponse;

app.post("/answer", (req, res) => {
  console.log("called answer");
  const twiml = new VoiceResponse({ voice: "Polly.Matthew-Neural" });
  let counter = parseInt(req.query.counter, 10) || 0;

  // Increment the counter since we're attempting again
  counter++;

  // Decide to gather or hangup based on the counter
  if (counter <= 3) {
    // Use <Gather> to collect user input or say something to the user
    const gather = twiml.gather({
      input: "speech",
      action: "/process_speech",
      method: "POST",
      timeout: 5,
      speechTimeout: "auto",
    });

    // say something to the user
    gather.say("Hello! How can I help you today?");

    // If the user doesn't say anything, loop back to the beginning
    twiml.redirect(`/answer?counter=${counter}`);
  } else {
    // Hang up after 3 attempts
    twiml.say("No answer from the caller. Goodbye!");
    twiml.hangup();
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

app.post("/process_speech", async (req, res) => {
  console.log("called process_speech");
  const twiml = new VoiceResponse({ voice: "Polly.Matthew-Neural" });

  // The transcribed text is in the 'SpeechResult' parameter
  const speechResult = req.body.SpeechResult;
  console.log("The user said:", speechResult);

  // Assuming you've processed the speech-to-text result and obtained an AI response
  const aiResponse = "Your order will be delivered in 30 minutes.";

  // Respond to the user with the AI's response
  twiml.say(aiResponse);

  // Add a pause for a few seconds before ending the call
  twiml.pause({ length: 1 });

  // Say goodbye and then end the call
  twiml.say("Thank you for using our service. Goodbye!");
  twiml.hangup();

  res.type("text/xml");
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
