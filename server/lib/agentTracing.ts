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
import { eq, desc, and, gte, lte, sql, isNull, isNotNull, inArray } from "drizzle-orm";
import { Logger } from "../src/logger";

export class AgentTracingService {
  private static instance: AgentTracingService;
  private static readonly CACHE_TTL_MS = 6 * 60 * 60 * 1000;
  private static readonly CACHE_CLEANUP_INTERVAL_MS = 30 * 60 * 1000;
  private static readonly DEFAULT_EVAL_GATE_CATEGORIES = [
    'emergency_detection',
    'booking_flow',
    'tool_selection',
  ];
  private conversationCache: Map<string, { id: number; lastAccessed: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.cleanupInterval = setInterval(() => this.cleanupCache(), AgentTracingService.CACHE_CLEANUP_INTERVAL_MS);
    if (typeof this.cleanupInterval.unref === "function") {
      this.cleanupInterval.unref();
    }
  }

  static getInstance(): AgentTracingService {
    if (!AgentTracingService.instance) {
      AgentTracingService.instance = new AgentTracingService();
    }
    return AgentTracingService.instance;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [sessionId, cached] of this.conversationCache.entries()) {
      if (now - cached.lastAccessed > AgentTracingService.CACHE_TTL_MS) {
        this.conversationCache.delete(sessionId);
      }
    }
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

