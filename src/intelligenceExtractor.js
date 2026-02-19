const PATTERNS = {
  bankAccounts: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{0,6}\b|\b\d{9,18}\b/g,
  upiIds: /[a-zA-Z0-9._-]+@[a-zA-Z][a-zA-Z0-9]*/gi,
  urls: /https?:\/\/[^\s<>"{}|\\^`\[\]();,]+|www\.[^\s<>"{}|\\^`\[\]();,]+/gi,
  phoneNumbers: /\+91[-.\s]?\d{5}[-.\s]?\d{5}|\+91[-.\s]?[6-9]\d{9}|(?<!\d)[6-9]\d{9}(?!\d)/g,
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
  intelligence.upiIds = [...new Set(upiMatches.filter(id => {
    const lower = id.toLowerCase();
    if (lower.includes('.com') || lower.includes('.org') || lower.includes('.net') || lower.includes('.co.') || lower.includes('.in')) {
      return false;
    }
    if (lower.match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i)) {
      return false;
    }
    return true;
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

