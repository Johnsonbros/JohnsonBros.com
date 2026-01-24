import {
  type Customer, type InsertCustomer,
  type Appointment, type InsertAppointment,
  type BlogPost, type InsertBlogPost,
  type Keyword, type InsertKeyword,
  type PostKeyword, type InsertPostKeyword,
  type KeywordRanking, type InsertKeywordRanking,
  type BlogAnalytics, type InsertBlogAnalytics,
  type AvailableTimeSlotDb,
  type Referral, type InsertReferral,
  type CustomerCredit, type InsertCustomerCredit,
  type Lead, type InsertLead,
  type MemberSubscription,
  type EmailTemplate, type InsertEmailTemplate,
  type UpsellOffer, type InsertUpsellOffer,
  type RevenueMetric, type InsertRevenueMetric,
  type VoiceCallRecording, type InsertVoiceCallRecording,
  type VoiceTranscript, type InsertVoiceTranscript,
  type VoiceDataset, type InsertVoiceDataset,
  type VoiceDatasetSection, type InsertVoiceDatasetSection,
  type VoiceTranscriptAssignment, type InsertVoiceTranscriptAssignment,
  type VoiceTrainingRun, type InsertVoiceTrainingRun,
  type SystemSettings, type InsertSystemSettings,
  type VoiceDatasetMix, type InsertVoiceDatasetMix,
  customers, appointments, blogPosts, keywords, postKeywords, keywordRankings, blogAnalytics,
  referrals, customerCredits, leads, memberSubscriptions,
  emailTemplates, upsellOffers, revenueMetrics,
  voiceCallRecordings, voiceTranscripts, voiceDatasets, voiceDatasetSections, voiceTranscriptAssignments, voiceTrainingRuns,
  voiceDatasetMixes, systemSettings, availableTimeSlots
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, parseInt(id))).limit(1);
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
    return customer;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const normalizedPhone = phone.replace(/\D/g, '');
    const [customer] = await db.select()
      .from(customers)
      .where(eq(customers.normalizedPhone, normalizedPhone))
      .limit(1);
    if (!customer) {
      const [fallbackCustomer] = await db.select()
        .from(customers)
        .where(sql`regexp_replace(${customers.phone}, '[^0-9]', '', 'g') = ${normalizedPhone}`)
        .limit(1);
      return fallbackCustomer;
    }
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const normalizedPhone = customer.phone ? customer.phone.replace(/\D/g, '') : null;
    const [newCustomer] = await db.insert(customers).values({
      ...customer,
      normalizedPhone
    }).returning();
    return newCustomer;
  }

  // Appointment methods
  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, parseInt(id))).limit(1);
    return appointment;
  }

  async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.customerId, parseInt(customerId)));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db.update(appointments)
      .set({ status })
      .where(eq(appointments.id, parseInt(id)))
      .returning();
    return updatedAppointment;
  }

  // Blog methods
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    return post;
  }

  async getAllBlogPosts(status?: string, limit: number = 10, offset: number = 0): Promise<BlogPost[]> {
    let query = db.select().from(blogPosts);
    if (status) {
      query = query.where(eq(blogPosts.status, status as any)) as any;
    }
    return await query.orderBy(desc(blogPosts.createdAt)).limit(limit).offset(offset);
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post as any).returning();
    return newPost;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updatedPost] = await db.update(blogPosts)
      .set({ ...post, updatedAt: new Date() } as any)
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const [deleted] = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
    return !!deleted;
  }

  async incrementPostViews(id: number): Promise<void> {
    await db.update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(eq(blogPosts.id, id));
  }

  // Keyword methods
  async getKeyword(id: number): Promise<Keyword | undefined> {
    const [keyword] = await db.select().from(keywords).where(eq(keywords.id, id)).limit(1);
    return keyword;
  }

  async getKeywordByName(keyword: string): Promise<Keyword | undefined> {
    const [foundKeyword] = await db.select().from(keywords).where(eq(keywords.keyword, keyword)).limit(1);
    return foundKeyword;
  }

  async getAllKeywords(): Promise<Keyword[]> {
    return await db.select().from(keywords).orderBy(asc(keywords.keyword));
  }

  async createKeyword(keyword: InsertKeyword): Promise<Keyword> {
    const [newKeyword] = await db.insert(keywords).values(keyword).returning();
    return newKeyword;
  }

  async updateKeyword(id: number, keyword: Partial<InsertKeyword>): Promise<Keyword | undefined> {
    const [updatedKeyword] = await db.update(keywords)
      .set({ ...keyword, lastTracked: new Date() })
      .where(eq(keywords.id, id))
      .returning();
    return updatedKeyword;
  }

  async deleteKeyword(id: number): Promise<boolean> {
    const [deleted] = await db.delete(keywords).where(eq(keywords.id, id)).returning();
    return !!deleted;
  }

  // Post-Keyword methods
  async getPostKeywords(postId: number): Promise<PostKeyword[]> {
    return await db.select().from(postKeywords).where(eq(postKeywords.postId, postId));
  }

  async getKeywordPosts(keywordId: number): Promise<PostKeyword[]> {
    return await db.select().from(postKeywords).where(eq(postKeywords.keywordId, keywordId));
  }

  async addPostKeyword(postKeyword: InsertPostKeyword): Promise<PostKeyword> {
    const [newPostKeyword] = await db.insert(postKeywords).values(postKeyword).returning();
    return newPostKeyword;
  }

  async removePostKeyword(postId: number, keywordId: number): Promise<boolean> {
    const [deleted] = await db.delete(postKeywords)
      .where(and(eq(postKeywords.postId, postId), eq(postKeywords.keywordId, keywordId)))
      .returning();
    return !!deleted;
  }

  // Ranking methods
  async getKeywordRankings(keywordId: number, limit: number = 30): Promise<KeywordRanking[]> {
    return await db.select().from(keywordRankings)
      .where(eq(keywordRankings.keywordId, keywordId))
      .orderBy(desc(keywordRankings.trackedDate))
      .limit(limit);
  }

  async addKeywordRanking(ranking: InsertKeywordRanking): Promise<KeywordRanking> {
    const [newRanking] = await db.insert(keywordRankings).values(ranking).returning();
    return newRanking;
  }

  // Analytics methods
  async getBlogAnalytics(postId: number, startDate?: Date, endDate?: Date): Promise<BlogAnalytics[]> {
    let query = db.select().from(blogAnalytics).where(eq(blogAnalytics.postId, postId)).$dynamic();
    if (startDate && endDate) {
      query = query.where(and(gte(blogAnalytics.date, startDate), lte(blogAnalytics.date, endDate)));
    }
    return await query.orderBy(desc(blogAnalytics.date));
  }

  async updateBlogAnalytics(analytics: InsertBlogAnalytics): Promise<BlogAnalytics> {
    const [newAnalytics] = await db.insert(blogAnalytics).values(analytics).returning();
    return newAnalytics;
  }

  // Referral methods
  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db.insert(referrals).values(referral).returning();
    return newReferral;
  }

  async getReferral(id: number): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id)).limit(1);
    return referral;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.referralCode, code)).limit(1);
    return referral;
  }

  async getReferralsByCustomer(customerId: string): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrerCustomerId, customerId));
  }

  async updateReferralStatus(id: number, status: string, leadId?: string): Promise<Referral | undefined> {
    const [updated] = await db.update(referrals)
      .set({ status, convertedAt: new Date() })
      .where(eq(referrals.id, id))
      .returning();
    return updated;
  }

  // Credit methods
  async createCustomerCredit(credit: InsertCustomerCredit): Promise<CustomerCredit> {
    const [newCredit] = await db.insert(customerCredits).values(credit).returning();
    return newCredit;
  }

  async getCustomerCredits(customerId: string): Promise<CustomerCredit[]> {
    return await db.select().from(customerCredits).where(eq(customerCredits.customerId, customerId));
  }

  // Email Template methods
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(asc(emailTemplates.name));
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db.update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated;
  }

  // Upsell Offer methods
  async getUpsellOffers(): Promise<UpsellOffer[]> {
    return await db.select().from(upsellOffers)
      .where(eq(upsellOffers.isActive, true))
      .orderBy(asc(upsellOffers.updatedAt));
  }

  // Subscription methods
  async getSubscriptions(): Promise<MemberSubscription[]> {
    return await db.select().from(memberSubscriptions)
      .orderBy(desc(memberSubscriptions.startDate));
  }

  // Revenue Metrics methods
  async getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetric[]> {
    return await db.select().from(revenueMetrics)
      .where(and(
        gte(revenueMetrics.date, startDate),
        lte(revenueMetrics.date, endDate)
      ))
      .orderBy(desc(revenueMetrics.date));
  }

  async createRevenueMetric(metric: InsertRevenueMetric): Promise<RevenueMetric> {
    const [newMetric] = await db.insert(revenueMetrics).values(metric).returning();
    return newMetric;
  }

  async getLatestRevenueMetrics(): Promise<RevenueMetric[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return await db.select().from(revenueMetrics)
      .where(gte(revenueMetrics.date, thirtyDaysAgo))
      .orderBy(desc(revenueMetrics.date))
      .limit(30);
  }

  // Lead methods
  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return lead;
  }

  async getLeadsByLandingPage(landingPage: string): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(eq(leads.landingPage, landingPage))
      .orderBy(desc(leads.createdAt));
  }

  async getLeadsByCampaign(campaignName: string): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(eq(leads.campaignName, campaignName))
      .orderBy(desc(leads.createdAt));
  }

  async updateLeadStatus(id: number, status: string): Promise<Lead | undefined> {
    const [updatedLead] = await db.update(leads)
      .set({ status })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }

  // AI Voice Training methods
  async getVoiceCallRecording(id: number): Promise<VoiceCallRecording | undefined> {
    const [recording] = await db.select().from(voiceCallRecordings).where(eq(voiceCallRecordings.id, id)).limit(1);
    return recording;
  }

  async getVoiceCallBySid(sid: string): Promise<VoiceCallRecording | undefined> {
    const [recording] = await db.select().from(voiceCallRecordings).where(eq(voiceCallRecordings.twilioCallSid, sid)).limit(1);
    return recording;
  }

  async getVoiceCallRecordings(): Promise<VoiceCallRecording[]> {
    return await db.select().from(voiceCallRecordings).orderBy(desc(voiceCallRecordings.createdAt));
  }

  async createVoiceCallRecording(recording: InsertVoiceCallRecording): Promise<VoiceCallRecording> {
    const [newRecording] = await db.insert(voiceCallRecordings).values(recording).returning();
    return newRecording;
  }

  async updateVoiceCallRecording(id: number, updates: Partial<VoiceCallRecording>): Promise<VoiceCallRecording | undefined> {
    const [updated] = await db.update(voiceCallRecordings).set(updates).where(eq(voiceCallRecordings.id, id)).returning();
    return updated;
  }

  async getVoiceCallRecordingsByFingerprint(fingerprint: string): Promise<VoiceCallRecording[]> {
    return await db.select()
      .from(voiceCallRecordings)
      .where(eq(voiceCallRecordings.voiceFingerprint, fingerprint))
      .orderBy(desc(voiceCallRecordings.createdAt));
  }

  async getVoiceTranscript(recordingId: number): Promise<VoiceTranscript | undefined> {
    const [transcript] = await db.select().from(voiceTranscripts).where(eq(voiceTranscripts.recordingId, recordingId)).limit(1);
    return transcript;
  }

  async getVoiceTranscripts(): Promise<VoiceTranscript[]> {
    return await db.select().from(voiceTranscripts);
  }

  async createVoiceTranscript(transcript: InsertVoiceTranscript): Promise<VoiceTranscript> {
    const [newTranscript] = await db.insert(voiceTranscripts).values(transcript).returning();
    return newTranscript;
  }

  async updateVoiceTranscript(id: number, updates: Partial<VoiceTranscript>): Promise<VoiceTranscript | undefined> {
    const [updated] = await db.update(voiceTranscripts).set(updates).where(eq(voiceTranscripts.id, id)).returning();
    return updated;
  }

  async getVoiceDataset(id: number): Promise<VoiceDataset | undefined> {
    const [dataset] = await db.select().from(voiceDatasets).where(eq(voiceDatasets.id, id)).limit(1);
    return dataset;
  }

  async getVoiceDatasets(): Promise<VoiceDataset[]> {
    return await db.select().from(voiceDatasets);
  }

  async getAllVoiceDatasets(): Promise<VoiceDataset[]> {
    return await db.select().from(voiceDatasets);
  }

  async createVoiceDataset(dataset: InsertVoiceDataset): Promise<VoiceDataset> {
    const [newDataset] = await db.insert(voiceDatasets).values(dataset).returning();
    return newDataset;
  }

  async getVoiceDatasetSections(datasetId: number): Promise<VoiceDatasetSection[]> {
    return await db.select().from(voiceDatasetSections).where(eq(voiceDatasetSections.datasetId, datasetId));
  }

  async createVoiceDatasetSection(section: InsertVoiceDatasetSection): Promise<VoiceDatasetSection> {
    const [newSection] = await db.insert(voiceDatasetSections).values(section).returning();
    return newSection;
  }

  async createVoiceTranscriptAssignment(assignment: InsertVoiceTranscriptAssignment): Promise<VoiceTranscriptAssignment> {
    const [newAssignment] = await db.insert(voiceTranscriptAssignments).values(assignment).returning();
    return newAssignment;
  }

  async getTranscriptAssignments(transcriptId: number): Promise<VoiceTranscriptAssignment[]> {
    return await db.select().from(voiceTranscriptAssignments).where(eq(voiceTranscriptAssignments.transcriptId, transcriptId));
  }

  async createVoiceTrainingRun(run: InsertVoiceTrainingRun): Promise<VoiceTrainingRun> {
    const [newRun] = await db.insert(voiceTrainingRuns).values(run).returning();
    return newRun;
  }

  async getVoiceTrainingRun(id: number): Promise<VoiceTrainingRun | undefined> {
    const [run] = await db.select().from(voiceTrainingRuns).where(eq(voiceTrainingRuns.id, id)).limit(1);
    return run;
  }

  async createVoiceDatasetMix(mix: InsertVoiceDatasetMix): Promise<VoiceDatasetMix> {
    const [newMix] = await db.insert(voiceDatasetMixes).values(mix).returning();
    return newMix;
  }

  async getVoiceDatasetMixes(): Promise<VoiceDatasetMix[]> {
    return await db.select().from(voiceDatasetMixes).orderBy(desc(voiceDatasetMixes.createdAt));
  }

  async getVoiceDatasetMix(id: number): Promise<VoiceDatasetMix | undefined> {
    const [mix] = await db.select().from(voiceDatasetMixes).where(eq(voiceDatasetMixes.id, id)).limit(1);
    return mix;
  }

  async getMemberSubscription(customerId: number): Promise<MemberSubscription | undefined> {
    const [sub] = await db.select().from(memberSubscriptions).where(eq(memberSubscriptions.customerId, customerId)).limit(1);
    return sub;
  }

  async getUpsellOffersForService(serviceType: string) {
    return await db.select().from(upsellOffers).where(eq(upsellOffers.isActive, true));
  }

  async getAvailableTimeSlots(date: Date): Promise<AvailableTimeSlotDb[]> {
    const slots = await db.select().from(availableTimeSlots).where(eq(availableTimeSlots.date, date));
    return slots;
  }

  // System Settings methods
  async getSystemSetting<T>(key: string): Promise<T | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    return setting?.value as T | undefined;
  }

  async setSystemSetting<T>(key: string, value: T): Promise<void> {
    await db.insert(systemSettings)
      .values({ key, value: value as any })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: value as any, updatedAt: new Date() }
      });
  }
}

export const dbStorage = new DatabaseStorage();
