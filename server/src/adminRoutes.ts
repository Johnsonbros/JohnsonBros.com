import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { 
  adminUsers, adminSessions, adminTasks, adminDocuments,
  aiChatSessions, aiChatMessages, googleAdsCampaigns,
  websiteAnalytics, dashboardWidgets, adminActivityLogs,
  webhookEvents, webhookAnalytics, customers, blogPosts,
  InsertAdminTask, InsertAdminDocument, InsertAiChatMessage
} from '@shared/schema';
import { eq, desc, and, gte, lte, sql, or, like, inArray } from 'drizzle-orm';
import {
  hashPassword, verifyPassword, createSession, authenticate,
  requirePermission, logActivity, ensureSuperAdmin, initializePermissions
} from './auth';

const router = Router();

// Initialize authentication
(async () => {
  await initializePermissions();
  await ensureSuperAdmin();
})();

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// Register schema  
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'tech', 'staff'])
});

// ============================================
// PUBLIC AUTH ROUTES
// ============================================

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const [user] = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);
    
    if (!user || !await verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }
    
    const session = await createSession(user.id, req.ip, req.headers['user-agent']);
    
    await logActivity(user.id, 'login', undefined, undefined, undefined, req.ip);
    
    res.json({
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

// Logout
router.post('/auth/logout', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await db.delete(adminSessions)
        .where(eq(adminSessions.sessionToken, token));
    }
    
    await logActivity((req as any).user.id, 'logout', undefined, undefined, undefined, req.ip);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/auth/me', authenticate, async (req, res) => {
  const user = (req as any).user;
  const permissions = (req as any).permissions;
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    },
    permissions
  });
});

// ============================================
// USER MANAGEMENT (Super Admin only)
// ============================================

