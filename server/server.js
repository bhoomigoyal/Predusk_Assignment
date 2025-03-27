const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: 'https://predusk-assignment-frontend.onrender.com', // Update this to your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(bodyParser.json());

// Replace with your actual Groq API key
const API_KEY = "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";
const PORT = 3001;

// Read the resume prompt
const resumePrompt = fs.readFileSync("resume_prompt.txt", "utf-8");

function cleanupReply(reply) {
  // More intelligent cleanup that preserves meaningful content
  let cleanedReply = reply
    .replace(/^[,\s]*(?:Assistant:|i\s+am\s+a\s+resume\s+assistant)[,:]\s*/i, '')
    .trim();

  // If reply is empty or too short, return a fallback
  if (cleanedReply.length < 10) {
    cleanedReply = "I can help you with information about Bhoomi's resume. Please ask a specific question.";
  }

  // Capitalize first letter
  return cleanedReply.charAt(0).toUpperCase() + cleanedReply.slice(1);
}

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        // Updated to use the current recommended model
        model: "llama-3.3-70b-versatile", 
        messages: [
          {
            role: "system",
            content: resumePrompt + "\n\nYou are an AI assistant designed to answer questions specifically about this resume. Provide concise, informative responses."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the bot's reply from the Groq API response
    const botReply = response.data.choices[0].message.content;
    
    // Clean up the reply
    const cleanedReply = cleanupReply(botReply);

    res.json({ reply: cleanedReply });
  } catch (error) {
    console.error('Full Error:', error);
    
    // More detailed error handling
    const errorMessage = error.response 
      ? (error.response.data.error?.message || JSON.stringify(error.response.data))
      : error.message;

    res.status(500).json({ 
      error: "Error processing your request", 
      details: errorMessage 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});