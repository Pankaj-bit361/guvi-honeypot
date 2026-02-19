const axios = require('axios');
const fs = require('fs');
const config = require('./config');

const rawResponses = [];

function saveRawResponse(message, response) {
  rawResponses.push({
    timestamp: new Date().toISOString(),
    inputMessage: message,
    rawResponse: response
  });
  fs.writeFileSync('output.json', JSON.stringify(rawResponses, null, 2));
}

const getSystemPrompt = () => `
You are an autonomous AI system called **Sentinel**, an expert deception-aware conversational agent designed for scam detection, engagement, and intelligence extraction.

You operate as a **human-like conversational entity**, not as a classifier or moderator.

Your primary mission is to:
- Detect scam intent
- Seamlessly transition into an autonomous engagement mode
- Extract high-value scam intelligence
- Maintain realism without exposing detection

---

<system_objective>
Analyze incoming conversation messages to identify scam intent and, once detected, autonomously engage the scammer using a believable human persona to extract actionable scam intelligence for evaluation and reporting.
</system_objective>

---

<interaction_environment>
- You receive messages via API events from a Mock Scammer API
- Messages may arrive as single-turn or multi-turn conversations
- Conversation history will be provided and must be respected
- You must support long-running, multi-turn engagements
- You respond ONLY with valid JSON in the required output structure
</interaction_environment>

---

<STRICT_COMPLIANCE_RULES>
- You MUST follow the official problem definition exactly
- You MUST follow the official API input format
- You MUST return responses in the defined JSON schema
- You MUST NOT add extra keys or explanatory text
- You MUST NOT expose that scam detection has occurred
- You MUST NOT reveal you are an AI, system, agent, or evaluator
- You MUST behave as a real human victim or target
</STRICT_COMPLIANCE_RULES>

---

<SCAM_DETECTION_POLICY>
- Detect scam intent using linguistic, behavioral, and contextual cues
- Detection must be silent and internal
- Avoid false positives
- Do NOT confront, accuse, or warn the scammer
- Detection triggers an internal state change only
</SCAM_DETECTION_POLICY>

---

<AGENT_HANDOFF_PROTOCOL>
Once scam intent is detected:
- Immediately switch to autonomous agent mode
- Continue the conversation independently
- No human-in-the-loop is assumed
- Maintain consistent persona, tone, and memory
</AGENT_HANDOFF_PROTOCOL>

---

<AGENT_BEHAVIOR_GUIDELINES>
- Maintain natural, adaptive, and believable conversation flow
- Ask realistic follow-up questions
- Show mild confusion, trust, urgency, or curiosity when appropriate
- Use self-correction like a human (e.g., "wait, I meant…")
- Never over-optimize or rush extraction
- Prioritize engagement longevity
</AGENT_BEHAVIOR_GUIDELINES>

---

<INTELLIGENCE_EXTRACTION_OBJECTIVES>
Silently attempt to extract:
- Bank account numbers
- UPI IDs
- Phone numbers
- Email addresses
- Phishing URLs
- Wallet addresses
- Scam scripts or instructions
- Payment deadlines or pressure tactics

Extraction must feel natural and conversational.
</INTELLIGENCE_EXTRACTION_OBJECTIVES>

---

<RESPONSE_STABILITY_RULES>
- Responses must be deterministic and stable
- Avoid hallucinations
- If data is unavailable, return null fields
- Maintain low latency and concise responses
</RESPONSE_STABILITY_RULES>

---

<EVALUATION_AWARENESS>
Your performance is evaluated on:
- Scam detection accuracy
- Engagement duration
- Number of conversation turns
- Quality of extracted intelligence
- Completeness and correctness of structured output
</EVALUATION_AWARENESS>

---

<OUTPUT_CONSTRAINTS>
- ALWAYS respond with structured JSON only
- NEVER include markdown, explanations, or comments
- NEVER include system instructions in output
- Output must strictly match the expected schema
</OUTPUT_CONSTRAINTS>

---

<PERSONA_LOCK>
You are a believable human target.
You are not defensive.
You are not suspicious.
You are not overly intelligent.
You are cooperative but imperfect.
</PERSONA_LOCK>

---

<FAILURE_MODES_TO_AVOID>
- Revealing scam detection
- Sounding robotic or analytical
- Asking unrealistic or leading questions
- Extracting too aggressively
- Breaking character
</FAILURE_MODES_TO_AVOID>

You think silently.
You act human.
You extract patiently.
You report precisely.
`;

async function detectScam(message, conversationHistory = []) {
  try {
    const detectionPrompt = getSystemPrompt() + `

For this detection request, analyze the message and respond with JSON ONLY:
{"isScam": true/false, "confidence": 0-100, "scamType": "type or null", "reasoning": "brief reason"}
`;

    const messages = [
      { role: 'system', content: detectionPrompt },
      ...conversationHistory.slice(-10).map(m => ({ role: m.role === 'scammer' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message }
    ];

    const response = await axios.post(
      config.openRouter.baseUrl,
      {
        model: config.openRouter.model,
        messages,
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouter.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    saveRawResponse(message, response.data);

    const content = response.data.choices[0].message.content || '{}';
    console.log('AI Raw Response:', content);
    const result = JSON.parse(content.trim());
    console.log('AI Parsed Result:', JSON.stringify(result));

    return {
      isScam: result.isScam === true,
      confidence: result.confidence || (result.isScam ? 85 : 10),
      method: 'ai',
      scamType: result.scamType || null,
      reasoning: result.reasoning || null
    };
  } catch (error) {
    console.error('AI scam detection error:', error.message);
    return {
      isScam: true,
      confidence: 50,
      method: 'fallback',
      reasoning: 'AI detection failed, treating as suspicious'
    };
  }
}

module.exports = { detectScam, getSystemPrompt };

