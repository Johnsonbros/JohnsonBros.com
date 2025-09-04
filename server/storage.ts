import { 
  type Customer, type InsertCustomer, 
  type Appointment, type InsertAppointment,
  type BlogPost, type InsertBlogPost,
  type Keyword, type InsertKeyword,
  type PostKeyword, type InsertPostKeyword,
  type KeywordRanking, type InsertKeywordRanking,
  type BlogAnalytics, type InsertBlogAnalytics,
  type AvailableTimeSlot
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
}

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;
  private appointments: Map<string, Appointment>;
  private blogPosts: Map<number, BlogPost>;
  private keywords: Map<number, Keyword>;
  private postKeywords: Map<number, PostKeyword>;
  private keywordRankings: Map<number, KeywordRanking>;
  private blogAnalytics: Map<number, BlogAnalytics>;
  private timeSlots: Map<string, AvailableTimeSlot>;
  private nextBlogId: number;
  private nextKeywordId: number;
  private nextPostKeywordId: number;
  private nextRankingId: number;
  private nextAnalyticsId: number;

  constructor() {
    this.customers = new Map();
    this.appointments = new Map();
    this.blogPosts = new Map();
    this.keywords = new Map();
    this.postKeywords = new Map();
    this.keywordRankings = new Map();
    this.blogAnalytics = new Map();
    this.timeSlots = new Map();
    this.nextBlogId = 1;
    this.nextKeywordId = 1;
    this.nextPostKeywordId = 1;
    this.nextRankingId = 1;
    this.nextAnalyticsId = 1;
  }

  private initializeDefaultData() {
    // Default services - commented out since we're using Housecall Pro services
    /*
    const defaultServices = [
      {
        id: "emergency-repair",
        name: "Emergency Repair",
        description: "24/7 emergency plumbing services for burst pipes, major leaks, and urgent repairs that can't wait.",
        basePrice: "150.00",
        category: "emergency",
        duration: "2-4 hours",
        housecallProServiceId: null,
        isEmergency: true,
      },
      {
        id: "drain-cleaning",
        name: "Drain Cleaning",
        description: "Professional drain cleaning services to clear clogs and restore proper water flow throughout your home.",
        basePrice: "99.00",
        category: "maintenance",
        duration: "1-2 hours",
        housecallProServiceId: null,
        isEmergency: false,
      },
      {
        id: "water-heater",
        name: "Water Heater Service",
        description: "Installation, repair, and maintenance of traditional and tankless water heaters for reliable hot water.",
        basePrice: "200.00",
        category: "installation",
        duration: "2-4 hours",
        housecallProServiceId: null,
        isEmergency: false,
      },
      {
        id: "fixtures",
        name: "Fixture Installation",
        description: "Professional installation of faucets, toilets, sinks, and other plumbing fixtures for your home.",
        basePrice: "120.00",
        category: "installation",
        duration: "1-3 hours",
        housecallProServiceId: null,
        isEmergency: false,
      },
      {
        id: "pipe-repair",
        name: "Pipe Repair",
        description: "Expert pipe repair and replacement services to fix leaks and restore your plumbing system.",
        basePrice: "180.00",
        category: "repair",
        duration: "2-6 hours",
        housecallProServiceId: null,
        isEmergency: false,
      },
      {
        id: "remodeling",
        name: "Bathroom Remodeling",
        description: "Complete bathroom renovation services including plumbing upgrades and modern fixture installation.",
        basePrice: "2500.00",
        category: "renovation",
        duration: "1-3 days",
        housecallProServiceId: null,
        isEmergency: false,
      },
    ];

    // Services now come from Housecall Pro API
    */

    // DISABLED: Don't generate fake time slots - use real Housecall Pro API data
    // The system should only show real availability from the API
    // Commenting out fake data generation to prevent showing incorrect availability
    /*
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const timeSlots = [
        { startTime: "09:00", endTime: "11:00" },
        { startTime: "11:00", endTime: "13:00" },
        { startTime: "13:00", endTime: "15:00" },
        { startTime: "15:00", endTime: "17:00" },
      ];

      timeSlots.forEach((slot, index) => {
        const id = randomUUID();
        this.timeSlots.set(id, {
          id,
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: true,
          technicianId: null,
        });
      });
    }
    */

    // Reviews now come from Google Reviews API - no local storage needed
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.email === email,
    );
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    // Normalize phone number for comparison (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');
    return Array.from(this.customers.values()).find(
      (customer) => customer.phone && customer.phone.replace(/\D/g, '') === normalizedPhone,
    );
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = parseInt(randomUUID().replace(/-/g, '').substring(0, 8), 16);
    const customer: Customer = {
      ...insertCustomer,
      id,
      phone: insertCustomer.phone || null,
      housecallProId: null,
      createdAt: new Date(),
    };
    this.customers.set(String(id), customer);
    return customer;
  }

  // Services now come from Housecall Pro API - no local storage needed

  // Appointment methods
  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.customerId === parseInt(customerId),
    );
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = parseInt(randomUUID().replace(/-/g, '').substring(0, 8), 16);
    const newAppointment: Appointment = {
      ...appointment,
      id,
      status: appointment.status ?? "scheduled",
      customerId: appointment.customerId || null,
      address: appointment.address || null,
      notes: appointment.notes || null,
      createdAt: new Date(),
    };
    this.appointments.set(String(id), newAppointment);
    return newAppointment;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (appointment) {
      appointment.status = status;
      this.appointments.set(id, appointment);
    }
    return appointment;
  }

  // Time slots methods
  async getAvailableTimeSlots(date: string): Promise<AvailableTimeSlot[]> {
    return Array.from(this.timeSlots.values()).filter(
      (slot) => slot.date === date && slot.isAvailable,
    );
  }

  // Reviews now come from Google Reviews API - no local storage needed

  // Blog methods
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(
      (post) => post.slug === slug
    );
  }

  async getAllBlogPosts(status?: string, limit?: number, offset?: number): Promise<BlogPost[]> {
    let posts = Array.from(this.blogPosts.values());
    
    if (status) {
      posts = posts.filter(post => post.status === status);
    }
    
    // Sort by publish date (newest first)
    posts.sort((a, b) => {
      const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
      const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
      return dateB - dateA;
    });
    
    if (offset !== undefined && limit !== undefined) {
      posts = posts.slice(offset, offset + limit);
    }
    
    return posts;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.nextBlogId++;
    const now = new Date();
    const newPost: BlogPost = {
      id,
      slug: post.slug || '',
      title: post.title || '',
      excerpt: post.excerpt ?? null,
      content: post.content,
      featuredImage: post.featuredImage ?? null,
      metaTitle: post.metaTitle ?? null,
      metaDescription: post.metaDescription ?? null,
      author: post.author,
      status: post.status,
      publishDate: post.publishDate ? new Date(post.publishDate) : null,
      viewCount: 0,
      readingTime: post.readingTime ?? null,
      category: post.category ?? null,
      tags: post.tags ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.blogPosts.set(id, newPost);
    return newPost;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existingPost = this.blogPosts.get(id);
    if (existingPost) {
      const updatedPost: BlogPost = {
        ...existingPost,
        ...(post.slug !== undefined && { slug: post.slug }),
        ...(post.title !== undefined && { title: post.title }),
        ...(post.excerpt !== undefined && { excerpt: post.excerpt ?? null }),
        ...(post.content !== undefined && { content: post.content }),
        ...(post.featuredImage !== undefined && { featuredImage: post.featuredImage ?? null }),
        ...(post.metaTitle !== undefined && { metaTitle: post.metaTitle ?? null }),
        ...(post.metaDescription !== undefined && { metaDescription: post.metaDescription ?? null }),
        ...(post.author !== undefined && { author: post.author }),
        ...(post.status !== undefined && { status: post.status }),
        ...(post.publishDate !== undefined && { publishDate: post.publishDate ? new Date(post.publishDate) : null }),
        ...(post.readingTime !== undefined && { readingTime: post.readingTime ?? null }),
        ...(post.category !== undefined && { category: post.category ?? null }),
        ...(post.tags !== undefined && { tags: post.tags ?? null }),
        updatedAt: new Date(),
      };
      this.blogPosts.set(id, updatedPost);
      return updatedPost;
    }
    return undefined;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  async incrementPostViews(id: number): Promise<void> {
    const post = this.blogPosts.get(id);
    if (post) {
      post.viewCount++;
      this.blogPosts.set(id, post);
    }
  }

  // Keyword methods
  async getKeyword(id: number): Promise<Keyword | undefined> {
    return this.keywords.get(id);
  }

  async getKeywordByName(keyword: string): Promise<Keyword | undefined> {
    return Array.from(this.keywords.values()).find(
      (k) => k.keyword === keyword
    );
  }

  async getAllKeywords(): Promise<Keyword[]> {
    return Array.from(this.keywords.values());
  }

  async createKeyword(keyword: InsertKeyword): Promise<Keyword> {
    const id = this.nextKeywordId++;
    const newKeyword: Keyword = {
      id,
      keyword: keyword.keyword,
      searchVolume: keyword.searchVolume ?? null,
      difficulty: keyword.difficulty ?? null,
      competition: keyword.competition ?? null,
      searchIntent: keyword.searchIntent ?? null,
      location: keyword.location ?? null,
      isPrimary: keyword.isPrimary ?? null,
      lastTracked: null,
      createdAt: new Date(),
    };
    this.keywords.set(id, newKeyword);
    return newKeyword;
  }

  async updateKeyword(id: number, keyword: Partial<InsertKeyword>): Promise<Keyword | undefined> {
    const existingKeyword = this.keywords.get(id);
    if (existingKeyword) {
      const updatedKeyword = {
        ...existingKeyword,
        ...keyword,
      };
      this.keywords.set(id, updatedKeyword);
      return updatedKeyword;
    }
    return undefined;
  }

  async deleteKeyword(id: number): Promise<boolean> {
    return this.keywords.delete(id);
  }

  // Post-Keyword relationship methods
  async getPostKeywords(postId: number): Promise<PostKeyword[]> {
    return Array.from(this.postKeywords.values()).filter(
      (pk) => pk.postId === postId
    );
  }

  async getKeywordPosts(keywordId: number): Promise<PostKeyword[]> {
    return Array.from(this.postKeywords.values()).filter(
      (pk) => pk.keywordId === keywordId
    );
  }

  async addPostKeyword(postKeyword: InsertPostKeyword): Promise<PostKeyword> {
    const id = this.nextPostKeywordId++;
    const newPostKeyword: PostKeyword = {
      id,
      postId: postKeyword.postId,
      keywordId: postKeyword.keywordId,
      isPrimary: postKeyword.isPrimary ?? null,
      keywordDensity: postKeyword.keywordDensity ?? null,
      createdAt: new Date(),
    };
    this.postKeywords.set(id, newPostKeyword);
    return newPostKeyword;
  }

  async removePostKeyword(postId: number, keywordId: number): Promise<boolean> {
    const toRemove = Array.from(this.postKeywords.entries()).find(
      ([_, pk]) => pk.postId === postId && pk.keywordId === keywordId
    );
    if (toRemove) {
      return this.postKeywords.delete(toRemove[0]);
    }
    return false;
  }

  // Keyword ranking methods
  async getKeywordRankings(keywordId: number, limit?: number): Promise<KeywordRanking[]> {
    let rankings = Array.from(this.keywordRankings.values()).filter(
      (r) => r.keywordId === keywordId
    );
    
    // Sort by tracked date (newest first)
    rankings.sort((a, b) => {
      const dateA = new Date(a.trackedDate).getTime();
      const dateB = new Date(b.trackedDate).getTime();
      return dateB - dateA;
    });
    
    if (limit) {
      rankings = rankings.slice(0, limit);
    }
    
    return rankings;
  }

  async addKeywordRanking(ranking: InsertKeywordRanking): Promise<KeywordRanking> {
    const id = this.nextRankingId++;
    const newRanking: KeywordRanking = {
      id,
      keywordId: ranking.keywordId,
      position: ranking.position ?? null,
      previousPosition: ranking.previousPosition ?? null,
      url: ranking.url ?? null,
      searchEngine: ranking.searchEngine ?? null,
      location: ranking.location ?? null,
      impressions: ranking.impressions ?? null,
      clicks: ranking.clicks ?? null,
      ctr: ranking.ctr ?? null,
      trackedDate: new Date(),
    };
    this.keywordRankings.set(id, newRanking);
    return newRanking;
  }

  // Analytics methods
  async getBlogAnalytics(postId: number, startDate?: Date, endDate?: Date): Promise<BlogAnalytics[]> {
    let analytics = Array.from(this.blogAnalytics.values()).filter(
      (a) => a.postId === postId
    );
    
    if (startDate) {
      analytics = analytics.filter(a => new Date(a.date) >= startDate);
    }
    
    if (endDate) {
      analytics = analytics.filter(a => new Date(a.date) <= endDate);
    }
    
    return analytics;
  }

  async updateBlogAnalytics(analytics: InsertBlogAnalytics): Promise<BlogAnalytics> {
    // Find existing analytics for this post and date
    const existing = Array.from(this.blogAnalytics.entries()).find(
      ([_, a]) => a.postId === analytics.postId && 
                  new Date(a.date).toDateString() === new Date(analytics.date).toDateString()
    );
    
    if (existing) {
      const updatedAnalytics = {
        ...existing[1],
        ...analytics,
      };
      this.blogAnalytics.set(existing[0], updatedAnalytics);
      return updatedAnalytics;
    } else {
      const id = this.nextAnalyticsId++;
      const newAnalytics: BlogAnalytics = {
        id,
        postId: analytics.postId,
        date: analytics.date,
        pageViews: analytics.pageViews ?? null,
        uniqueVisitors: analytics.uniqueVisitors ?? null,
        avgTimeOnPage: analytics.avgTimeOnPage ?? null,
        bounceRate: analytics.bounceRate ?? null,
        conversionRate: analytics.conversionRate ?? null,
        createdAt: new Date(),
      };
      this.blogAnalytics.set(id, newAnalytics);
      return newAnalytics;
    }
  }
}

export const storage = new MemStorage();
