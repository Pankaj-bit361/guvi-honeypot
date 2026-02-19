# 🍯 AI Honeypot System

An intelligent honeypot system that detects scam messages and engages scammers to extract critical intelligence like UPI IDs, bank accounts, phone numbers, and phishing URLs.

## How It Works

1. **Scam Detection** - AI analyzes incoming messages to identify scam patterns
2. **Persona Engagement** - Responds as a confused elderly person to keep scammers talking
3. **Intelligence Extraction** - Automatically extracts payment details, contacts, and malicious links
4. **Auto Reporting** - Reports collected intelligence when sufficient data is gathered

## Features

- 🔍 Real-time scam detection with AI
- 🎭 Natural Hinglish elderly persona responses
- 📊 Extracts UPI IDs, bank accounts, phone numbers, emails, phishing URLs
- ⚡ Fast response times (~1-2 seconds)
- 📈 Engagement metrics tracking
- 🔐 API key authentication

## API Endpoints

### Send Message
```
POST /api/message
Headers: x-api-key: <your-api-key>

Body:
{
  "sessionId": "unique-session-id",
  "message": "scammer message here"
}

Response:
{
  "status": "success",
  "reply": "AI generated response"
}
```

### Get Session Details
```
GET /api/session/:sessionId
Headers: x-api-key: <your-api-key>

Response:
{
  "sessionId": "...",
  "scamDetected": true,
  "messages": [...],
  "extractedIntelligence": {
    "phoneNumbers": [],
    "bankAccounts": [],
    "upiIds": [],
    "suspiciousLinks": [],
    "emailAddresses": []
  },
  "engagementMetrics": {
    "engagementDurationSeconds": 120,
    "totalMessages": 10,
    "turnsCompleted": 5
  }
}
```

### Health Check
```
GET /health
```

## Setup

1. Clone the repository
```bash
git clone https://github.com/Pankaj-bit361/guvi-honeypot.git
cd guvi-honeypot
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start the server
```bash
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `API_KEY` | API key for authentication |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | AI model to use |

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **AI**: OpenRouter API (Gemini Flash)
- **Process Manager**: PM2

## Testing

```bash
# Run API tests
node test-api.js

# Run stress tests (200+ scam patterns)
node stress-test.js
```

## Project Structure

```
├── app.js                    # Main server
├── src/
│   ├── config.js             # Configuration
│   ├── scamDetector.js       # AI scam detection
│   ├── honeypotAgent.js      # Elderly persona responses
│   ├── intelligenceExtractor.js  # Regex extraction
│   └── conversationStore.js  # Session management
├── test-api.js               # API tests
└── stress-test.js            # Stress tests
```

## Author

**Pankaj Vashisht**

---

Built for GUVI Hackathon 2026 🚀

