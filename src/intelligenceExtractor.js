/**
 * Intelligence Extractor - Extracts actionable intelligence from messages
 */

const PATTERNS = {
  // Indian bank account numbers (9-18 digits)
  bankAccounts: /\b\d{9,18}\b/g,
  
  // UPI IDs (format: username@bankcode)
  upiIds: /\b[a-zA-Z0-9._-]+@[a-zA-Z]{2,}[a-zA-Z0-9]*\b/g,
  
  // URLs (potential phishing links)
  urls: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
  
  // Phone numbers (Indian format)
  phoneNumbers: /(?:\+91[-\s]?)?[6-9]\d{9}\b/g,
  
  // Email addresses
  emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // IFSC codes
  ifscCodes: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g
};

/**
 * Extract all intelligence from a message
 */
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

  // Extract bank accounts
  const bankMatches = message.match(PATTERNS.bankAccounts) || [];
  intelligence.bankAccounts = [...new Set(bankMatches)];

  // Extract UPI IDs (filter out regular emails)
  const upiMatches = message.match(PATTERNS.upiIds) || [];
  intelligence.upiIds = [...new Set(upiMatches.filter(id => 
    !id.includes('.com') && !id.includes('.org') && !id.includes('.net')
  ))];

  // Extract URLs
  const urlMatches = message.match(PATTERNS.urls) || [];
  intelligence.phishingUrls = [...new Set(urlMatches)];

  // Extract phone numbers
  const phoneMatches = message.match(PATTERNS.phoneNumbers) || [];
  intelligence.phoneNumbers = [...new Set(phoneMatches)];

  // Extract emails
  const emailMatches = message.match(PATTERNS.emails) || [];
  intelligence.emails = [...new Set(emailMatches)];

  // Extract IFSC codes
  const ifscMatches = message.match(PATTERNS.ifscCodes) || [];
  intelligence.ifscCodes = [...new Set(ifscMatches)];

  return intelligence;
}

/**
 * Merge new intelligence with existing
 */
function mergeIntelligence(existing, newIntel) {
  const merged = { ...existing };
  
  for (const key of Object.keys(newIntel)) {
    if (Array.isArray(merged[key]) && Array.isArray(newIntel[key])) {
      merged[key] = [...new Set([...merged[key], ...newIntel[key]])];
    }
  }
  
  return merged;
}

/**
 * Check if any intelligence was extracted
 */
function hasIntelligence(intelligence) {
  return Object.values(intelligence).some(arr => Array.isArray(arr) && arr.length > 0);
}

module.exports = {
  extractIntelligence,
  mergeIntelligence,
  hasIntelligence,
  PATTERNS
};

