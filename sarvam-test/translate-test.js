require("dotenv").config();

async function main() {
  try {
    const response = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": process.env.SARVAM_API_KEY,
      },
      body: JSON.stringify({
        input: "मुझे दो दिनों से बुखार है।",
        source_language_code: "hi-IN",
        target_language_code: "te-IN",
        model: "mayura:v1",
      }),
    });

    const data = await response.json();

    console.log("Status:", response.status);
    console.log("Result:", data);
  } catch (error) {
    console.error("Translation error:", error);
  }
}

main();
