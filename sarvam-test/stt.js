require("dotenv").config();

const { SarvamAIClient } = require("sarvamai");
const fs = require("fs");

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY
});

async function main() {
  try {
    const audioFile = fs.createReadStream("sarvamtest.wav");

    const response = await client.speechToText.transcribe({
      file: audioFile,
      model: "saaras:v4",
      mode: "transcribe",
      language_code: "te-IN"
    });

    console.log("Transcription:");
    console.log(response.transcript);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
