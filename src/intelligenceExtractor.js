const PATTERNS = {
  bankAccounts: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{0,6}\b|\b\d{11,18}\b/g,
  upiIds: /[a-zA-Z0-9._-]+@[a-zA-Z][a-zA-Z0-9]*/gi,
  urls: /https?:\/\/[^\s<>"{}|\\^`\[\]();,]+|www\.[^\s<>"{}|\\^`\[\]();,]+/gi,
  phoneNumbers: /\+\d{1,4}[-.\s]?\d{5}[-.\s]?\d{5}|\+\d{1,4}[-.\s]?[6-9]\d{9}|(?<![0-9])[6-9]\d{9}(?![0-9])/g,
  emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  ifscCodes: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
  // New patterns for missing data types
  caseIds: /(?:case|reference|ref|ticket|complaint|tracking)[\s#:.-]*(?:no|number|id)?[\s#:.-]*([A-Z0-9]{4,20})/gi,
  policyNumbers: /(?:policy|insurance)[\s#:.-]*(?:no|number|id)?[\s#:.-]*([A-Z0-9]{6,20})/gi,
  orderNumbers: /(?:order|parcel|shipment|awb|consignment)[\s#:.-]*(?:no|number|id)?[\s#:.-]*([A-Z0-9]{6,20})/gi
};

function extractIntelligence(message) {
  const intelligence = {
    bankAccounts: [],
    upiIds: [],
    phishingUrls: [],
    phoneNumbers: [],
    emails: [],
    ifscCodes: [],
    caseIds: [],
    policyNumbers: [],
    orderNumbers: []
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

  // Extract Case IDs
  let caseMatch;
  while ((caseMatch = PATTERNS.caseIds.exec(message)) !== null) {
    if (caseMatch[1]) intelligence.caseIds.push(caseMatch[1]);
  }
  intelligence.caseIds = [...new Set(intelligence.caseIds)];
  PATTERNS.caseIds.lastIndex = 0;

  // Extract Policy Numbers
  let policyMatch;
  while ((policyMatch = PATTERNS.policyNumbers.exec(message)) !== null) {
    if (policyMatch[1]) intelligence.policyNumbers.push(policyMatch[1]);
  }
  intelligence.policyNumbers = [...new Set(intelligence.policyNumbers)];
  PATTERNS.policyNumbers.lastIndex = 0;

  // Extract Order Numbers
  let orderMatch;
  while ((orderMatch = PATTERNS.orderNumbers.exec(message)) !== null) {
    if (orderMatch[1]) intelligence.orderNumbers.push(orderMatch[1]);
  }
  intelligence.orderNumbers = [...new Set(intelligence.orderNumbers)];
  PATTERNS.orderNumbers.lastIndex = 0;

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

