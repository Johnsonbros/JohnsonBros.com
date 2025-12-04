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
import { eq, desc, and, gte, lte, sql, or, like, inArray, isNull, ne } from 'drizzle-orm';
import {
  hashPassword, verifyPassword, createSession, authenticate,
  requirePermission, logActivity, ensureSuperAdmin, initializePermissions,
  isAccountLocked, recordFailedLogin, resetFailedLogins,
  revokeSession, revokeUserSessions, revokeAllSessions, rotateSession, shouldRotateSession
} from './auth';

const router = Router();

// Initialize authentication (with error handling to prevent startup crashes)
(async () => {
  try {
    await initializePermissions();
    await ensureSuperAdmin();
    console.log('[Admin] Authentication initialized successfully');
  } catch (error) {
    console.error('[Admin] Failed to initialize authentication:', error);
    console.warn('[Admin] App will continue running, but admin features may not work until database is available');
    // Don't crash the app - let it continue running so the database can auto-wake
  }
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
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if account is locked
    if (await isAccountLocked(user.id)) {
      return res.status(423).json({ 
        error: 'Account is locked due to too many failed login attempts. Please try again in 30 minutes.' 
      });
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Record failed login attempt
      await recordFailedLogin(user.id);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }
    
    // Reset failed login attempts on successful login
    await resetFailedLogins(user.id);
    
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
      // Find session and revoke it instead of deleting
      const [session] = await db.select()
        .from(adminSessions)
        .where(eq(adminSessions.sessionToken, token))
        .limit(1);
      
      if (session) {
        await revokeSession(session.id, 'User logout');
      }
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
// SESSION MANAGEMENT
// ============================================

// Get all active sessions for current user
router.get('/auth/sessions', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const sessions = await db.select({
      id: adminSessions.id,
      ipAddress: adminSessions.ipAddress,
      userAgent: adminSessions.userAgent,
      createdAt: adminSessions.createdAt,
      lastActivityAt: adminSessions.lastActivityAt,
      expiresAt: adminSessions.expiresAt,
      isCurrent: sql<boolean>`${adminSessions.sessionToken} = ${req.headers.authorization?.replace('Bearer ', '')}`
    })
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.userId, userId),
        isNull(adminSessions.revokedAt)
      )
    )
    .orderBy(desc(adminSessions.lastActivityAt));
    
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Revoke a specific session
router.delete('/auth/sessions/:sessionId', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const sessionId = parseInt(req.params.sessionId);
    
    // Verify session belongs to user
    const [session] = await db.select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.id, sessionId),
          eq(adminSessions.userId, userId)
        )
      )
      .limit(1);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    await revokeSession(sessionId, 'User revoked session');
    
    await logActivity(userId, 'revoke_session', 'session', sessionId.toString(), undefined, req.ip);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

