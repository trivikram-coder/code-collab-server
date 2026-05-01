const express = require("express");
const router = express.Router();

const {
  aiChat,
  explainCode,
  fixCode,
  analyzeCode,
} = require("../controller/aiController");
// 💬 Chat with AI
router.post("/chat", aiChat);

// 🧾 Explain code
router.post("/explain", explainCode);

// 🛠 Fix code
router.post("/fix", fixCode);

// 🔍 Analyze code
router.post("/analyze", analyzeCode);

module.exports = router;