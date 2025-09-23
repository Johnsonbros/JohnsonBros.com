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
  customers, appointments, blogPosts, keywords, postKeywords, keywordRankings, blogAnalytics,
  referrals, customerCredits
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
    // Note: For phone lookup, we'd need to implement a better search in the database
    // For now, this is a simplified version
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
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
}

export const dbStorage = new DatabaseStorage();