// Revoke all sessions except current
router.post('/auth/sessions/revoke-others', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    
    // Revoke all sessions except the current one
    await db.update(adminSessions)
      .set({
        revokedAt: new Date(),
        revokedReason: 'User revoked all other sessions'
      })
      .where(
        and(
          eq(adminSessions.userId, userId),
          ne(adminSessions.sessionToken, currentToken),
          isNull(adminSessions.revokedAt)
        )
      );
    
    await logActivity(userId, 'revoke_all_sessions', undefined, undefined, undefined, req.ip);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

// Admin: Get all sessions (Super Admin only)
router.get('/sessions', authenticate, requirePermission('settings.edit'), async (req, res) => {
  try {
    const sessions = await db.select({
      id: adminSessions.id,
      userId: adminSessions.userId,
      userEmail: adminUsers.email,
      userName: sql<string>`${adminUsers.firstName} || ' ' || ${adminUsers.lastName}`,
      ipAddress: adminSessions.ipAddress,
      userAgent: adminSessions.userAgent,
      createdAt: adminSessions.createdAt,
      lastActivityAt: adminSessions.lastActivityAt,
      expiresAt: adminSessions.expiresAt,
      revokedAt: adminSessions.revokedAt
    })
    .from(adminSessions)
    .leftJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .orderBy(desc(adminSessions.lastActivityAt))
    .limit(100);
    
    res.json(sessions);
  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Admin: Revoke any session (Super Admin only)
router.delete('/sessions/:sessionId', authenticate, requirePermission('settings.edit'), async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    await revokeSession(sessionId, `Revoked by admin: ${(req as any).user.email}`);
    
    await logActivity(
      (req as any).user.id,
      'admin_revoke_session',
      'session',
      sessionId.toString(),
      undefined,
      req.ip
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Admin revoke session error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
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

// Get real-time operations overview
router.get('/dashboard/operations', authenticate, requirePermission('dashboard.view'), async (req, res) => {
  try {
    const { HousecallProClient } = await import('./housecall');
    const { CapacityCalculator } = await import('./capacity');
    const hcpClient = HousecallProClient.getInstance();
    const capacityCalc = CapacityCalculator.getInstance();
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Fetch all data in parallel
    const [jobs, estimates, employees, capacity, bookingWindows] = await Promise.all([
      hcpClient.getJobs({
        scheduled_start_min: today.toISOString(),
        scheduled_start_max: tomorrow.toISOString()
      }).catch(() => []),
      
      hcpClient.getEstimates({
        scheduled_start_min: today.toISOString(),
        scheduled_start_max: tomorrow.toISOString()
      }).catch(() => []),
      
      hcpClient.getEmployees().catch(() => []),
      
      capacityCalc.calculateCapacity(),
      
      hcpClient.getBookingWindows(
        today.toISOString().split('T')[0]
      ).catch(() => [])
    ]);
    
    // Process jobs by time slot and status
    const jobsByTimeSlot = {
      morning: jobs.filter((j: any) => {
        const hour = new Date(j.scheduled_start).getHours();
        return hour >= 8 && hour < 12;
      }),
      afternoon: jobs.filter((j: any) => {
        const hour = new Date(j.scheduled_start).getHours();
        return hour >= 12 && hour < 17;
      }),
      evening: jobs.filter((j: any) => {
        const hour = new Date(j.scheduled_start).getHours();
        return hour >= 17;
      })
    };
    
    // Calculate revenue metrics
    const completedRevenue = jobs
      .filter((j: any) => j.work_status === 'completed')
      .reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0);
    
    const scheduledRevenue = jobs
      .filter((j: any) => j.work_status === 'scheduled' || j.work_status === 'in_progress')
      .reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0);
    
    const dailyGoal = 5000; // Configure based on business targets
    const revenueProgress = Math.min(100, Math.round((completedRevenue / dailyGoal) * 100));
    
    // Identify emergency or high-priority jobs
    const emergencyJobs = jobs.filter((j: any) => 
      j.tags?.includes('emergency') || 
      j.tags?.includes('urgent') ||
      j.description?.toLowerCase().includes('emergency') ||
      j.description?.toLowerCase().includes('urgent')
    );
    
    // Tech status with current assignments
    const techStatus = employees
      .filter((e: any) => e.is_active && e.role === 'technician')
      .map((tech: any) => {
        const techJobs = jobs.filter((j: any) => 
          j.assigned_employees?.some((e: any) => e.id === tech.id)
        );
        
        const currentJob = techJobs.find((j: any) => j.work_status === 'in_progress');
        const upcomingJobs = techJobs.filter((j: any) => j.work_status === 'scheduled');
        
        return {
          id: tech.id,
          name: `${tech.first_name} ${tech.last_name}`,
          status: currentJob ? 'busy' : upcomingJobs.length > 0 ? 'scheduled' : 'available',
          currentJob: currentJob ? {
            id: currentJob.id,
            customer: (currentJob as any).customer?.name || 'Unknown',
            address: (currentJob as any).address?.street || 'No address',
            scheduledTime: currentJob.scheduled_start
          } : null,
          jobCount: techJobs.length,
          completedToday: techJobs.filter((j: any) => j.work_status === 'completed').length
        };
      });
    
    res.json({
      timestamp: new Date().toISOString(),
      
      // Capacity overview
      capacity: {
        state: capacity.overall.state,
        score: capacity.overall.score,
        availableWindows: bookingWindows.filter((w: any) => w.available).length,
        totalWindows: bookingWindows.length,
        utilizationRate: bookingWindows.length ? 
          Math.round((1 - bookingWindows.filter((w: any) => w.available).length / bookingWindows.length) * 100) : 0
      },
      
      // Jobs overview
      jobs: {
        total: jobs.length,
        byStatus: {
          scheduled: jobs.filter((j: any) => j.work_status === 'scheduled').length,
          inProgress: jobs.filter((j: any) => j.work_status === 'in_progress').length,
          completed: jobs.filter((j: any) => j.work_status === 'completed').length,
          cancelled: jobs.filter((j: any) => j.work_status === 'cancelled').length
        },
        byTimeSlot: {
          morning: jobsByTimeSlot.morning.length,
          afternoon: jobsByTimeSlot.afternoon.length,
          evening: jobsByTimeSlot.evening.length
        },
        emergencyCount: emergencyJobs.length
      },
      
      // Revenue tracking
      revenue: {
        completed: completedRevenue,
        scheduled: scheduledRevenue,
        total: completedRevenue + scheduledRevenue,
        goal: dailyGoal,
        progress: revenueProgress
      },
      
      // Technician status
      technicians: techStatus,
      
      // Alerts
      alerts: [
        ...emergencyJobs.map((job: any) => ({
          type: 'emergency',
          message: `Emergency job for ${job.customer?.name}`,
          jobId: job.id,
          timestamp: job.created_at
        })),
        ...((capacity.overall.state as string) === 'BOOKED_SOLID' ? [{
          type: 'capacity',
          message: 'Fully booked - no available slots today',
          timestamp: new Date().toISOString()
        }] : [])
      ]
    });
  } catch (error) {
    console.error('Operations dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch operations data' });
  }
});

// Get today's job board with detailed info
router.get('/dashboard/job-board', authenticate, requirePermission('dashboard.view'), async (req, res) => {
  try {
    const { HousecallProClient } = await import('./housecall');
    const hcpClient = HousecallProClient.getInstance();
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Fetch jobs with details
    const jobs = await hcpClient.getJobs({
      scheduled_start_min: today.toISOString(),
      scheduled_start_max: tomorrow.toISOString()
    }).catch(() => []);
    
    // Format jobs for the board
    const jobBoard = jobs.map((job: any) => ({
      id: job.id,
      customer: {
        name: job.customer?.name || 'Unknown',
        phone: job.customer?.mobile_number || job.customer?.home_number,
        email: job.customer?.email
      },
      address: {
        street: job.address?.street,
        city: job.address?.city,
        zip: job.address?.zip
      },
      service: {
        type: job.line_items?.[0]?.name || 'Service',
        description: job.description,
        tags: job.tags || []
      },
      schedule: {
        start: job.scheduled_start,
        end: job.scheduled_end,
        duration: job.scheduled_duration_minutes || 60
      },
      technician: job.assigned_employees?.map((e: any) => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`
      })) || [],
      status: job.work_status,
      amount: job.total_amount || 0,
      isPriority: job.tags?.includes('emergency') || job.tags?.includes('urgent'),
      notes: job.note
    }));
    
    res.json({
      timestamp: new Date().toISOString(),
      date: today.toISOString().split('T')[0],
      jobs: jobBoard
    });
  } catch (error) {
    console.error('Job board error:', error);
    res.status(500).json({ error: 'Failed to fetch job board' });
  }
});

// Update job assignment (drag and drop support)
router.put('/dashboard/jobs/:id/assign', authenticate, requirePermission('jobs.edit'), async (req, res) => {
  try {
    const { HousecallProClient } = await import('./housecall');
    const hcpClient = HousecallProClient.getInstance();
    
    const jobId = req.params.id;
    const { technicianId, scheduledStart, scheduledEnd } = req.body;
    
    // Update job assignment in HousecallPro
    // Note: Direct job update API not exposed, would need to implement in HousecallProClient
    // For now, log the intended update
    console.log(`Would update job ${jobId} with tech ${technicianId}`);
    
    const updatedJob = {
      id: jobId,
      assigned_employee_ids: technicianId ? [technicianId] : [],
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd
    };
    
    // Log the activity
    await logActivity(
      (req as any).user.id,
      'job_reassigned',
      'job',
      jobId,
      JSON.stringify({ technicianId, scheduledStart }),
      req.ip
    );
    
    res.json({
      success: true,
      job: updatedJob
    });
  } catch (error) {
    console.error('Job assignment error:', error);
    res.status(500).json({ error: 'Failed to update job assignment' });
  }
});

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
    
    // If no widgets exist, create default widgets
    if (widgets.length === 0) {
      const defaultWidgets = [
        { widgetType: 'capacity_gauge', position: 0, gridLayout: { x: 0, y: 0, w: 6, h: 3 }, isVisible: true },
        { widgetType: 'revenue_tracker', position: 1, gridLayout: { x: 6, y: 0, w: 6, h: 3 }, isVisible: true },
        { widgetType: 'job_board', position: 2, gridLayout: { x: 0, y: 3, w: 8, h: 4 }, isVisible: true },
        { widgetType: 'tech_status', position: 3, gridLayout: { x: 8, y: 3, w: 4, h: 4 }, isVisible: true },
        { widgetType: 'recent_jobs', position: 4, gridLayout: { x: 0, y: 7, w: 6, h: 3 }, isVisible: true },
        { widgetType: 'stats_overview', position: 5, gridLayout: { x: 6, y: 7, w: 6, h: 3 }, isVisible: true }
      ];
      
      const createdWidgets = await db.insert(dashboardWidgets).values(
        defaultWidgets.map(w => ({
          ...w,
          userId: (req as any).user.id,
          gridLayout: JSON.stringify(w.gridLayout)
        }))
      ).returning();
      
      res.json(createdWidgets);
    } else {
      res.json(widgets);
    }
  } catch (error) {
    console.error('Get widgets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update dashboard widget layout
router.put('/dashboard/widgets/layout', authenticate, async (req, res) => {
  try {
    const { layouts } = req.body;
    const userId = (req as any).user.id;
    
    // Update each widget's position and grid layout
    for (const layout of layouts) {
      await db.update(dashboardWidgets)
        .set({
          gridLayout: JSON.stringify(layout.gridLayout),
          position: layout.position,
          updatedAt: new Date()
        })
        .where(and(
          eq(dashboardWidgets.userId, userId),
          eq(dashboardWidgets.widgetType, layout.widgetType)
        ));
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update widget layout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update widget visibility
router.put('/dashboard/widgets/:widgetType/visibility', authenticate, async (req, res) => {
  try {
    const { widgetType } = req.params;
    const { isVisible } = req.body;
    const userId = (req as any).user.id;
    
    const [updated] = await db.update(dashboardWidgets)
      .set({
        isVisible,
        updatedAt: new Date()
      })
      .where(and(
        eq(dashboardWidgets.userId, userId),
        eq(dashboardWidgets.widgetType, widgetType)
      ))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Update widget visibility error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset dashboard widgets to default
router.post('/dashboard/widgets/reset', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Delete existing widgets
    await db.delete(dashboardWidgets)
      .where(eq(dashboardWidgets.userId, userId));
    
    // Create default widgets
    const defaultWidgets = [
      { widgetType: 'capacity_gauge', position: 0, gridLayout: { x: 0, y: 0, w: 6, h: 3 }, isVisible: true },
      { widgetType: 'revenue_tracker', position: 1, gridLayout: { x: 6, y: 0, w: 6, h: 3 }, isVisible: true },
      { widgetType: 'job_board', position: 2, gridLayout: { x: 0, y: 3, w: 8, h: 4 }, isVisible: true },
      { widgetType: 'tech_status', position: 3, gridLayout: { x: 8, y: 3, w: 4, h: 4 }, isVisible: true },
      { widgetType: 'recent_jobs', position: 4, gridLayout: { x: 0, y: 7, w: 6, h: 3 }, isVisible: true },
      { widgetType: 'stats_overview', position: 5, gridLayout: { x: 6, y: 7, w: 6, h: 3 }, isVisible: true }
    ];
    
    const createdWidgets = await db.insert(dashboardWidgets).values(
      defaultWidgets.map(w => ({
        ...w,
        userId,
        gridLayout: JSON.stringify(w.gridLayout)
      }))
    ).returning();
    
    res.json(createdWidgets);
  } catch (error) {
    console.error('Reset widgets error:', error);
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