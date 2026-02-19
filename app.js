/**
 * AI-Powered Agentic Honey-Pot System
 * Hackathon API - Detects scam messages and engages scammers to extract intelligence
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const config = require('./src/config');
const conversationStore = require('./src/conversationStore');
const { detectScam } = require('./src/scamDetector');
const { generateAgentResponse } = require('./src/honeypotAgent');
const { extractIntelligence, mergeIntelligence } = require('./src/intelligenceExtractor');

const app = express();

// CORS configuration for React frontend
app.use(cors({
  origin: true, // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// GUVI Callback URL for final results
const GUVI_CALLBACK_URL = 'https://hackathon.guvi.in/api/updateHoneyPotFinalResult';

// API Key Authentication Middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (!apiKey || apiKey !== config.apiKey) {
    console.log('❌ Auth failed - received key:', apiKey, 'expected:', config.apiKey);
    return res.status(401).json({ status: 'error', reply: 'Unauthorized: Invalid API key' });
  }
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Send final intelligence to GUVI callback
 */
async function sendToGUVI(sessionId, session) {
  try {
    // Calculate engagement duration
    const engagementDurationSeconds = Math.floor((Date.now() - session.metrics.startTime) / 1000);

    const payload = {
      sessionId,
      scamDetected: session.scamDetected,
      totalMessagesExchanged: session.messages.length,
      extractedIntelligence: {
        bankAccounts: session.extractedIntelligence.bankAccounts || [],
        upiIds: session.extractedIntelligence.upiIds || [],
        phishingLinks: session.extractedIntelligence.phishingUrls || [],
        phoneNumbers: session.extractedIntelligence.phoneNumbers || [],
        emailAddresses: session.extractedIntelligence.emails || [],
        suspiciousKeywords: session.suspiciousKeywords || []
      },
      engagementMetrics: {
        engagementDurationSeconds: engagementDurationSeconds,
        totalMessages: session.messages.length,
        turnsCompleted: Math.floor(session.messages.length / 2)
      },
      agentNotes: session.agentNotes || 'Scammer engaged via honeypot system'
    };

    console.log('📤 Sending to GUVI:', JSON.stringify(payload, null, 2));
    const response = await axios.post(GUVI_CALLBACK_URL, payload, { timeout: 5000 });
    console.log('✅ GUVI callback success:', response.status);
    return true;
  } catch (error) {
    console.error('❌ GUVI callback failed:', error.message);
    return false;
  }
}

/**
 * Main API Endpoint - Hackathon Format
 * POST /api/message
 */
app.post('/api/message', authenticateApiKey, async (req, res) => {
  try {
    // Log incoming request for debugging
    console.log('📥 Incoming request body:', JSON.stringify(req.body, null, 2));

    const { sessionId, message, text, conversationHistory = [] } = req.body;

    // Validate request - be VERY flexible with message format
    // Support: { message: { text: "..." } }, { message: "..." }, { text: "..." }
    let messageText;
    let sender = 'scammer';

    if (typeof message === 'string') {
      messageText = message;
    } else if (message?.text) {
      messageText = message.text;
      sender = message.sender || 'scammer';
    } else if (text) {
      messageText = text;
    }

    if (!sessionId || !messageText) {
      console.log('❌ Validation failed - sessionId:', sessionId, 'messageText:', messageText);
      console.log('❌ Full body received:', JSON.stringify(req.body));
      // Return format matching the hackathon spec: { status, reply }
      return res.status(400).json({
        status: 'error',
        reply: 'Missing sessionId or message text'
      });
    }

    console.log('✅ Valid request - sessionId:', sessionId, 'message:', messageText);

    // Get or create session
    const session = conversationStore.getConversation(sessionId);

    // Sync conversation history from request if provided
    if (conversationHistory.length > 0 && session.messages.length === 0) {
      conversationHistory.forEach(msg => {
        conversationStore.addMessage(sessionId, msg.sender, msg.text);
      });
    }

    // Add current scammer message
    conversationStore.addMessage(sessionId, sender, messageText);

    // Extract intelligence from incoming message
    const incomingIntel = extractIntelligence(messageText);
    session.extractedIntelligence = mergeIntelligence(session.extractedIntelligence, incomingIntel);

    // Track suspicious keywords
    const keywords = extractSuspiciousKeywords(messageText);
    session.suspiciousKeywords = [...new Set([...(session.suspiciousKeywords || []), ...keywords])];

    // Detect scam if not already detected
    let scamDetection = { isScam: session.scamDetected };
    if (!session.scamDetected) {
      scamDetection = await detectScam(messageText, session.messages);
      if (scamDetection.isScam) {
        conversationStore.markScamDetected(sessionId);
        session.agentNotes = `Scam detected: ${scamDetection.scamType || 'unknown'}. ${scamDetection.reasoning || ''}`;
      }
    }

    // Generate agent response
    let reply = '';
    if (session.scamDetected || scamDetection.isScam) {
      reply = await generateAgentResponse(messageText, session.messages, session.extractedIntelligence);
      conversationStore.addMessage(sessionId, 'user', reply);

      // Extract intelligence from our response context
      const responseIntel = extractIntelligence(reply);
      session.extractedIntelligence = mergeIntelligence(session.extractedIntelligence, responseIntel);

      // Auto-send to GUVI when sufficient intelligence is collected
      const intel = session.extractedIntelligence;
      const hasGoodIntel = (intel.bankAccounts?.length > 0) ||
                           (intel.upiIds?.length > 0) ||
                           (intel.phoneNumbers?.length > 0) ||
                           (intel.phishingUrls?.length > 0);
      const enoughMessages = session.messages.length >= 4; // At least 2 exchanges

      if (hasGoodIntel && enoughMessages && !session.guviCallbackSent) {
        session.guviCallbackSent = true;
        sendToGUVI(sessionId, session).catch(err => console.error('GUVI callback error:', err));
      }
    } else {
      // Not a scam - give neutral response
      reply = "Hello, how can I help you today?";
    }

    // Return simple response format
    res.json({ status: 'success', reply });

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ status: 'error', reply: 'Internal server error' });
  }
});