// Create user (Super Admin only)
router.post('/users', authenticate, requirePermission('users.create'), async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const hashedPassword = await hashPassword(data.password);
    
    const [user] = await db.insert(adminUsers).values({
      email: data.email,
      passwordHash: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isActive: true
    }).returning();
    
    await logActivity(
      (req as any).user.id,
      'create_user',
      'user',
      user.id.toString(),
      { email: data.email, role: data.role },
      req.ip
    );
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// List users
router.get('/users', authenticate, requirePermission('users.view'), async (req, res) => {
  try {
    const users = await db.select({
      id: adminUsers.id,
      email: adminUsers.email,
      firstName: adminUsers.firstName,
      lastName: adminUsers.lastName,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
      lastLoginAt: adminUsers.lastLoginAt,
      createdAt: adminUsers.createdAt
    })
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt));
    
    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// DASHBOARD ANALYTICS
// ============================================

// Get real-time HousecallPro metrics
router.get('/dashboard/housecall-metrics', authenticate, requirePermission('dashboard.view'), async (req, res) => {
  try {
    const { HousecallProClient } = await import('./housecall');
    const hcpClient = HousecallProClient.getInstance();
    
    // Get date range from query params or default to today
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Fetch real-time metrics from HousecallPro
    const [jobs, estimates, employees, bookingWindows] = await Promise.all([
      hcpClient.getJobs({
        scheduled_start_min: date.toISOString(),
        scheduled_start_max: nextDay.toISOString()
      }).catch(() => []),
      
      hcpClient.getEstimates({
        scheduled_start_min: date.toISOString(),
        scheduled_start_max: nextDay.toISOString()
      }).catch(() => []),
      
      hcpClient.getEmployees().catch(() => []),
      
      hcpClient.getBookingWindows(
        date.toISOString().split('T')[0]
      ).catch(() => [])
    ]);
    
    // Calculate metrics
    const jobsByStatus = {
      scheduled: jobs.filter(j => j.work_status === 'scheduled').length,
      in_progress: jobs.filter(j => j.work_status === 'in_progress').length,
      completed: jobs.filter(j => j.work_status === 'completed').length,
      cancelled: jobs.filter(j => j.work_status === 'cancelled').length
    };
    
    const revenue = jobs
      .filter(j => j.work_status === 'completed')
      .reduce((sum, job) => sum + (job.total_amount || 0), 0);
    
    const activeEmployees = employees.filter(e => e.is_active).length;
    const availableWindows = bookingWindows.filter(w => w.available).length;
    
    res.json({
      date: date.toISOString(),
      jobs: {
        total: jobs.length,
        byStatus: jobsByStatus,
        revenue
      },
      estimates: {
        total: estimates.length,
        value: estimates.reduce((sum, e) => sum + (e.total_amount || 0), 0)
      },
      employees: {
        total: employees.length,
        active: activeEmployees
      },
      availability: {
        totalWindows: bookingWindows.length,
        availableWindows,
        utilizationRate: bookingWindows.length ? 
          Math.round((1 - availableWindows / bookingWindows.length) * 100) : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('HousecallPro metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get dashboard stats
router.get('/dashboard/stats', authenticate, requirePermission('dashboard.view'), async (req, res) => {
  try {
    // Import HousecallProClient
    const { HousecallProClient } = await import('./housecall');
    const hcpClient = HousecallProClient.getInstance();
    
    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    // Fetch real-time data from HousecallPro API
    let todayJobs: any[] = [];
    let weekJobs: any[] = [];
    let monthJobs: any[] = [];
    let recentCustomers: any[] = [];
    
    try {
      // Fetch today's jobs from HousecallPro
      todayJobs = await hcpClient.getJobs({
        scheduled_start_min: today.toISOString().split('T')[0],
        scheduled_start_max: tomorrow.toISOString().split('T')[0]
      });
      
      // Fetch this week's jobs
      weekJobs = await hcpClient.getJobs({
        scheduled_start_min: weekAgo.toISOString().split('T')[0],
        scheduled_start_max: tomorrow.toISOString().split('T')[0]
      });
      
      // Fetch this month's jobs
      monthJobs = await hcpClient.getJobs({
        scheduled_start_min: monthAgo.toISOString().split('T')[0],
        scheduled_start_max: tomorrow.toISOString().split('T')[0]
      });
      
      // Fetch recent customers
      const customersResponse = await hcpClient.callAPI<{ customers: any[] }>('/customers', {
        page_size: 100,
        created_after: weekAgo.toISOString()
      });
      recentCustomers = customersResponse.customers || [];
      
    } catch (error) {
      console.error('Error fetching real-time HousecallPro data:', error);
    }
    
    // Calculate real-time stats from HousecallPro data
    const todayRevenue = todayJobs.reduce((sum, job) => sum + (job.total_amount || 0), 0);
    const todayJobsCompleted = todayJobs.filter(job => job.work_status === 'completed').length;
    const todayJobsInProgress = todayJobs.filter(job => job.work_status === 'in_progress').length;
    const todayJobsScheduled = todayJobs.filter(job => job.work_status === 'scheduled').length;
    
    const weekRevenue = weekJobs.reduce((sum, job) => sum + (job.total_amount || 0), 0);
    const weekJobsCompleted = weekJobs.length;
    const weekNewCustomers = recentCustomers.length;
    
    const monthRevenue = monthJobs.reduce((sum, job) => sum + (job.total_amount || 0), 0);
    const monthJobsCompleted = monthJobs.length;
    
    // Get webhook analytics for today (as fallback/additional data)
    const [todayAnalytics] = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(${webhookAnalytics.totalRevenue}), 0)`,
      jobsCompleted: sql<number>`COALESCE(SUM(${webhookAnalytics.jobsCompleted}), 0)`,
      newCustomers: sql<number>`COALESCE(SUM(${webhookAnalytics.newCustomers}), 0)`,
      estimatesSent: sql<number>`COALESCE(SUM(${webhookAnalytics.estimatesSent}), 0)`
    })
    .from(webhookAnalytics)
    .where(eq(webhookAnalytics.date, today));
    
    // Get week analytics
    const [weekAnalytics] = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(${webhookAnalytics.totalRevenue}), 0)`,
      jobsCompleted: sql<number>`COALESCE(SUM(${webhookAnalytics.jobsCompleted}), 0)`,
      newCustomers: sql<number>`COALESCE(SUM(${webhookAnalytics.newCustomers}), 0)`
    })
    .from(webhookAnalytics)
    .where(gte(webhookAnalytics.date, weekAgo));
    
    // Get pending tasks count
    const [taskStats] = await db.select({
      pendingTasks: sql<number>`COUNT(*)::int`
    })
    .from(adminTasks)
    .where(
      and(
        eq(adminTasks.status, 'pending'),
        eq(adminTasks.assignedTo, (req as any).user.id)
      )
    );
    
    // Get recent webhook events count
    const [eventStats] = await db.select({
      totalEvents: sql<number>`COUNT(*)::int`,
      failedEvents: sql<number>`COUNT(*) FILTER (WHERE ${webhookEvents.status} = 'failed')::int`
    })
    .from(webhookEvents)
    .where(gte(webhookEvents.receivedAt, today));
    
    // Get active customers count
    const [customerStats] = await db.select({
      totalCustomers: sql<number>`COUNT(DISTINCT ${customers.id})::int`
    })
    .from(customers);
    
    // Get blog stats
    const [blogStats] = await db.select({
      totalPosts: sql<number>`COUNT(*)::int`,
      publishedPosts: sql<number>`COUNT(*) FILTER (WHERE ${blogPosts.status} = 'published')::int`
    })
    .from(blogPosts);
    
    // Get total customers from database (all time)
    const allCustomersResponse = await hcpClient.callAPI<{ customers: any[], total_items: number }>('/customers', {
      page_size: 1,
      page: 1
    }).catch(() => ({ customers: [], total_items: customerStats?.totalCustomers || 0 }));
    
    res.json({
      today: {
        // Use real-time data from HousecallPro API, fallback to webhook analytics
        revenue: todayRevenue || todayAnalytics?.totalRevenue || 0,
        jobsCompleted: todayJobsCompleted || todayAnalytics?.jobsCompleted || 0,
        jobsInProgress: todayJobsInProgress || 0,
        jobsScheduled: todayJobsScheduled || 0,
        newCustomers: recentCustomers.filter(c => {
          const createdAt = new Date(c.created_at);
          return createdAt >= today && createdAt < tomorrow;
        }).length || todayAnalytics?.newCustomers || 0,
        estimatesSent: todayAnalytics?.estimatesSent || 0
      },
      week: {
        revenue: weekRevenue || weekAnalytics?.totalRevenue || 0,
        jobsCompleted: weekJobsCompleted || weekAnalytics?.jobsCompleted || 0,
        newCustomers: weekNewCustomers || weekAnalytics?.newCustomers || 0
      },
      month: {
        revenue: monthRevenue || 0,
        jobsCompleted: monthJobsCompleted || 0
      },
      tasks: {
        pending: taskStats?.pendingTasks || 0
      },
      events: {
        total: eventStats?.totalEvents || 0,
        failed: eventStats?.failedEvents || 0
      },
      customers: {
        total: allCustomersResponse.total_items || customerStats?.totalCustomers || 0,
        recentCount: recentCustomers.length
      },
      blog: {
        total: blogStats?.totalPosts || 0,
        published: blogStats?.publishedPosts || 0
      },
      realTimeData: {
        lastUpdated: new Date().toISOString(),
        source: 'housecall_pro_api'
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard widgets
router.get('/dashboard/widgets', authenticate, async (req, res) => {
  try {
    const widgets = await db.select()
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.userId, (req as any).user.id))
      .orderBy(dashboardWidgets.position);
    
    res.json(widgets);
  } catch (error) {
    console.error('Get widgets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// TASK MANAGEMENT
// ============================================

// Get tasks
router.get('/tasks', authenticate, requirePermission('tasks.view'), async (req, res) => {
  try {
    const { status, assignedTo } = req.query;
    
    let query = db.select()
      .from(adminTasks)
      .orderBy(desc(adminTasks.createdAt));
    
    const conditions = [];
    if (status) {
      conditions.push(eq(adminTasks.status, status as string));
    }
    if (assignedTo) {
      conditions.push(eq(adminTasks.assignedTo, parseInt(assignedTo as string)));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const tasks = await query;
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task
router.post('/tasks', authenticate, requirePermission('tasks.create'), async (req, res) => {
  try {
    const data: InsertAdminTask = req.body;
    
    const [task] = await db.insert(adminTasks).values({
      ...data,
      createdBy: (req as any).user.id
    }).returning();
    
    await logActivity(
      (req as any).user.id,
      'create_task',
      'task',
      task.id.toString(),
      { title: data.title },
      req.ip
    );
    
    res.json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(400).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/tasks/:id', authenticate, requirePermission('tasks.edit'), async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const updates = req.body;
    
    if (updates.status === 'completed') {
      updates.completedAt = new Date();
    }
    
    const [task] = await db.update(adminTasks)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(adminTasks.id, taskId))
      .returning();
    
    await logActivity(
      (req as any).user.id,
      'update_task',
      'task',
      taskId.toString(),
      updates,
      req.ip
    );
    
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(400).json({ error: 'Failed to update task' });
  }
});

// ============================================
// AI CHAT
// ============================================

// Get chat sessions
router.get('/ai/sessions', authenticate, requirePermission('ai.chat'), async (req, res) => {
  try {
    const sessions = await db.select()
      .from(aiChatSessions)
      .where(eq(aiChatSessions.userId, (req as any).user.id))
      .orderBy(desc(aiChatSessions.updatedAt));
    
    res.json(sessions);
  } catch (error) {
    console.error('Get AI sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create chat session
router.post('/ai/sessions', authenticate, requirePermission('ai.chat'), async (req, res) => {
  try {
    const { title, context } = req.body;
    
    const [session] = await db.insert(aiChatSessions).values({
      userId: (req as any).user.id,
      title,
      context
    }).returning();
    
    res.json(session);
  } catch (error) {
    console.error('Create AI session error:', error);
    res.status(400).json({ error: 'Failed to create session' });
  }
});

// Get chat messages
router.get('/ai/sessions/:sessionId/messages', authenticate, requirePermission('ai.chat'), async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    // Verify session belongs to user
    const [session] = await db.select()
      .from(aiChatSessions)
      .where(
        and(
          eq(aiChatSessions.id, sessionId),
          eq(aiChatSessions.userId, (req as any).user.id)
        )
      )
      .limit(1);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const messages = await db.select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionId))
      .orderBy(aiChatMessages.createdAt);
    
    res.json(messages);
  } catch (error) {
    console.error('Get AI messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// DOCUMENTS
// ============================================

// Get documents
router.get('/documents', authenticate, async (req, res) => {
  try {
    const { type, isTemplate } = req.query;
    
    let query = db.select()
      .from(adminDocuments)
      .orderBy(desc(adminDocuments.createdAt));
    
    const conditions = [];
    if (type) {
      conditions.push(eq(adminDocuments.type, type as string));
    }
    if (isTemplate !== undefined) {
      conditions.push(eq(adminDocuments.isTemplate, isTemplate === 'true'));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const documents = await query;
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create document
router.post('/documents', authenticate, requirePermission('ai.generate_documents'), async (req, res) => {
  try {
    const data: InsertAdminDocument = req.body;
    
    const [document] = await db.insert(adminDocuments).values({
      ...data,
      createdBy: (req as any).user.id
    }).returning();
    
    await logActivity(
      (req as any).user.id,
      'create_document',
      'document',
      document.id.toString(),
      { title: data.title, type: data.type },
      req.ip
    );
    
    res.json(document);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(400).json({ error: 'Failed to create document' });
  }
});

// ============================================
// ACTIVITY LOGS
// ============================================

// Get activity logs
router.get('/activity-logs', authenticate, requirePermission('settings.view'), async (req, res) => {
  try {
    const { userId, action, limit = 100 } = req.query;
    
    let query = db.select()
      .from(adminActivityLogs)
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(parseInt(limit as string));
    
    const conditions = [];
    if (userId) {
      conditions.push(eq(adminActivityLogs.userId, parseInt(userId as string)));
    }
    if (action) {
      conditions.push(eq(adminActivityLogs.action, action as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const logs = await query;
    res.json(logs);
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;