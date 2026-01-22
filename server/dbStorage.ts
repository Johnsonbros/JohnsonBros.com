import { 
  type Customer, type InsertCustomer, 
  type Appointment, type InsertAppointment,
  type BlogPost, type InsertBlogPost,
  type Keyword, type InsertKeyword,
  type PostKeyword, type InsertPostKeyword,
  type KeywordRanking, type InsertKeywordRanking,
  type BlogAnalytics, type InsertBlogAnalytics,
  type AvailableTimeSlot,
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
  customers, appointments, blogPosts, keywords, postKeywords, keywordRankings, blogAnalytics,
  referrals, customerCredits, leads, memberSubscriptions,
  emailTemplates, upsellOffers, revenueMetrics,
  voiceCallRecordings, voiceTranscripts, voiceDatasets, voiceDatasetSections, voiceTranscriptAssignments, voiceTrainingRuns
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
    // Normalize phone number for comparison (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');
    
    // Use indexed normalizedPhone column for fast lookup
    const [customer] = await db.select()
      .from(customers)
      .where(eq(customers.normalizedPhone, normalizedPhone))
      .limit(1);
    
    // If not found and normalizedPhone might be NULL (legacy data), try regex fallback
    if (!customer) {
      const [fallbackCustomer] = await db.select()
        .from(customers)
        .where(sql`${customers.normalizedPhone} IS NULL AND regexp_replace(${customers.phone}, '[^0-9]', '', 'g') = ${normalizedPhone}`)
        .limit(1);
      return fallbackCustomer;
    }
    
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    // Normalize phone for storage and indexing
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

  async getAllBlogPosts(status?: string, limit?: number, offset?: number): Promise<BlogPost[]> {
    const baseQuery = db.select().from(blogPosts);
    
    if (status && limit !== undefined && offset !== undefined) {
      return await baseQuery
        .where(eq(blogPosts.status, status))
        .orderBy(desc(blogPosts.publishDate))
        .limit(limit)
        .offset(offset);
    } else if (status && limit !== undefined) {
      return await baseQuery
        .where(eq(blogPosts.status, status))
        .orderBy(desc(blogPosts.publishDate))
        .limit(limit);
    } else if (status) {
      return await baseQuery
        .where(eq(blogPosts.status, status))
        .orderBy(desc(blogPosts.publishDate));
    } else if (limit !== undefined && offset !== undefined) {
      return await baseQuery
        .orderBy(desc(blogPosts.publishDate))
        .limit(limit)
        .offset(offset);
    } else if (limit !== undefined) {
      return await baseQuery
        .orderBy(desc(blogPosts.publishDate))
        .limit(limit);
    } else {
      return await baseQuery.orderBy(desc(blogPosts.publishDate));
    }
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values({
      ...post,
      publishDate: post.publishDate ? new Date(post.publishDate) : null
    }).returning();
    return newPost;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const updateData = {
      ...post,
      publishDate: post.publishDate ? new Date(post.publishDate) : undefined,
      updatedAt: new Date()
    };
    
    const [updatedPost] = await db.update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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
    const [result] = await db.select().from(keywords).where(eq(keywords.keyword, keyword)).limit(1);
    return result;
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
      .set(keyword)
      .where(eq(keywords.id, id))
      .returning();
    return updatedKeyword;
  }

  async deleteKeyword(id: number): Promise<boolean> {
    const result = await db.delete(keywords).where(eq(keywords.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Post-Keyword relationship methods
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
    const result = await db.delete(postKeywords)
      .where(and(eq(postKeywords.postId, postId), eq(postKeywords.keywordId, keywordId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Keyword ranking methods
  async getKeywordRankings(keywordId: number, limit?: number): Promise<KeywordRanking[]> {
    const baseQuery = db.select().from(keywordRankings)
      .where(eq(keywordRankings.keywordId, keywordId))
      .orderBy(desc(keywordRankings.trackedDate));
    
    if (limit) {
      return await baseQuery.limit(limit);
    }
    
    return await baseQuery;
  }

  async addKeywordRanking(ranking: InsertKeywordRanking): Promise<KeywordRanking> {
    const [newRanking] = await db.insert(keywordRankings).values(ranking).returning();
    return newRanking;
  }
  
  // Analytics methods
  async getBlogAnalytics(postId: number, startDate?: Date, endDate?: Date): Promise<BlogAnalytics[]> {
    const conditions = [eq(blogAnalytics.postId, postId)];
    
    if (startDate) {
      conditions.push(gte(blogAnalytics.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(blogAnalytics.date, endDate));
    }
    
    return await db.select().from(blogAnalytics).where(and(...conditions));
  }

  async updateBlogAnalytics(analytics: InsertBlogAnalytics): Promise<BlogAnalytics> {
    // Try to find existing analytics for this post and date
    const [existing] = await db.select().from(blogAnalytics)
      .where(and(
        eq(blogAnalytics.postId, analytics.postId),
        eq(blogAnalytics.date, analytics.date)
      ))
      .limit(1);
    
    if (existing) {
      const [updated] = await db.update(blogAnalytics)
        .set(analytics)
        .where(eq(blogAnalytics.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newAnalytics] = await db.insert(blogAnalytics).values(analytics).returning();
      return newAnalytics;
    }
  }

  // Time slots method (not implemented in database - using HousecallPro API)
  async getAvailableTimeSlots(date: string): Promise<AvailableTimeSlot[]> {
    // Time slots come from HousecallPro API, not database storage
    // This method is here for interface compatibility
    return [];
  }

  // Referral methods
  async createReferral(referral: InsertReferral): Promise<Referral> {
    const code = `REF${Date.now().toString(36).toUpperCase()}`;
    const [newReferral] = await db.insert(referrals).values({
      ...referral,
      referralCode: code
    }).returning();
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
    const updateData: any = { status };
    if (leadId) {
      updateData.referredLeadId = leadId;
    }
    if (status === 'converted') {
      updateData.convertedAt = new Date();
    }
    
    const [updated] = await db.update(referrals)
      .set(updateData)
      .where(eq(referrals.id, id))
      .returning();
    return updated;
  }

  // Customer credit methods
  async createCustomerCredit(credit: InsertCustomerCredit): Promise<CustomerCredit> {
    const [newCredit] = await db.insert(customerCredits).values(credit).returning();
    return newCredit;
  }

  async getCustomerCredits(customerId: string): Promise<CustomerCredit[]> {
    return await db.select().from(customerCredits)
      .where(and(
        eq(customerCredits.customerId, customerId),
        eq(customerCredits.status, 'available')
      ));
  }

  async applyCredit(creditId: number, jobId: string): Promise<CustomerCredit | undefined> {
    const [credit] = await db.update(customerCredits)
      .set({
        status: 'applied',
        appliedToJobId: jobId,
        appliedAt: new Date()
      })
      .where(and(
        eq(customerCredits.id, creditId),
        eq(customerCredits.status, 'available')
      ))
      .returning();
    return credit;
  }

  // Member Subscription methods
  async getMemberSubscription(customerId: number): Promise<MemberSubscription | undefined> {
    const [subscription] = await db.select().from(memberSubscriptions)
      .where(and(
        eq(memberSubscriptions.customerId, customerId),
        eq(memberSubscriptions.status, 'active')
      ))
      .limit(1);
    return subscription;
  }

  async updateMemberSubscription(id: number, updates: Partial<MemberSubscription>): Promise<MemberSubscription | undefined> {
    const [updated] = await db.update(memberSubscriptions)
      .set(updates)
      .where(eq(memberSubscriptions.id, id))
      .returning();
    return updated;
  }

  // Email Template methods
  async getEmailTemplates(category?: string): Promise<EmailTemplate[]> {
    if (category) {
      return await db.select().from(emailTemplates)
        .where(and(
          eq(emailTemplates.category, category),
          eq(emailTemplates.isActive, true)
        ));
    }
    return await db.select().from(emailTemplates)
      .where(eq(emailTemplates.isActive, true));
  }

  async getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates)
      .where(and(
        eq(emailTemplates.name, name),
        eq(emailTemplates.isActive, true)
      ))
      .limit(1);
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values([template]).returning();
    return newTemplate;
  }

  // Upsell Offer methods
  async getUpsellOffersForService(serviceName: string): Promise<UpsellOffer[]> {
    return await db.select().from(upsellOffers)
      .where(and(
        eq(upsellOffers.triggerService, serviceName),
        eq(upsellOffers.isActive, true)
      ))
      .orderBy(asc(upsellOffers.displayOrder));
  }

  async createUpsellOffer(offer: InsertUpsellOffer): Promise<UpsellOffer> {
    const [newOffer] = await db.insert(upsellOffers).values(offer).returning();
    return newOffer;
  }

  async getUpsellOffers(): Promise<UpsellOffer[]> {
    return await db.select().from(upsellOffers)
      .where(eq(upsellOffers.isActive, true))
      .orderBy(asc(upsellOffers.displayOrder));
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
    const [recording] = await db.select().from(voiceCallRecordings).where(eq(voiceCallRecordings.id, id));
    return recording;
  }

  async getVoiceCallBySid(sid: string): Promise<VoiceCallRecording | undefined> {
    const [recording] = await db.select().from(voiceCallRecordings).where(eq(voiceCallRecordings.twilioCallSid, sid));
    return recording;
  }

  async createVoiceCallRecording(recording: InsertVoiceCallRecording): Promise<VoiceCallRecording> {
    const [newRecording] = await db.insert(voiceCallRecordings).values(recording).returning();
    return newRecording;
  }

  async updateVoiceCallRecording(id: number, updates: Partial<VoiceCallRecording>): Promise<VoiceCallRecording | undefined> {
    const [updated] = await db.update(voiceCallRecordings).set(updates).where(eq(voiceCallRecordings.id, id)).returning();
    return updated;
  }

  async getVoiceTranscript(recordingId: number): Promise<VoiceTranscript | undefined> {
    const [transcript] = await db.select().from(voiceTranscripts).where(eq(voiceTranscripts.recordingId, recordingId));
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
    const [dataset] = await db.select().from(voiceDatasets).where(eq(voiceDatasets.id, id));
    return dataset;
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
    const [run] = await db.select().from(voiceTrainingRuns).where(eq(voiceTrainingRuns.id, id));
    return run;
  }

  async getVoiceCallRecordings(): Promise<VoiceCallRecording[]> {
    return await db.select().from(voiceCallRecordings).orderBy(desc(voiceCallRecordings.createdAt));
  }
}

export const dbStorage = new DatabaseStorage();
