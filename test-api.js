const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const API_KEY = 'guvi-honeypot-pankaj-2026';

const TEST_SCENARIOS = [
  {
    name: 'Bank Fraud',
    messages: [
      'URGENT: Your SBI account will be blocked! Call immediately on 9876543210',
      'Sir, you need to pay Rs 5000 processing fee. Send to UPI: scammer@ybl',
      'Transfer to account 12345678901234 IFSC: SBIN0001234',
      'Click this link to verify: http://fake-sbi-login.xyz/verify',
      'Share your OTP now or account will be frozen!'
    ]
  },
  {
    name: 'UPI Fraud', 
    messages: [
      'Congratulations! You won Rs 50,000 lottery. Pay Rs 500 tax to claim.',
      'Send money to my PhonePe: winner2026@paytm',
      'Or use Google Pay: lottery.pay@okicici',
      'Call me on +91-98765-43210 for instant processing',
      'Hurry! Offer expires in 10 minutes. Send screenshot after payment.'
    ]
  }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testScenario(scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${scenario.name}`);
  console.log('='.repeat(60));

  const sessionId = `test-${Date.now()}`;
  let conversationHistory = [];

  for (let i = 0; i < scenario.messages.length; i++) {
    const message = scenario.messages[i];
    console.log(`\n📨 Turn ${i + 1}: "${message.substring(0, 50)}..."`);

    const startTime = Date.now();
    
    try {
      const response = await axios.post(
        `${API_URL}/api/message`,
        {
          sessionId,
          message: {
            sender: 'scammer',
            text: message,
            timestamp: Date.now()
          },
          conversationHistory,
          metadata: { channel: 'SMS', language: 'English', locale: 'IN' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
          },
          timeout: 30000
        }
      );

      const elapsed = Date.now() - startTime;
      console.log(`✅ Response (${elapsed}ms): "${response.data.reply?.substring(0, 80)}..."`);
      console.log(`   Status: ${response.data.status}`);

      conversationHistory.push(
        { role: 'scammer', content: message },
        { role: 'agent', content: response.data.reply }
      );

    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    }

    await sleep(1000); // Wait between messages
  }

  // Get session details
  console.log(`\n📊 Fetching Session Details...`);
  try {
    const sessionRes = await axios.get(`${API_URL}/api/session/${sessionId}`, {
      headers: { 'x-api-key': API_KEY }
    });

    const data = sessionRes.data;
    console.log('\n📋 SESSION SUMMARY:');
    console.log('─'.repeat(40));
    console.log(`   Scam Detected: ${data.scamDetected}`);
    console.log(`   Messages: ${data.totalMessagesExchanged}`);
    console.log('\n🔍 EXTRACTED INTELLIGENCE:');
    console.log(`   Phone Numbers: ${JSON.stringify(data.extractedIntelligence?.phoneNumbers || [])}`);
    console.log(`   Bank Accounts: ${JSON.stringify(data.extractedIntelligence?.bankAccounts || [])}`);
    console.log(`   UPI IDs: ${JSON.stringify(data.extractedIntelligence?.upiIds || [])}`);
    console.log(`   Phishing Links: ${JSON.stringify(data.extractedIntelligence?.phishingLinks || [])}`);
    console.log(`   Email Addresses: ${JSON.stringify(data.extractedIntelligence?.emailAddresses || [])}`);
    
    console.log('\n⏱️ ENGAGEMENT METRICS:');
    if (data.engagementMetrics) {
      console.log(`   Duration: ${data.engagementMetrics.engagementDurationSeconds}s`);
      console.log(`   Total Messages: ${data.engagementMetrics.totalMessages}`);
      console.log(`   Turns Completed: ${data.engagementMetrics.turnsCompleted}`);
      console.log('   ✅ engagementMetrics PRESENT - Worth 20 points!');
    } else {
      console.log('   ❌ engagementMetrics MISSING - Losing 20 points!');
    }

  } catch (error) {
    console.log(`❌ Session fetch error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 HONEYPOT API TEST SUITE');
  console.log(`   Target: ${API_URL}`);
  console.log(`   API Key: ${API_KEY}`);

  for (const scenario of TEST_SCENARIOS) {
    await testScenario(scenario);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ ALL TESTS COMPLETED');
  console.log('='.repeat(60));
}

runTests().catch(console.error);

