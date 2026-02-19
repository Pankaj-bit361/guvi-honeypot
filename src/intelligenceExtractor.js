// Regex patterns for extracting scam intelligence
const PATTERNS = {
  bankAccounts: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{0,6}\b|\b\d{9,18}\b/g,
  upiIds: /\b[a-zA-Z0-9._-]+@[a-zA-Z]{2,}[a-zA-Z0-9]*\b|[a-zA-Z0-9._-]+@(ybl|okhdfcbank|okicici|oksbi|paytm|upi|axisbank|ibl|sbi|hdfc|icici|axis|kotak|phonepe|gpay|amazonpay|apl|yapl|rapl|abfspay|freecharge|mobikwik|airtel|jio|barodampay|unionbank|pnb|bob|canarabank|indianbank|iob|federal|indus|rbl|yes|idbi|dbs|hsbc|sc|citi|bankofbaroda|bankofindia|centralbank|uboi)\b/gi,
  urls: /https?:\/\/[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+|[a-zA-Z0-9-]+\.(com|in|org|net|info|xyz|online|site|link|click|top)[^\s]*/gi,
  phoneNumbers: /(?:\+91[-.\s]?)?[6-9]\d{9}\b|\b\d{10}\b|\+91[-.\s]?\d{5}[-.\s]?\d{5}/g,
  emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  ifscCodes: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g
};

function extractIntelligence(message) {
  const intelligence = {
    bankAccounts: [],
    upiIds: [],
    phishingUrls: [],
    phoneNumbers: [],
    emails: [],
    ifscCodes: []
  };

  if (!message || typeof message !== 'string') {
    return intelligence;
  }

  const bankMatches = message.match(PATTERNS.bankAccounts) || [];
  intelligence.bankAccounts = [...new Set(bankMatches)];

  const upiMatches = message.match(PATTERNS.upiIds) || [];
  const upiSuffixes = ['ybl', 'okhdfcbank', 'okicici', 'oksbi', 'paytm', 'upi', 'axisbank', 'ibl', 'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'phonepe', 'gpay', 'amazonpay', 'apl', 'yapl', 'rapl', 'abfspay', 'freecharge', 'mobikwik', 'airtel', 'jio', 'barodampay', 'unionbank', 'pnb', 'bob', 'canarabank', 'indianbank', 'iob', 'federal', 'indus', 'rbl', 'yes', 'idbi', 'dbs', 'hsbc', 'sc', 'citi', 'bankofbaroda', 'bankofindia', 'centralbank', 'uboi'];
  intelligence.upiIds = [...new Set(upiMatches.filter(id => {
    const lower = id.toLowerCase();
    return upiSuffixes.some(suffix => lower.endsWith('@' + suffix)) ||
           (!lower.includes('.com') && !lower.includes('.org') && !lower.includes('.net') && !lower.includes('.co.'));
  }))];

  const urlMatches = message.match(PATTERNS.urls) || [];
  intelligence.phishingUrls = [...new Set(urlMatches)];

  const phoneMatches = message.match(PATTERNS.phoneNumbers) || [];
  intelligence.phoneNumbers = [...new Set(phoneMatches)];

  const emailMatches = message.match(PATTERNS.emails) || [];
  intelligence.emails = [...new Set(emailMatches)];

  const ifscMatches = message.match(PATTERNS.ifscCodes) || [];
  intelligence.ifscCodes = [...new Set(ifscMatches)];

  return intelligence;
}

function mergeIntelligence(existing, newIntel) {
  const merged = { ...existing };
  
  for (const key of Object.keys(newIntel)) {
    if (Array.isArray(merged[key]) && Array.isArray(newIntel[key])) {
      merged[key] = [...new Set([...merged[key], ...newIntel[key]])];
    }
  }
  
  return merged;
}

function hasIntelligence(intelligence) {
  return Object.values(intelligence).some(arr => Array.isArray(arr) && arr.length > 0);
}

module.exports = {
  extractIntelligence,
  mergeIntelligence,
  hasIntelligence,
  PATTERNS
};