/**
 * Extract suspicious keywords from message
 */

function extractSuspiciousKeywords(text) {
  const keywords = ['urgent', 'immediately', 'verify', 'blocked', 'suspended', 'winner',
    'lottery', 'prize', 'claim', 'otp', 'kyc', 'update', 'expire', 'fine', 'arrest',
    'transfer', 'payment', 'account', 'bank', 'upi', 'refund', 'bonus'];
  const found = [];
  const lower = text.toLowerCase();
  keywords.forEach(kw => { if (lower.includes(kw)) found.push(kw); });
  return found;
}

/**
 * Get session status and intelligence
 * GET /api/session/:id
 */
app.get('/api/session/:id', authenticateApiKey, (req, res) => {
  const session = conversationStore.getConversation(req.params.id);
  const engagementDurationSeconds = Math.floor((Date.now() - session.metrics.startTime) / 1000);

  res.json({
    status: 'success',
    sessionId: req.params.id,
    scamDetected: session.scamDetected,
    totalMessagesExchanged: session.messages.length,
    extractedIntelligence: {
      bankAccounts: session.extractedIntelligence.bankAccounts || [],
      upiIds: session.extractedIntelligence.upiIds || [],
      phishingLinks: session.extractedIntelligence.phishingUrls || [],
      phoneNumbers: session.extractedIntelligence.phoneNumbers || [],
      emailAddresses: session.extractedIntelligence.emails || [],
      suspiciousKeywords: session.suspiciousKeywords || []
    },
    engagementMetrics: {
      engagementDurationSeconds: engagementDurationSeconds,
      totalMessages: session.messages.length,
      turnsCompleted: Math.floor(session.messages.length / 2)
    }
  });
});

/**
 * End session and send final report to GUVI
 * POST /api/session/:id/end
 */
app.post('/api/session/:id/end', authenticateApiKey, async (req, res) => {
  const session = conversationStore.getConversation(req.params.id);

  // Send to GUVI callback
  const sent = await sendToGUVI(req.params.id, session);

  const engagementDurationSeconds = Math.floor((Date.now() - session.metrics.startTime) / 1000);

  res.json({
    status: sent ? 'success' : 'partial',
    sessionId: req.params.id,
    guvi_callback_sent: sent,
    scamDetected: session.scamDetected,
    totalMessagesExchanged: session.messages.length,
    extractedIntelligence: {
      bankAccounts: session.extractedIntelligence.bankAccounts || [],
      upiIds: session.extractedIntelligence.upiIds || [],
      phishingLinks: session.extractedIntelligence.phishingUrls || [],
      phoneNumbers: session.extractedIntelligence.phoneNumbers || [],
      emailAddresses: session.extractedIntelligence.emails || [],
      suspiciousKeywords: session.suspiciousKeywords || []
    },
    engagementMetrics: {
      engagementDurationSeconds: engagementDurationSeconds,
      totalMessages: session.messages.length,
      turnsCompleted: Math.floor(session.messages.length / 2)
    },
    agentNotes: session.agentNotes || 'Session ended'
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`🍯 Honeypot System running on port ${config.port}`);
  console.log(`📡 API endpoint: http://localhost:${config.port}/api/message`);
});

module.exports = app;
