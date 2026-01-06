import { db } from "../db";
import { 
  agentConversations, 
  agentToolCalls, 
  agentFeedback,
  agentEvals,
  agentEvalRuns,
  type AgentConversation,
  type AgentToolCall,
  type AgentFeedback,
  type InsertAgentConversation,
  type InsertAgentToolCall,
  type InsertAgentFeedback,
  type FineTuningExample
} from "@shared/schema";
import { eq, desc, and, gte, lte, sql, isNull, isNotNull } from "drizzle-orm";
import { Logger } from "../src/logger";

export class AgentTracingService {
  private static instance: AgentTracingService;
  private conversationCache: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): AgentTracingService {
    if (!AgentTracingService.instance) {
      AgentTracingService.instance = new AgentTracingService();
    }
    return AgentTracingService.instance;
  }

  async createConversation(data: {
    sessionId: string;
    channel: string;
    customerPhone?: string;
    customerId?: number;
    systemPrompt?: string;
  }): Promise<AgentConversation> {
    try {
      const [conversation] = await db.insert(agentConversations).values({
        sessionId: data.sessionId,
        channel: data.channel,
        customerPhone: data.customerPhone,
        customerId: data.customerId,
        systemPrompt: data.systemPrompt,
        messages: [],
        totalTokens: 0,
        totalToolCalls: 0,
      }).returning();

      this.conversationCache.set(data.sessionId, conversation.id);
      Logger.debug(`[AgentTracing] Created conversation ${conversation.id} for session ${data.sessionId}`);
      return conversation;
    } catch (error: any) {
      Logger.error('[AgentTracing] Failed to create conversation:', error);
      throw error;
    }
  }

  async getOrCreateConversation(sessionId: string, channel: string = 'web_chat', systemPrompt?: string): Promise<number> {
    if (this.conversationCache.has(sessionId)) {
      return this.conversationCache.get(sessionId)!;
    }

    const [existing] = await db.select()
      .from(agentConversations)
      .where(eq(agentConversations.sessionId, sessionId))
      .limit(1);

    if (existing) {
      this.conversationCache.set(sessionId, existing.id);
      return existing.id;
    }

    const conversation = await this.createConversation({ sessionId, channel, systemPrompt });
    return conversation.id;
  }

  async addMessage(sessionId: string, message: {
    role: string;
    content: string;
    toolCalls?: Array<{ id: string; name: string; arguments: any }>;
    toolCallId?: string;
  }): Promise<void> {
    try {
      const conversationId = await this.getOrCreateConversation(sessionId);
      
      const [conversation] = await db.select()
        .from(agentConversations)
        .where(eq(agentConversations.id, conversationId))
        .limit(1);

      if (!conversation) return;

      const messages = (conversation.messages || []) as Array<any>;
      messages.push({
        ...message,
        timestamp: new Date().toISOString(),
      });

      await db.update(agentConversations)
        .set({ 
          messages,
          totalToolCalls: message.toolCalls ? 
            (conversation.totalToolCalls || 0) + message.toolCalls.length : 
            conversation.totalToolCalls 
        })
        .where(eq(agentConversations.id, conversationId));

    } catch (error: any) {
      Logger.error('[AgentTracing] Failed to add message:', error);
    }
  }

  async logToolCall(data: {
    sessionId: string;
    toolName: string;
    toolCallId: string;
    arguments: Record<string, any>;
    userMessageTrigger?: string;
  }): Promise<number | null> {
    try {
      const conversationId = await this.getOrCreateConversation(data.sessionId);
      
      const [toolCall] = await db.insert(agentToolCalls).values({
        conversationId,
        toolName: data.toolName,
        toolCallId: data.toolCallId,
        arguments: data.arguments,
        userMessageTrigger: data.userMessageTrigger,
        success: true,
      }).returning();

      Logger.debug(`[AgentTracing] Logged tool call ${toolCall.id}: ${data.toolName}`);
      return toolCall.id;
    } catch (error: any) {
      Logger.error('[AgentTracing] Failed to log tool call:', error);
      return null;
    }
  }

  async updateToolCallResult(toolCallId: number, data: {
    result: any;
    success: boolean;
    errorMessage?: string;
    latencyMs?: number;
  }): Promise<void> {
    try {
      await db.update(agentToolCalls)
        .set({
          result: data.result,
          success: data.success,
          errorMessage: data.errorMessage,
          latencyMs: data.latencyMs,
        })
        .where(eq(agentToolCalls.id, toolCallId));
    } catch (error: any) {
      Logger.error('[AgentTracing] Failed to update tool call result:', error);
    }
  }

  async endConversation(sessionId: string, outcome: string): Promise<void> {
    try {
      const conversationId = this.conversationCache.get(sessionId);
      if (!conversationId) return;

      await db.update(agentConversations)
        .set({ 
          outcome,
          endedAt: new Date(),
        })
        .where(eq(agentConversations.id, conversationId));

      this.conversationCache.delete(sessionId);
      Logger.debug(`[AgentTracing] Ended conversation ${conversationId} with outcome: ${outcome}`);
    } catch (error: any) {
      Logger.error('[AgentTracing] Failed to end conversation:', error);
    }
  }

  async getConversations(options: {
    channel?: string;
    outcome?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<AgentConversation[]> {
    const { channel, outcome, startDate, endDate, limit = 50, offset = 0 } = options;

    let query = db.select().from(agentConversations);
    const conditions = [];

    if (channel) conditions.push(eq(agentConversations.channel, channel));
    if (outcome) conditions.push(eq(agentConversations.outcome, outcome));
    if (startDate) conditions.push(gte(agentConversations.startedAt, startDate));
    if (endDate) conditions.push(lte(agentConversations.startedAt, endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query
      .orderBy(desc(agentConversations.startedAt))
      .limit(limit)
      .offset(offset);
  }

  async getConversation(id: number): Promise<AgentConversation | null> {
    const [conversation] = await db.select()
      .from(agentConversations)
      .where(eq(agentConversations.id, id))
      .limit(1);
    return conversation || null;
  }

  async getConversationBySession(sessionId: string): Promise<AgentConversation | null> {
    const [conversation] = await db.select()
      .from(agentConversations)
      .where(eq(agentConversations.sessionId, sessionId))
      .limit(1);
    return conversation || null;
  }

  async getToolCalls(conversationId: number): Promise<AgentToolCall[]> {
    return await db.select()
      .from(agentToolCalls)
      .where(eq(agentToolCalls.conversationId, conversationId))
      .orderBy(agentToolCalls.createdAt);
  }

  async getToolCallStats(startDate?: Date, endDate?: Date): Promise<{
    totalCalls: number;
    successRate: number;
    avgLatencyMs: number;
    byTool: Record<string, { count: number; successRate: number; avgLatency: number }>;
  }> {
    const conditions = [];
    if (startDate) conditions.push(gte(agentToolCalls.createdAt, startDate));
    if (endDate) conditions.push(lte(agentToolCalls.createdAt, endDate));

    const allCalls = await db.select()
      .from(agentToolCalls)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCalls = allCalls.length;
    const successfulCalls = allCalls.filter(c => c.success).length;
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    const avgLatencyMs = totalCalls > 0 
      ? allCalls.reduce((sum, c) => sum + (c.latencyMs || 0), 0) / totalCalls 
      : 0;

    const byTool: Record<string, { count: number; successRate: number; avgLatency: number }> = {};
    for (const call of allCalls) {
      if (!byTool[call.toolName]) {
        byTool[call.toolName] = { count: 0, successRate: 0, avgLatency: 0 };
      }
      byTool[call.toolName].count++;
    }

    for (const toolName of Object.keys(byTool)) {
      const toolCalls = allCalls.filter(c => c.toolName === toolName);
      const successCount = toolCalls.filter(c => c.success).length;
      byTool[toolName].successRate = (successCount / toolCalls.length) * 100;
      byTool[toolName].avgLatency = toolCalls.reduce((sum, c) => sum + (c.latencyMs || 0), 0) / toolCalls.length;
    }

    return { totalCalls, successRate, avgLatencyMs, byTool };
  }

  async addFeedback(data: InsertAgentFeedback): Promise<AgentFeedback> {
    const [feedback] = await db.insert(agentFeedback).values(data).returning();
    return feedback;
  }

  async getFeedback(conversationId: number): Promise<AgentFeedback[]> {
    return await db.select()
      .from(agentFeedback)
      .where(eq(agentFeedback.conversationId, conversationId))
      .orderBy(agentFeedback.createdAt);
  }

  async flagToolCall(toolCallId: number, data: {
    wasCorrectTool: boolean;
    correctToolSuggestion?: string;
    flagReason?: string;
    annotation?: string;
    reviewedBy?: string;
  }): Promise<void> {
    await db.update(agentToolCalls)
      .set({
        wasCorrectTool: data.wasCorrectTool,
        correctToolSuggestion: data.correctToolSuggestion,
      })
      .where(eq(agentToolCalls.id, toolCallId));

    const [toolCall] = await db.select()
      .from(agentToolCalls)
      .where(eq(agentToolCalls.id, toolCallId))
      .limit(1);

    if (toolCall && data.flagReason) {
      await db.insert(agentFeedback).values({
        conversationId: toolCall.conversationId,
        toolCallId: toolCallId,
        feedbackType: 'flag',
        flagReason: data.flagReason,
        annotation: data.annotation,
        reviewedBy: data.reviewedBy,
        reviewedAt: new Date(),
      });
    }
  }

  async exportForFineTuning(options: {
    minRating?: number;
    includeCorrections?: boolean;
    excludeFlagged?: boolean;
  } = {}): Promise<FineTuningExample[]> {
    const { minRating = 4, includeCorrections = true, excludeFlagged = true } = options;

    const conversations = await db.select()
      .from(agentConversations)
      .where(eq(agentConversations.outcome, 'completed'))
      .orderBy(desc(agentConversations.startedAt));

    const examples: FineTuningExample[] = [];

    for (const conv of conversations) {
      const feedback = await this.getFeedback(conv.id);
      
      if (excludeFlagged) {
        const hasFlags = feedback.some(f => f.feedbackType === 'flag');
        if (hasFlags) continue;
      }

      const ratings = feedback.filter(f => f.rating !== null);
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, f) => sum + (f.rating || 0), 0) / ratings.length;
        if (avgRating < minRating) continue;
      }

      const messages = (conv.messages || []) as Array<any>;
      const formattedMessages: FineTuningExample['messages'] = [];

      if (conv.systemPrompt) {
        formattedMessages.push({
          role: 'system',
          content: conv.systemPrompt,
        });
      }

      for (const msg of messages) {
        if (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant') {
          const correctionFeedback = includeCorrections 
            ? feedback.find(f => f.messageIndex === messages.indexOf(msg) && f.correctedResponse)
            : null;

          formattedMessages.push({
            role: msg.role,
            content: correctionFeedback?.correctedResponse || msg.content,
            ...(msg.toolCalls && {
              tool_calls: msg.toolCalls.map((tc: any) => ({
                id: tc.id,
                type: 'function' as const,
                function: {
                  name: tc.name,
                  arguments: JSON.stringify(tc.arguments),
                },
              })),
            }),
            ...(msg.toolCallId && { tool_call_id: msg.toolCallId }),
          });
        }
      }

      if (formattedMessages.length > 1) {
        examples.push({ messages: formattedMessages });
      }
    }

    return examples;
  }

  async getConversationStats(startDate?: Date, endDate?: Date): Promise<{
    totalConversations: number;
    byChannel: Record<string, number>;
    byOutcome: Record<string, number>;
    avgToolCallsPerConversation: number;
    avgMessagesPerConversation: number;
  }> {
    const conditions = [];
    if (startDate) conditions.push(gte(agentConversations.startedAt, startDate));
    if (endDate) conditions.push(lte(agentConversations.startedAt, endDate));

    const conversations = await db.select()
      .from(agentConversations)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalConversations = conversations.length;
    const byChannel: Record<string, number> = {};
    const byOutcome: Record<string, number> = {};
    let totalToolCalls = 0;
    let totalMessages = 0;

    for (const conv of conversations) {
      byChannel[conv.channel] = (byChannel[conv.channel] || 0) + 1;
      if (conv.outcome) {
        byOutcome[conv.outcome] = (byOutcome[conv.outcome] || 0) + 1;
      }
      totalToolCalls += conv.totalToolCalls || 0;
      totalMessages += (conv.messages as Array<any>)?.length || 0;
    }

    return {
      totalConversations,
      byChannel,
      byOutcome,
      avgToolCallsPerConversation: totalConversations > 0 ? totalToolCalls / totalConversations : 0,
      avgMessagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0,
    };
  }

  async getPendingReviews(): Promise<Array<{
    conversation: AgentConversation;
    toolCalls: AgentToolCall[];
    feedback: AgentFeedback[];
  }>> {
    const toolCallsNeedingReview = await db.select()
      .from(agentToolCalls)
      .where(isNull(agentToolCalls.wasCorrectTool))
      .orderBy(desc(agentToolCalls.createdAt))
      .limit(100);

    const conversationIds = [...new Set(toolCallsNeedingReview.map(tc => tc.conversationId))];
    const results = [];

    for (const convId of conversationIds.slice(0, 20)) {
      const conversation = await this.getConversation(convId);
      if (!conversation) continue;

      const toolCalls = await this.getToolCalls(convId);
      const feedback = await this.getFeedback(convId);

      results.push({ conversation, toolCalls, feedback });
    }

    return results;
  }
}

export const agentTracing = AgentTracingService.getInstance();
