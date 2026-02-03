/**
 * In-memory conversation store for tracking multi-turn conversations
 */
class ConversationStore {
  constructor() {
    this.conversations = new Map();
  }

  /**
   * Get or create a conversation
   */
  getConversation(conversationId) {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        id: conversationId,
        messages: [],
        scamDetected: false,
        agentActive: false,
        extractedIntelligence: {
          bankAccounts: [],
          upiIds: [],
          phishingUrls: [],
          phoneNumbers: [],
          emails: []
        },
        metrics: {
          startTime: Date.now(),
          turnCount: 0,
          scamDetectedAt: null
        }
      });
    }
    return this.conversations.get(conversationId);
  }

  /**
   * Add a message to conversation history
   */
  addMessage(conversationId, role, content) {
    const conversation = this.getConversation(conversationId);
    conversation.messages.push({
      role,
      content,
      timestamp: Date.now()
    });
    conversation.metrics.turnCount++;
    return conversation;
  }

  /**
   * Mark scam as detected
   */
  markScamDetected(conversationId) {
    const conversation = this.getConversation(conversationId);
    conversation.scamDetected = true;
    conversation.agentActive = true;
    conversation.metrics.scamDetectedAt = Date.now();
    return conversation;
  }

  /**
   * Add extracted intelligence
   */
  addIntelligence(conversationId, type, value) {
    const conversation = this.getConversation(conversationId);
    if (conversation.extractedIntelligence[type] && !conversation.extractedIntelligence[type].includes(value)) {
      conversation.extractedIntelligence[type].push(value);
    }
    return conversation;
  }

  /**
   * Get conversation metrics
   */
  getMetrics(conversationId) {
    const conversation = this.getConversation(conversationId);
    const now = Date.now();
    return {
      engagementDuration: Math.floor((now - conversation.metrics.startTime) / 1000),
      turnCount: conversation.metrics.turnCount,
      scamDetected: conversation.scamDetected,
      agentActive: conversation.agentActive,
      timeToDetection: conversation.metrics.scamDetectedAt 
        ? Math.floor((conversation.metrics.scamDetectedAt - conversation.metrics.startTime) / 1000)
        : null
    };
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId) {
    return this.conversations.delete(conversationId);
  }
}

module.exports = new ConversationStore();

