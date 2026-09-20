require("dotenv").config();

const { SarvamAIClient } = require("sarvamai");
const fs = require("fs");

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY
});

async function main() {
  try {
    const response = await client.textToSpeech.convert({
      text: "నమస్కారం, మీకు ఎలా ఉంది?",
      languageCode: "te-IN",
      model: "bulbul:v3",
      speaker: "priya"
    });

    const audioData = Buffer.from(response.audios[0], "base64");
    fs.writeFileSync("telugu-test.wav", audioData);

    console.log("Success! Audio saved as telugu-test.wav");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
