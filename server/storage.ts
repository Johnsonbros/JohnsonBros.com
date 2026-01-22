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
  type SystemSettings, type InsertSystemSettings,
  type VoiceDatasetMix, type InsertVoiceDatasetMix
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Customer methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Appointment methods
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentsByCustomer(customerId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined>;
  
  // Blog methods
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(status?: string, limit?: number, offset?: number): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  incrementPostViews(id: number): Promise<void>;
  
  // Keyword methods
  getKeyword(id: number): Promise<Keyword | undefined>;
  getKeywordByName(keyword: string): Promise<Keyword | undefined>;
  getAllKeywords(): Promise<Keyword[]>;
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  updateKeyword(id: number, keyword: Partial<InsertKeyword>): Promise<Keyword | undefined>;
  deleteKeyword(id: number): Promise<boolean>;
  
  // Post-Keyword relationship methods
  getPostKeywords(postId: number): Promise<PostKeyword[]>;
  getKeywordPosts(keywordId: number): Promise<PostKeyword[]>;
  addPostKeyword(postKeyword: InsertPostKeyword): Promise<PostKeyword>;
  removePostKeyword(postId: number, keywordId: number): Promise<boolean>;
  
  // Keyword ranking methods
  getKeywordRankings(keywordId: number, limit?: number): Promise<KeywordRanking[]>;
  addKeywordRanking(ranking: InsertKeywordRanking): Promise<KeywordRanking>;
  
  // Analytics methods
  getBlogAnalytics(postId: number, startDate?: Date, endDate?: Date): Promise<BlogAnalytics[]>;
  updateBlogAnalytics(analytics: InsertBlogAnalytics): Promise<BlogAnalytics>;
  
  // Referral methods
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferral(id: number): Promise<Referral | undefined>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getReferralsByCustomer(customerId: string): Promise<Referral[]>;
  updateReferralStatus(id: number, status: string, leadId?: string): Promise<Referral | undefined>;
  
  // Customer credit methods
  createCustomerCredit(credit: InsertCustomerCredit): Promise<CustomerCredit>;
  getCustomerCredits(customerId: string): Promise<CustomerCredit[]>;

  // Email Template methods
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;

  // Upsell Offer methods
  getUpsellOffers(): Promise<UpsellOffer[]>;

  // Subscription methods
  getSubscriptions(): Promise<MemberSubscription[]>;

  // Revenue Metrics methods
  getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetric[]>;
  createRevenueMetric(metric: InsertRevenueMetric): Promise<RevenueMetric>;
  getLatestRevenueMetrics(): Promise<RevenueMetric[]>;

  // Lead methods
  createLead(lead: InsertLead): Promise<Lead>;
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByLandingPage(landingPage: string): Promise<Lead[]>;
  getLeadsByCampaign(campaignName: string): Promise<Lead[]>;
  updateLeadStatus(id: number, status: string): Promise<Lead | undefined>;

  // AI Voice Training methods
  getVoiceCallRecording(id: number): Promise<VoiceCallRecording | undefined>;
  getVoiceCallBySid(sid: string): Promise<VoiceCallRecording | undefined>;
  getVoiceCallRecordings(): Promise<VoiceCallRecording[]>;
  createVoiceCallRecording(recording: InsertVoiceCallRecording): Promise<VoiceCallRecording>;
  updateVoiceCallRecording(id: number, updates: Partial<VoiceCallRecording>): Promise<VoiceCallRecording | undefined>;
  getVoiceCallRecordingsByFingerprint(fingerprint: string): Promise<VoiceCallRecording[]>;
  getVoiceTranscript(recordingId: number): Promise<VoiceTranscript | undefined>;
  getVoiceTranscripts(): Promise<VoiceTranscript[]>;
  createVoiceTranscript(transcript: InsertVoiceTranscript): Promise<VoiceTranscript>;
  updateVoiceTranscript(id: number, updates: Partial<VoiceTranscript>): Promise<VoiceTranscript | undefined>;
  getVoiceDataset(id: number): Promise<VoiceDataset | undefined>;
  getVoiceDatasets(): Promise<VoiceDataset[]> ;
  getAllVoiceDatasets(): Promise<VoiceDataset[]>;
  createVoiceDataset(dataset: InsertVoiceDataset): Promise<VoiceDataset>;
  getVoiceDatasetSections(datasetId: number): Promise<VoiceDatasetSection[]>;
  createVoiceDatasetSection(section: InsertVoiceDatasetSection): Promise<VoiceDatasetSection>;
  createVoiceTranscriptAssignment(assignment: InsertVoiceTranscriptAssignment): Promise<VoiceTranscriptAssignment>;
  getTranscriptAssignments(transcriptId: number): Promise<VoiceTranscriptAssignment[]>;
  createVoiceTrainingRun(run: InsertVoiceTrainingRun): Promise<VoiceTrainingRun>;
  getVoiceTrainingRun(id: number): Promise<VoiceTrainingRun | undefined>;
  createVoiceDatasetMix(mix: InsertVoiceDatasetMix): Promise<VoiceDatasetMix>;
  getVoiceDatasetMixes(): Promise<VoiceDatasetMix[]>;
  getVoiceDatasetMix(id: number): Promise<VoiceDatasetMix | undefined>;

  // System Settings methods
  getSystemSetting<T>(key: string): Promise<T | undefined>;
  setSystemSetting<T>(key: string, value: T): Promise<void>;
}

