const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const multer = require("multer");
const { SarvamAIClient } = require("sarvamai");
const { Pool } = require("pg");

dotenv.config();

const app = express();
const PORT = 5000;

// -----------------------------
// PostgreSQL connection
// -----------------------------
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "healthcare_triage",
  password: "postgres123",
  port: 5432,
});

// Test PostgreSQL connection
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("PostgreSQL connection failed:", err.message);
  } else {
    console.log("PostgreSQL connected successfully");
  }
});

// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// -----------------------------
// Sarvam client
// -----------------------------
const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY,
});

// -----------------------------
// 1. SPEECH TO TEXT
// -----------------------------
app.post("/api/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No audio file received",
      });
    }

    const audioFile = fs.createReadStream(req.file.path);

    const response = await client.speechToText.transcribe({
      file: audioFile,
      model: "saaras:v4",
      languageCode: req.body.languageCode || "unknown",
    });

    fs.unlinkSync(req.file.path);

    res.json({
      transcript: response.transcript,
      languageCode: response.languageCode,
    });
  } catch (error) {
    console.error("STT error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "Speech-to-text failed",
      details: error.message,
    });
  }
});

// -----------------------------
// 2. TRANSLATION
// -----------------------------
app.post("/api/translate", async (req, res) => {
  try {
    const {
      text,
      sourceLanguageCode,
      targetLanguageCode,
    } = req.body;

    if (!text || !sourceLanguageCode || !targetLanguageCode) {
      return res.status(400).json({
        error:
          "text, sourceLanguageCode and targetLanguageCode are required",
      });
    }

    const response = await client.text.translate({
      input: text,
      sourceLanguageCode,
      targetLanguageCode,
      model: "sarvam-translate:v1",
    });

    res.json({
      translatedText: response.translatedText,
    });
  } catch (error) {
    console.error("Translation error:", error);

    res.status(500).json({
      error: "Translation failed",
      details: error.message,
    });
  }
});

// -----------------------------
// 3. TEXT TO SPEECH
// -----------------------------
app.post("/api/tts", async (req, res) => {
  try {
    const {
      text,
      languageCode,
    } = req.body;

    if (!text || !languageCode) {
      return res.status(400).json({
        error: "text and languageCode are required",
      });
    }

    const response = await client.textToSpeech.convert({
      text,
      languageCode,
      model: "bulbul:v3",
      speaker: "priya",
    });

    res.json({
      audio: response.audios[0],
    });
  } catch (error) {
    console.error("TTS error:", error);

    res.status(500).json({
      error: "Text-to-speech failed",
      details: error.message,
    });
  }
});

// -----------------------------
// 4. CREATE PATIENT
// -----------------------------
app.post("/api/patients", async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      language,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Patient name is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO patients
       (name, age, gender, phone, language)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, age, gender, phone, language]
    );

    res.status(201).json({
      message: "Patient created successfully",
      patient: result.rows[0],
    });
  } catch (error) {
    console.error("Patient creation error:", error);

    res.status(500).json({
      error: "Failed to create patient",
      details: error.message,
    });
  }
});

// -----------------------------
// HOME
// -----------------------------
app.get("/", (req, res) => {
  res.send("Sarvam backend is running");
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(PORT, () => {
  console.log(`Sarvam server running at http://localhost:${PORT}`);
});
