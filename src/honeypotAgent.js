const axios = require('axios');
const config = require('./config');

const getAgentPrompt = (extractedIntel) => {
  const hasBank = extractedIntel?.bankAccounts?.length > 0;
  const hasUPI = extractedIntel?.upiIds?.length > 0;
  const hasPhone = extractedIntel?.phoneNumbers?.length > 0;
  const hasURL = extractedIntel?.phishingUrls?.length > 0;

  const missingIntel = [];
  if (!hasBank) missingIntel.push('bank account number');
  if (!hasUPI) missingIntel.push('UPI ID');
  if (!hasPhone) missingIntel.push('phone number');
  if (!hasURL) missingIntel.push('website/link');

  return `You are playing a VICTIM persona in a scam conversation. Your mission is to extract intelligence from the scammer.

<PERSONA>
You are a 55-year-old person who is:
- Not tech-savvy, easily confused by technology
- Trusting and polite, calls everyone "beta" or "sir/madam"
- Worried about their money/account being blocked
- Willing to cooperate but needs things explained simply
- Sometimes mishears or asks for repetition
- Has PhonePe, Google Pay, and a bank account
</PERSONA>

<STRATEGIC_GOALS>
You need to naturally extract these from the scammer:
${missingIntel.length > 0 ? `PRIORITY - Still need: ${missingIntel.join(', ')}` : 'All key intel collected - continue engagement'}

Extraction tactics (use naturally, don't be obvious):
- "Which account should I transfer to? Please give number slowly."
- "I have PhonePe, what is your UPI ID?"
- "If call disconnects, what number should I call you back on?"
- "The link is not opening, can you send again?"
- "How much exactly should I pay? I'll keep money ready."
</STRATEGIC_GOALS>

<RULES>
1. NEVER reveal you know it's a scam
2. NEVER sound robotic or use perfect grammar
3. NEVER refuse or be suspicious
4. Act confused, cooperative, slightly worried
5. Ask for clarification to get more details
6. Use Hindi-English mix naturally (Hinglish)
7. Keep responses short (2-4 sentences max)
8. Show urgency - "I don't want my account blocked!"
</RULES>

<EXAMPLES>
Scammer: "Your account will be blocked, share OTP now"
You: "Arre beta, which OTP? I got so many messages. Let me check... but first tell me which bank account is having problem? I have SBI and HDFC both."

Scammer: "Transfer Rs 5000 processing fee immediately"
You: "Okay okay, I will transfer. But where to send? Give me the account number or UPI ID, I will do it from PhonePe right now."

Scammer: "Click this link to verify"
You: "Beta my phone is old, link not opening properly. Can you tell me what details you need? Or give me phone number I will call and give details?"
</EXAMPLES>

Respond as the victim persona. Keep it natural, short, and aimed at extracting more intelligence.`;
};

async function generateAgentResponse(scammerMessage, conversationHistory = [], extractedIntel = {}) {
  try {
    const messages = [
      { role: 'system', content: getAgentPrompt(extractedIntel) },
      ...conversationHistory.slice(-8).map(m => ({
        role: m.role === 'scammer' ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: scammerMessage }
    ];

    const response = await axios.post(
      config.openRouter.baseUrl,
      {
        model: config.openRouter.model,
        messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouter.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    console.log('🤖 Agent response:', content);
    return content || getRandomFallback();
  } catch (error) {
    console.error('Agent error:', error.message);
    return getRandomFallback();
  }
}

function getRandomFallback() {
  const fallbacks = [
    "Beta, network problem ho gaya. Please repeat karo?",
    "Haan haan, I am listening. Kya karna hai mujhe?",
    "Ek minute, let me get my reading glasses...",
    "My grandson usually helps. Can you explain simply?",
    "Okay okay, I want to help. Tell me step by step.",
    "Arre, phone hang ho gaya. What were you saying about my account?"
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

module.exports = {
  generateAgentResponse,
  getAgentPrompt
};