export class MemStorage implements IStorage {
  private customers: Map<number, Customer> = new Map();
  private appointments: Map<number, Appointment> = new Map();
  private blogPosts: Map<number, BlogPost> = new Map();
  private keywords: Map<number, Keyword> = new Map();
  private postKeywords: Map<number, PostKeyword> = new Map();
  private keywordRankings: Map<number, KeywordRanking> = new Map();
  private blogAnalytics: Map<number, BlogAnalytics> = new Map();
  private referrals: Map<number, Referral> = new Map();
  private customerCredits: Map<number, CustomerCredit> = new Map();
  private emailTemplates: Map<number, EmailTemplate> = new Map();
  private upsellOffers: Map<number, UpsellOffer> = new Map();
  private memberSubscriptions: Map<number, MemberSubscription> = new Map();
  private revenueMetrics: Map<number, RevenueMetric> = new Map();
  private leads: Map<number, Lead> = new Map();

  private nextId = 1;

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(parseInt(id));
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(c => c.email === email);
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const normalized = phone.replace(/\D/g, '');
    return Array.from(this.customers.values()).find(c => c.normalizedPhone === normalized);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.nextId++;
    const newCustomer: Customer = {
      ...customer,
      id,
      normalizedPhone: customer.phone ? customer.phone.replace(/\D/g, '') : null,
      housecallProId: customer.housecallProId ?? null,
      createdAt: new Date()
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(parseInt(id));
  }

