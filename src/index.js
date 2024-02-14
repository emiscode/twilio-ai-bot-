const twilio = require("twilio");
const OpenAI = require("openai");
const express = require("express");
const bodyParser = require("body-parser");

// Setup express app
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Setup twilio client
const VoiceResponse = twilio.twiml.VoiceResponse;

// Setup OpenAI client
const apiKey = process.env.OPENAI_API_KEY;
const organization = process.env.OPENAI_ORGANIZATION;
const openai = new OpenAI({ apiKey, organization });

// Store conversation context for each client
let conversation_contexts = {};

app.post("/answer", (req, res) => {
  console.log("called answer");
  console.log("queries: ", req.query);

  const twiml = new VoiceResponse({ voice: "Polly.Matthew-Neural" });
  let counter = parseInt(req.query.counter, 10) || 0;
  const continueConversation = req.query.continueConversation;

  // Increment the counter since we're attempting again
  counter++;

  // Decide to gather or hangup based on the counter
  if (counter <= 3) {
    // Use <Gather> to collect user input or say something to the user
    const gather = twiml.gather({
      input: "speech",
      action: "/process_speech",
      method: "POST",
    });

    // say something to the user
    const msg = continueConversation
      ? "Are you still there?"
      : "Hello! How can I help you today?";

    gather.say(msg);

    // If the user doesn't say anything, loop back to the beginning
    twiml.redirect(
      `/answer?counter=${counter}&continueConversation=${continueConversation}`
    );
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

  // Get the client's phone number
  const phoneNumber = req.body.From;
  console.log("The client's phone number is:", phoneNumber);

  // If this is the first time this client is calling, initialize their conversation context
  if (!conversation_contexts[phoneNumber]) {
    conversation_contexts[phoneNumber] = [
      {
        role: "system",
        content: `You are a helpful assistant for ordering food on a restaurant.
        You can take orders, answer questions, and provide recommendations.
        Make the response short and clear.
        When the client confirms the order then your answer should contains a summary of the order,
        and at the end a token to indicate the end of the conversation, like this #order_confirmed#.`,
      },
    ];
  }

  // Add the user's input to the conversation context
  conversation_contexts[phoneNumber].push({
    role: "user",
    content: speechResult,
  });

  // Generate a response using OpenAI's GPT-4 model
  const openaiResponse = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: conversation_contexts[phoneNumber],
  });

  // Get the AI's response
  const aiResponse = openaiResponse["choices"][0]["message"]["content"];

  // Add the AI's response to the conversation context
  conversation_contexts[phoneNumber].push({
    role: "assistant",
    content: aiResponse,
  });

  console.log({ aiResponse });

  // Respond to the user with the AI's response
  twiml.say(
    aiResponse.split("#order_confirmed#")[0] ||
      "I'm sorry, I didn't understand that. Can you please repeat?"
  );

  // Check if the user has confirmed their order
  if (aiResponse.includes("#order_confirmed#")) {
    // Add a pause for a few seconds before ending the call
    twiml.pause({ length: 1 });

    // Say goodbye and then end the call
    twiml.say("Thank you for using our service. Goodbye!");
    twiml.hangup();
  } else {
    // Use <Gather> to collect user input or say something to the user
    twiml.gather({
      input: "speech",
      action: "/process_speech",
      method: "POST",
    });

    // If the user doesn't say anything, redirect back to /answer
    twiml.redirect(`/answer?continueConversation=true`);
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