      this.conversationCache.set(data.sessionId, { id: conversation.id, lastAccessed: Date.now() });
      Logger.debug(`[AgentTracing] Created conversation ${conversation.id} for session ${data.sessionId}`);
      return conversation;
    } catch (error: any) {
      Logger.error('[AgentTracing] Failed to create conversation:', error);
      throw error;
    }
  }

  async getOrCreateConversation(sessionId: string, channel: string = 'web_chat', systemPrompt?: string): Promise<number> {
    const cached = this.conversationCache.get(sessionId);
    if (cached) {
      if (Date.now() - cached.lastAccessed < AgentTracingService.CACHE_TTL_MS) {
        cached.lastAccessed = Date.now();
        return cached.id;
      }
      this.conversationCache.delete(sessionId);
    }

    const [existing] = await db.select()
      .from(agentConversations)
      .where(eq(agentConversations.sessionId, sessionId))
      .limit(1);

    if (existing) {
      this.conversationCache.set(sessionId, { id: existing.id, lastAccessed: Date.now() });
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
      const cached = this.conversationCache.get(sessionId);
      if (!cached) return;

      await db.update(agentConversations)
        .set({ 
          outcome,
          endedAt: new Date(),
        })
        .where(eq(agentConversations.id, cached.id));

      this.conversationCache.delete(sessionId);
      Logger.debug(`[AgentTracing] Ended conversation ${cached.id} with outcome: ${outcome}`);
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

  async getEvalGateStatus(options: {
    runId?: string;
    promptVersion?: string;
    modelUsed?: string;
    categories?: string[];
    minPassRate?: number;
  } = {}): Promise<{
    gatePassed: boolean;
    runId?: string;
    promptVersion?: string;
    modelUsed?: string;
    minPassRate: number;
    categories: Record<string, {
      totalRuns: number;
      passedRuns: number;
      passRate: number;
    }>;
    summary: {
      totalRuns: number;
      passedRuns: number;
      overallPassRate: number;
    };
    missingCategories: string[];
    failureReasons: string[];
  }> {
    const categories = (options.categories && options.categories.length > 0)
      ? options.categories
      : AgentTracingService.DEFAULT_EVAL_GATE_CATEGORIES;

    const normalizePassRate = (value?: number): number => {
      const raw = value ?? (process.env.AGENT_EVAL_GATE_MIN_PASS_RATE
        ? parseFloat(process.env.AGENT_EVAL_GATE_MIN_PASS_RATE)
        : 90);
      if (Number.isNaN(raw)) return 90;
      return raw <= 1 ? raw * 100 : raw;
    };

    const minPassRate = normalizePassRate(options.minPassRate);

    let runId = options.runId;
    if (!runId) {
      const [latestRun] = await db.select({ runId: agentEvalRuns.runId })
        .from(agentEvalRuns)
        .orderBy(desc(agentEvalRuns.createdAt))
        .limit(1);
      runId = latestRun?.runId;
    }

    if (!runId) {
      return {
        gatePassed: false,
        minPassRate,
        categories: {},
        summary: {
          totalRuns: 0,
          passedRuns: 0,
          overallPassRate: 0,
        },
        missingCategories: categories,
        failureReasons: ['No eval runs found for release gate.'],
      };
    }

    const conditions = [
      eq(agentEvalRuns.runId, runId),
      eq(agentEvals.isActive, true),
      inArray(agentEvals.category, categories),
    ];

    if (options.promptVersion) {
      conditions.push(eq(agentEvalRuns.promptVersion, options.promptVersion));
    }

    if (options.modelUsed) {
      conditions.push(eq(agentEvalRuns.modelUsed, options.modelUsed));
    }

    const runs = await db.select({
      category: agentEvals.category,
      passed: agentEvalRuns.passed,
    })
      .from(agentEvalRuns)
      .innerJoin(agentEvals, eq(agentEvalRuns.evalId, agentEvals.id))
      .where(and(...conditions));

    const categoryStats: Record<string, { totalRuns: number; passedRuns: number; passRate: number }> = {};
    const missingCategories: string[] = [];
    let totalRuns = 0;
    let passedRuns = 0;

    for (const category of categories) {
      categoryStats[category] = { totalRuns: 0, passedRuns: 0, passRate: 0 };
    }

    for (const run of runs) {
      if (!categoryStats[run.category]) {
        categoryStats[run.category] = { totalRuns: 0, passedRuns: 0, passRate: 0 };
      }
      categoryStats[run.category].totalRuns += 1;
      totalRuns += 1;
      if (run.passed) {
        categoryStats[run.category].passedRuns += 1;
        passedRuns += 1;
      }
    }

    for (const category of categories) {
      const stats = categoryStats[category];
      if (!stats || stats.totalRuns === 0) {
        missingCategories.push(category);
        categoryStats[category] = { totalRuns: 0, passedRuns: 0, passRate: 0 };
      } else {
        stats.passRate = (stats.passedRuns / stats.totalRuns) * 100;
      }
    }

    const overallPassRate = totalRuns > 0 ? (passedRuns / totalRuns) * 100 : 0;
    const failureReasons: string[] = [];
    if (missingCategories.length > 0) {
      failureReasons.push(`Missing eval coverage for: ${missingCategories.join(', ')}`);
    }

    for (const [category, stats] of Object.entries(categoryStats)) {
      if (stats.totalRuns > 0 && stats.passRate < minPassRate) {
        failureReasons.push(
          `Category ${category} below gate (${stats.passRate.toFixed(1)}% < ${minPassRate}%).`
        );
      }
    }

    const gatePassed = failureReasons.length === 0;

    return {
      gatePassed,
      runId,
      promptVersion: options.promptVersion,
      modelUsed: options.modelUsed,
      minPassRate,
      categories: categoryStats,
      summary: {
        totalRuns,
        passedRuns,
        overallPassRate,
      },
      missingCategories,
      failureReasons,
    };
  }

  async getToolCorrectnessReport(options: {
    windowDays?: number;
    endDate?: Date;
  } = {}): Promise<{
    windowDays: number;
    startDate: Date;
    endDate: Date;
    summary: {
      totalCalls: number;
      successRate: number;
      errorRate: number;
      avgLatencyMs: number;
    };
    tools: Array<{
      toolName: string;
      totalCalls: number;
      successRate: number;
      avgLatencyMs: number;
      reviewCoverage: number;
      correctnessRate: number | null;
      wrongToolFlags: number;
      errorRate: number;
      errorRateDelta: number | null;
    }>;
    retrainingQueue: Array<{
      toolName: string;
      reasons: string[];
      errorRate: number;
      wrongToolFlags: number;
      errorRateDelta: number | null;
    }>;
    thresholds: {
      wrongToolFlagThreshold: number;
      errorRateDeltaThreshold: number;
      minErrorRate: number;
    };
  }> {
    const windowDays = options.windowDays
      ?? (process.env.TOOL_CORRECTNESS_WINDOW_DAYS
        ? parseInt(process.env.TOOL_CORRECTNESS_WINDOW_DAYS, 10)
        : 7);
    const endDate = options.endDate ?? new Date();
    const startDate = new Date(endDate.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const prevEndDate = startDate;
    const prevStartDate = new Date(startDate.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const wrongToolFlagThreshold = process.env.TOOL_CORRECTNESS_WRONG_TOOL_THRESHOLD
      ? parseInt(process.env.TOOL_CORRECTNESS_WRONG_TOOL_THRESHOLD, 10)
      : 3;
    const errorRateDeltaThreshold = process.env.TOOL_CORRECTNESS_ERROR_RATE_DELTA
      ? parseFloat(process.env.TOOL_CORRECTNESS_ERROR_RATE_DELTA)
      : 10;
    const minErrorRate = process.env.TOOL_CORRECTNESS_MIN_ERROR_RATE
      ? parseFloat(process.env.TOOL_CORRECTNESS_MIN_ERROR_RATE)
      : 20;

    const toolCallFields = {
      id: agentToolCalls.id,
      toolName: agentToolCalls.toolName,
      success: agentToolCalls.success,
      wasCorrectTool: agentToolCalls.wasCorrectTool,
      latencyMs: agentToolCalls.latencyMs,
      createdAt: agentToolCalls.createdAt,
    };

    const [currentCalls, previousCalls] = await Promise.all([
      db.select(toolCallFields)
        .from(agentToolCalls)
        .where(and(
          gte(agentToolCalls.createdAt, startDate),
          lte(agentToolCalls.createdAt, endDate)
        )),
      db.select(toolCallFields)
        .from(agentToolCalls)
        .where(and(
          gte(agentToolCalls.createdAt, prevStartDate),
          lte(agentToolCalls.createdAt, prevEndDate)
        )),
    ]);

    const feedbackRows = await db.select({
      toolCallId: agentFeedback.toolCallId,
      flagReason: agentFeedback.flagReason,
    })
      .from(agentFeedback)
      .where(and(
        eq(agentFeedback.flagReason, 'wrong_tool'),
        isNotNull(agentFeedback.toolCallId),
        gte(agentFeedback.createdAt, startDate),
        lte(agentFeedback.createdAt, endDate)
      ));

    const toolCallIdToName = new Map<number, string>();
    for (const call of currentCalls) {
      toolCallIdToName.set(call.id, call.toolName);
    }

    const wrongToolFlagsByTool: Record<string, number> = {};
    for (const feedback of feedbackRows) {
      if (!feedback.toolCallId) continue;
      const toolName = toolCallIdToName.get(feedback.toolCallId);
      if (!toolName) continue;
      wrongToolFlagsByTool[toolName] = (wrongToolFlagsByTool[toolName] || 0) + 1;
    }

    const buildToolStats = (calls: typeof currentCalls, wrongToolFlags: Record<string, number>) => {
      const byTool: Record<string, {
        toolName: string;
        totalCalls: number;
        successCount: number;
        latencyTotal: number;
        reviewedCalls: number;
        correctCount: number;
        incorrectCount: number;
        failureCount: number;
      }> = {};

      for (const call of calls) {
        if (!byTool[call.toolName]) {
          byTool[call.toolName] = {
            toolName: call.toolName,
            totalCalls: 0,
            successCount: 0,
            latencyTotal: 0,
            reviewedCalls: 0,
            correctCount: 0,
            incorrectCount: 0,
            failureCount: 0,
          };
        }
        const stats = byTool[call.toolName];
        stats.totalCalls += 1;
        if (call.success) stats.successCount += 1;
        if (!call.success) stats.failureCount += 1;
        stats.latencyTotal += call.latencyMs || 0;
        if (call.wasCorrectTool !== null) {
          stats.reviewedCalls += 1;
          if (call.wasCorrectTool) {
            stats.correctCount += 1;
          } else {
            stats.incorrectCount += 1;
          }
        }
      }

      return Object.values(byTool).map((stats) => {
        const successRate = stats.totalCalls > 0 ? (stats.successCount / stats.totalCalls) * 100 : 0;
        const avgLatencyMs = stats.totalCalls > 0 ? stats.latencyTotal / stats.totalCalls : 0;
        const reviewCoverage = stats.totalCalls > 0 ? (stats.reviewedCalls / stats.totalCalls) * 100 : 0;
        const correctnessRate = stats.reviewedCalls > 0 ? (stats.correctCount / stats.reviewedCalls) * 100 : null;
        const errorRate = stats.totalCalls > 0
          ? ((stats.failureCount + stats.incorrectCount) / stats.totalCalls) * 100
          : 0;
        return {
          toolName: stats.toolName,
          totalCalls: stats.totalCalls,
          successRate,
          avgLatencyMs,
          reviewCoverage,
          correctnessRate,
          wrongToolFlags: wrongToolFlags[stats.toolName] || 0,
          errorRate,
        };
      });
    };

    const currentStats = buildToolStats(currentCalls, wrongToolFlagsByTool);
    const previousStats = buildToolStats(previousCalls, {});
    const previousStatsByTool = new Map(previousStats.map(stat => [stat.toolName, stat]));

    const tools = currentStats
      .map(stat => {
        const previous = previousStatsByTool.get(stat.toolName);
        const errorRateDelta = previous
          ? stat.errorRate - previous.errorRate
          : null;
        return {
          ...stat,
          errorRateDelta,
        };
      })
      .sort((a, b) => b.totalCalls - a.totalCalls);

    const retrainingQueue = tools
      .map((stat) => {
        const reasons: string[] = [];
        if (stat.wrongToolFlags >= wrongToolFlagThreshold) {
          reasons.push(`Wrong tool feedback flagged ${stat.wrongToolFlags}x`);
        }
        if (stat.errorRateDelta !== null
          && stat.errorRateDelta >= errorRateDeltaThreshold
          && stat.errorRate >= minErrorRate) {
          reasons.push(
            `Error rate increased by ${stat.errorRateDelta.toFixed(1)}pp to ${stat.errorRate.toFixed(1)}%`
          );
        }
        return {
          toolName: stat.toolName,
          reasons,
          errorRate: stat.errorRate,
          wrongToolFlags: stat.wrongToolFlags,
          errorRateDelta: stat.errorRateDelta,
        };
      })
      .filter(entry => entry.reasons.length > 0)
      .sort((a, b) => b.wrongToolFlags - a.wrongToolFlags);

    const totalCalls = currentCalls.length;
    const successRate = totalCalls > 0
      ? (currentCalls.filter(call => call.success).length / totalCalls) * 100
      : 0;
    const avgLatencyMs = totalCalls > 0
      ? currentCalls.reduce((sum, call) => sum + (call.latencyMs || 0), 0) / totalCalls
      : 0;
    const totalErrorRate = totalCalls > 0
      ? ((currentCalls.filter(call => !call.success).length
        + currentCalls.filter(call => call.wasCorrectTool === false).length) / totalCalls) * 100
      : 0;

    return {
      windowDays,
      startDate,
      endDate,
      summary: {
        totalCalls,
        successRate,
        errorRate: totalErrorRate,
        avgLatencyMs,
      },
      tools,
      retrainingQueue,
      thresholds: {
        wrongToolFlagThreshold,
        errorRateDeltaThreshold,
        minErrorRate,
      },
    };
  }
}

export const agentTracing = AgentTracingService.getInstance();