  async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(a => a.customerId === parseInt(customerId));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.nextId++;
    const newAppointment: Appointment = {
      ...appointment,
      id,
      status: appointment.status ?? 'scheduled',
      address: appointment.address ?? null,
      notes: appointment.notes ?? null,
      createdAt: new Date()
    };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(parseInt(id));
    if (appointment) {
      appointment.status = status;
      this.appointments.set(parseInt(id), appointment);
      return appointment;
    }
    return undefined;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(p => p.slug === slug);
  }

  async getAllBlogPosts(status?: string, limit: number = 10, offset: number = 0): Promise<BlogPost[]> {
    let posts = Array.from(this.blogPosts.values());
    if (status) posts = posts.filter(p => p.status === status);
    return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(offset, offset + limit);
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.nextId++;
    const newPost: BlogPost = {
      ...post,
      id,
      description: post.description ?? null,
      featuredImage: post.featuredImage ?? null,
      tags: post.tags ?? [],
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.blogPosts.set(id, newPost);
    return newPost;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existing = this.blogPosts.get(id);
    if (existing) {
      const updated = { ...existing, ...post, updatedAt: new Date() };
      this.blogPosts.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  async incrementPostViews(id: number): Promise<void> {
    const post = this.blogPosts.get(id);
    if (post) {
      post.views++;
      this.blogPosts.set(id, post);
    }
  }

  async getKeyword(id: number): Promise<Keyword | undefined> {
    return this.keywords.get(id);
  }

  async getKeywordByName(keyword: string): Promise<Keyword | undefined> {
    return Array.from(this.keywords.values()).find(k => k.keyword === keyword);
  }

  async getAllKeywords(): Promise<Keyword[]> {
    return Array.from(this.keywords.values());
  }

  async createKeyword(keyword: InsertKeyword): Promise<Keyword> {
    const id = this.nextId++;
    const newKeyword: Keyword = {
      ...keyword,
      id,
      difficulty: keyword.difficulty ?? null,
      searchVolume: keyword.searchVolume ?? null,
      lastCrawled: null
    };
    this.keywords.set(id, newKeyword);
    return newKeyword;
  }

  async updateKeyword(id: number, keyword: Partial<InsertKeyword>): Promise<Keyword | undefined> {
    const existing = this.keywords.get(id);
    if (existing) {
      const updated = { ...existing, ...keyword };
      this.keywords.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteKeyword(id: number): Promise<boolean> {
    return this.keywords.delete(id);
  }

  async getPostKeywords(postId: number): Promise<PostKeyword[]> {
    return Array.from(this.postKeywords.values()).filter(pk => pk.postId === postId);
  }

  async getKeywordPosts(keywordId: number): Promise<PostKeyword[]> {
    return Array.from(this.postKeywords.values()).filter(pk => pk.keywordId === keywordId);
  }

  async addPostKeyword(postKeyword: InsertPostKeyword): Promise<PostKeyword> {
    const id = this.nextId++;
    const newPK = { ...postKeyword, id };
    this.postKeywords.set(id, newPK);
    return newPK;
  }

  async removePostKeyword(postId: number, keywordId: number): Promise<boolean> {
    const pk = Array.from(this.postKeywords.values()).find(p => p.postId === postId && p.keywordId === keywordId);
    if (pk) return this.postKeywords.delete(pk.id);
    return false;
  }

  async getKeywordRankings(keywordId: number, limit: number = 30): Promise<KeywordRanking[]> {
    return Array.from(this.keywordRankings.values())
      .filter(r => r.keywordId === keywordId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async addKeywordRanking(ranking: InsertKeywordRanking): Promise<KeywordRanking> {
    const id = this.nextId++;
    const newRanking = { ...ranking, id, createdAt: new Date() };
    this.keywordRankings.set(id, newRanking);
    return newRanking;
  }

  async getBlogAnalytics(postId: number, startDate?: Date, endDate?: Date): Promise<BlogAnalytics[]> {
    return Array.from(this.blogAnalytics.values()).filter(a => a.postId === postId);
  }

  async updateBlogAnalytics(analytics: InsertBlogAnalytics): Promise<BlogAnalytics> {
    const id = this.nextId++;
    const newAnalytics = { ...analytics, id };
    this.blogAnalytics.set(id, newAnalytics);
    return newAnalytics;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const id = this.nextId++;
    const newReferral = { ...referral, id, convertedLeadId: referral.convertedLeadId ?? null, createdAt: new Date() };
    this.referrals.set(id, newReferral);
    return newReferral;
  }

  async getReferral(id: number): Promise<Referral | undefined> {
    return this.referrals.get(id);
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    return Array.from(this.referrals.values()).find(r => r.referralCode === code);
  }

  async getReferralsByCustomer(customerId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(r => r.referrerId === parseInt(customerId));
  }

  async updateReferralStatus(id: number, status: string, leadId?: string): Promise<Referral | undefined> {
    const referral = this.referrals.get(id);
    if (referral) {
      referral.status = status;
      if (leadId) referral.convertedLeadId = parseInt(leadId);
      this.referrals.set(id, referral);
      return referral;
    }
    return undefined;
  }

  async createCustomerCredit(credit: InsertCustomerCredit): Promise<CustomerCredit> {
    const id = this.nextId++;
    const newCredit = { ...credit, id, notes: credit.notes ?? null, createdAt: new Date() };
    this.customerCredits.set(id, newCredit);
    return newCredit;
  }

  async getCustomerCredits(customerId: string): Promise<CustomerCredit[]> {
    return Array.from(this.customerCredits.values()).filter(c => c.customerId === parseInt(customerId));
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values());
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.nextId++;
    const newTemplate = { ...template, id, createdAt: new Date(), updatedAt: new Date() };
    this.emailTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const existing = this.emailTemplates.get(id);
    if (existing) {
      const updated = { ...existing, ...template, updatedAt: new Date() };
      this.emailTemplates.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getUpsellOffers(): Promise<UpsellOffer[]> {
    return Array.from(this.upsellOffers.values()).filter(o => o.isActive);
  }

  async getSubscriptions(): Promise<MemberSubscription[]> {
    return Array.from(this.memberSubscriptions.values());
  }

  async getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetric[]> {
    return Array.from(this.revenueMetrics.values());
  }

  async createRevenueMetric(metric: InsertRevenueMetric): Promise<RevenueMetric> {
    const id = this.nextId++;
    const newMetric = { ...metric, id, createdAt: new Date() };
    this.revenueMetrics.set(id, newMetric);
    return newMetric;
  }

  async getLatestRevenueMetrics(): Promise<RevenueMetric[]> {
    return Array.from(this.revenueMetrics.values()).slice(-30);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.nextId++;
    const newLead = { 
      ...lead, 
      id, 
      email: lead.email ?? null,
      service: lead.service ?? null,
      address: lead.address ?? null,
      notes: lead.notes ?? null,
      status: lead.status ?? 'new',
      landingPage: lead.landingPage ?? null,
      campaignName: lead.campaignName ?? null,
      convertedCustomerId: lead.convertedCustomerId ?? null,
      createdAt: new Date() 
    };
    this.leads.set(id, newLead);
    return newLead;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeadsByLandingPage(landingPage: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(l => l.landingPage === landingPage);
  }

  async getLeadsByCampaign(campaignName: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(l => l.campaignName === campaignName);
  }

  async updateLeadStatus(id: number, status: string): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (lead) {
      lead.status = status;
      this.leads.set(id, lead);
      return lead;
    }
    return undefined;
  }

  // AI Voice Training methods
  private voiceCallRecordingsMap = new Map<number, VoiceCallRecording>();
  private voiceTranscriptsMap = new Map<number, VoiceTranscript>();
  private voiceDatasetsMap = new Map<number, VoiceDataset>();
  private voiceDatasetSectionsMap = new Map<number, VoiceDatasetSection>();
  private voiceTranscriptAssignmentsMap = new Map<number, VoiceTranscriptAssignment>();
  private voiceTrainingRunsMap = new Map<number, VoiceTrainingRun>();
  private voiceDatasetMixesMap = new Map<number, VoiceDatasetMix>();
  
  private nextVoiceRecordingId = 1;
  private nextVoiceTranscriptId = 1;
  private nextVoiceDatasetId = 1;
  private nextVoiceSectionId = 1;
  private nextVoiceAssignmentId = 1;
  private nextVoiceTrainingRunId = 1;
  private nextVoiceMixId = 1;

  async getVoiceCallRecording(id: number): Promise<VoiceCallRecording | undefined> {
    return this.voiceCallRecordingsMap.get(id);
  }

  async getVoiceCallBySid(sid: string): Promise<VoiceCallRecording | undefined> {
    return Array.from(this.voiceCallRecordingsMap.values()).find(r => r.twilioCallSid === sid);
  }

  async getVoiceCallRecordings(): Promise<VoiceCallRecording[]> {
    return Array.from(this.voiceCallRecordingsMap.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createVoiceCallRecording(recording: InsertVoiceCallRecording): Promise<VoiceCallRecording> {
    const id = this.nextVoiceRecordingId++;
    const newRecording: VoiceCallRecording = {
      ...recording,
      id,
      voiceFingerprint: recording.voiceFingerprint ?? null,
      recordingUrl: recording.recordingUrl ?? null,
      duration: recording.duration ?? null,
      status: recording.status ?? 'pending',
      grade: recording.grade ?? 'gray',
      confidence: recording.confidence ?? null,
      metadata: recording.metadata ?? {},
      createdAt: new Date(),
    };
    this.voiceCallRecordingsMap.set(id, newRecording);
    return newRecording;
  }

  async updateVoiceCallRecording(id: number, updates: Partial<VoiceCallRecording>): Promise<VoiceCallRecording | undefined> {
    const recording = this.voiceCallRecordingsMap.get(id);
    if (recording) {
      const updated = { ...recording, ...updates };
      this.voiceCallRecordingsMap.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getVoiceCallRecordingsByFingerprint(fingerprint: string): Promise<VoiceCallRecording[]> {
    return Array.from(this.voiceCallRecordingsMap.values())
      .filter(r => r.voiceFingerprint === fingerprint)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getVoiceTranscript(recordingId: number): Promise<VoiceTranscript | undefined> {
    return Array.from(this.voiceTranscriptsMap.values()).find(t => t.recordingId === recordingId);
  }

  async getVoiceTranscripts(): Promise<VoiceTranscript[]> {
    return Array.from(this.voiceTranscriptsMap.values());
  }

  async createVoiceTranscript(transcript: InsertVoiceTranscript): Promise<VoiceTranscript> {
    const id = this.nextVoiceTranscriptId++;
    const newTranscript: VoiceTranscript = {
      ...transcript,
      id,
      rawTranscript: transcript.rawTranscript ?? null,
      cleanedTranscript: transcript.cleanedTranscript ?? null,
      pass1Data: transcript.pass1Data ?? null,
      pass2Data: transcript.pass2Data ?? null,
      pass3Data: transcript.pass3Data ?? null,
      createdAt: new Date(),
    };
    this.voiceTranscriptsMap.set(id, newTranscript);
    return newTranscript;
  }

  async updateVoiceTranscript(id: number, updates: Partial<VoiceTranscript>): Promise<VoiceTranscript | undefined> {
    const transcript = this.voiceTranscriptsMap.get(id);
    if (transcript) {
      const updated = { ...transcript, ...updates };
      this.voiceTranscriptsMap.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getVoiceDataset(id: number): Promise<VoiceDataset | undefined> {
    return this.voiceDatasetsMap.get(id);
  }

  async getAllVoiceDatasets(): Promise<VoiceDataset[]> {
    return Array.from(this.voiceDatasetsMap.values());
  }

  async getVoiceDatasets(): Promise<VoiceDataset[]> {
    return this.getAllVoiceDatasets();
  }

  async createVoiceDataset(dataset: InsertVoiceDataset): Promise<VoiceDataset> {
    const id = this.nextVoiceDatasetId++;
    const newDataset: VoiceDataset = {
      ...dataset,
      id,
      description: dataset.description ?? null,
      targetCount: dataset.targetCount ?? 100,
      currentCount: dataset.currentCount ?? 0,
      status: dataset.status ?? 'active',
      createdAt: new Date(),
    };
    this.voiceDatasetsMap.set(id, newDataset);
    return newDataset;
  }

  async getVoiceDatasetSections(datasetId: number): Promise<VoiceDatasetSection[]> {
    return Array.from(this.voiceDatasetSectionsMap.values()).filter(s => s.datasetId === datasetId);
  }

  async createVoiceDatasetSection(section: InsertVoiceDatasetSection): Promise<VoiceDatasetSection> {
    const id = this.nextVoiceSectionId++;
    const newSection: VoiceDatasetSection = {
      ...section,
      id,
      description: section.description ?? null,
      lookingFor: section.lookingFor ?? null,
      targetCount: section.targetCount ?? 50,
      currentCount: section.currentCount ?? 0,
      createdAt: new Date(),
    };
    this.voiceDatasetSectionsMap.set(id, newSection);
    return newSection;
  }

  async createVoiceTranscriptAssignment(assignment: InsertVoiceTranscriptAssignment): Promise<VoiceTranscriptAssignment> {
    const id = this.nextVoiceAssignmentId++;
    const newAssignment: VoiceTranscriptAssignment = {
      ...assignment,
      id,
      status: assignment.status ?? 'pending',
      notes: assignment.notes ?? null,
      assignedAt: new Date(),
    };
    this.voiceTranscriptAssignmentsMap.set(id, newAssignment);
    return newAssignment;
  }

  async getTranscriptAssignments(transcriptId: number): Promise<VoiceTranscriptAssignment[]> {
    return Array.from(this.voiceTranscriptAssignmentsMap.values()).filter(a => a.transcriptId === transcriptId);
  }

  async createVoiceTrainingRun(run: InsertVoiceTrainingRun): Promise<VoiceTrainingRun> {
    const id = this.nextVoiceTrainingRunId++;
    const newRun: VoiceTrainingRun = {
      ...run,
      id,
      openaiJobId: run.openaiJobId ?? null,
      config: run.config ?? null,
      results: run.results ?? null,
      createdAt: new Date(),
      finishedAt: run.finishedAt ? new Date(run.finishedAt) : null,
    };
    this.voiceTrainingRunsMap.set(id, newRun);
    return newRun;
  }

  async getVoiceTrainingRun(id: number): Promise<VoiceTrainingRun | undefined> {
    return this.voiceTrainingRunsMap.get(id);
  }

  async createVoiceDatasetMix(mix: InsertVoiceDatasetMix): Promise<VoiceDatasetMix> {
    const id = this.nextVoiceMixId++;
    const newMix: VoiceDatasetMix = {
      ...mix,
      id,
      description: mix.description ?? null,
      status: mix.status ?? 'draft',
      createdAt: new Date(),
    };
    this.voiceDatasetMixesMap.set(id, newMix);
    return newMix;
  }

  async getVoiceDatasetMixes(): Promise<VoiceDatasetMix[]> {
    return Array.from(this.voiceDatasetMixesMap.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getVoiceDatasetMix(id: number): Promise<VoiceDatasetMix | undefined> {
    return this.voiceDatasetMixesMap.get(id);
  }

  // System Settings methods
  private settingsMap = new Map<string, any>();
  async getSystemSetting<T>(key: string): Promise<T | undefined> {
    return this.settingsMap.get(key) as T | undefined;
  }
  async setSystemSetting<T>(key: string, value: T): Promise<void> {
    this.settingsMap.set(key, value);
  }
}

import { dbStorage } from "./dbStorage";
export const storage = dbStorage;
