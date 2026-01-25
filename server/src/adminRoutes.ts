import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import {
  adminUsers, adminSessions, adminTasks, adminDocuments,
  aiChatSessions, aiChatMessages, googleAdsCampaigns,
  websiteAnalytics, dashboardWidgets, adminActivityLogs,
  webhookEvents, webhookAnalytics, customers, blogPosts,
  apiUsage, hcpJobs, hcpEstimates, hcpDailyStats, hcpSyncLog,
  InsertAdminTask, InsertAdminDocument, InsertAiChatMessage
} from '@shared/schema';
import competitorRoutes from './competitorRoutes';
import { eq, desc, and, gte, lte, sql, or, like, inArray, isNull, ne } from 'drizzle-orm';
import {
  hashPassword, verifyPassword, createSession, authenticate,
  requirePermission, logActivity, ensureSuperAdmin, initializePermissions,
  isAccountLocked, recordFailedLogin, resetFailedLogins,
  revokeSession, revokeUserSessions, revokeAllSessions, rotateSession, shouldRotateSession
} from './auth';

const router = Router();

// ADMIN-TODO-006: Standardize admin API error responses and validate audit event schema.

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
      isCurrent: sql<boolean>`${adminSessions.sessionToken} = ${req.headers.authorization?.replace('Bearer ', '') || ''}`
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
    const currentToken = req.headers.authorization?.replace('Bearer ', '') || '';

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
        scheduled_start_min: today.toISOString(),
        scheduled_start_max: tomorrow.toISOString()
      });

      // Fetch this week's jobs
      weekJobs = await hcpClient.getJobs({
        scheduled_start_min: weekAgo.toISOString(),
        scheduled_start_max: tomorrow.toISOString()
      });

      // Fetch this month's jobs
      monthJobs = await hcpClient.getJobs({
        scheduled_start_min: monthAgo.toISOString(),
        scheduled_start_max: tomorrow.toISOString()
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
    const todayRevenue = todayJobs
      .filter(job => job.work_status === 'completed')
      .reduce((sum, job) => sum + (job.total_amount || 0), 0);
    const todayJobsCompleted = todayJobs.filter(job => job.work_status === 'completed').length;
    const todayJobsInProgress = todayJobs.filter(job => job.work_status === 'in_progress').length;
    const todayJobsScheduled = todayJobs.filter(job => job.work_status === 'scheduled').length;

    const weekRevenue = weekJobs
      .filter(job => job.work_status === 'completed')
      .reduce((sum, job) => sum + (job.total_amount || 0), 0);
    const weekJobsCompleted = weekJobs.filter(job => job.work_status === 'completed').length;
    const weekNewCustomers = recentCustomers.length;

    const monthRevenue = monthJobs
      .filter(job => job.work_status === 'completed')
      .reduce((sum, job) => sum + (job.total_amount || 0), 0);
    const monthJobsCompleted = monthJobs.filter(job => job.work_status === 'completed').length;

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
// ANALYTICS & REPORTING
// ============================================

router.get('/analytics/overview', authenticate, requirePermission('analytics.view'), async (req, res) => {
  try {
    const days = parseInt((req.query.days as string) || '30');
    const limit = Number.isNaN(days) ? 30 : Math.min(Math.max(days, 1), 90);
    const analyticsRows = await db.select()
      .from(websiteAnalytics)
      .orderBy(desc(websiteAnalytics.date))
      .limit(limit);

    const safeParse = <T,>(value: string | null | undefined, fallback: T): T => {
      if (!value) return fallback;
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        return fallback;
      }
    };

    const normalized = analyticsRows.map((row) => ({
      ...row,
      topPages: safeParse<string[]>(row.topPages, []),
      trafficSources: safeParse<Record<string, number>>(row.trafficSources, {}),
      deviceTypes: safeParse<Record<string, number>>(row.deviceTypes, {}),
    }));

    res.json({
      latest: normalized[0] || null,
      history: normalized,
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

router.get('/customers', authenticate, requirePermission('customers.view'), async (req, res) => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '25');
    const search = (req.query.search as string) || '';

    const { HousecallProClient } = await import('./housecall');
    const hcpClient = HousecallProClient.getInstance();

    try {
      const response = await hcpClient.callAPI<{ customers?: any[]; total_items?: number; total_pages?: number }>('/customers', {
        page: Number.isNaN(page) ? 1 : page,
        page_size: Number.isNaN(limit) ? 25 : Math.min(Math.max(limit, 1), 100),
        ...(search ? { q: search } : {}),
      });

      const customersList = (response.customers || []).map((customer) => ({
        id: customer.id,
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        email: customer.email || '',
        phone: customer.mobile_number || customer.phone_number || '',
        createdAt: customer.created_at || null,
        source: 'housecall_pro',
      }));

      return res.json({
        source: 'housecall_pro',
        customers: customersList,
        total: response.total_items ?? customersList.length,
        page: Number.isNaN(page) ? 1 : page,
        totalPages: response.total_pages ?? null,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('[Admin] Falling back to database customers:', error);
    }

    const conditions = [];
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(customers.firstName, pattern),
          like(customers.lastName, pattern),
          like(customers.email, pattern),
          like(customers.phone, pattern)
        )
      );
    }

    let query: any = db.select()
      .from(customers)
      .orderBy(desc(customers.createdAt))
      .limit(Number.isNaN(limit) ? 25 : Math.min(Math.max(limit, 1), 100))
      .offset(((Number.isNaN(page) ? 1 : page) - 1) * (Number.isNaN(limit) ? 25 : Math.min(Math.max(limit, 1), 100)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const customersRows = await query;

    res.json({
      source: 'database',
      customers: customersRows.map((customer: any) => ({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
        source: 'database',
      })),
      total: customersRows.length,
      page: Number.isNaN(page) ? 1 : page,
      totalPages: null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ============================================
// GOOGLE ADS
// ============================================

router.get('/google-ads/campaigns', authenticate, requirePermission('google_ads.view'), async (req, res) => {
  try {
    const { status } = req.query;
    const conditions = [];

    if (status) {
      conditions.push(eq(googleAdsCampaigns.status, status as string));
    }

    let query: any = db.select()
      .from(googleAdsCampaigns)
      .orderBy(desc(googleAdsCampaigns.updatedAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const campaigns = await query;
    res.json(campaigns);
  } catch (error) {
    console.error('Get Google Ads campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// ============================================
// WEBHOOK EVENTS
// ============================================

router.get('/webhooks/events', authenticate, requirePermission('dashboard.view'), async (req, res) => {
  try {
    const { status, eventType, limit = 25 } = req.query;

    const conditions = [];
    if (status) {
      conditions.push(eq(webhookEvents.status, status as string));
    }
    if (eventType) {
      conditions.push(eq(webhookEvents.eventType, eventType as string));
    }

    let query: any = db.select({
      id: webhookEvents.id,
      eventType: webhookEvents.eventType,
      eventCategory: webhookEvents.eventCategory,
      status: webhookEvents.status,
      error: webhookEvents.error,
      receivedAt: webhookEvents.receivedAt,
      entityId: webhookEvents.entityId,
    })
      .from(webhookEvents)
      .orderBy(desc(webhookEvents.receivedAt))
      .limit(parseInt(limit as string));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const events = await query;
    res.json(events);
  } catch (error) {
    console.error('Get webhook events error:', error);
    res.status(500).json({ error: 'Failed to fetch webhook events' });
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

// ============================================
// AGENT TRACING & RLHF
// ============================================

import { agentTracing } from '../lib/agentTracing';
import {
  agentConversations,
  agentToolCalls,
  agentFeedback,
  InsertAgentFeedback
} from '@shared/schema';

// Get all agent conversations with filtering
router.get('/agent-tracing/conversations', authenticate, requirePermission('ai.view_chats'), async (req, res) => {
  try {
    const { channel, outcome, startDate, endDate, limit = 50, offset = 0 } = req.query;

    const conversations = await agentTracing.getConversations({
      channel: channel as string,
      outcome: outcome as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get single conversation with full details
router.get('/agent-tracing/conversations/:id', authenticate, requirePermission('ai.view_chats'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const conversation = await agentTracing.getConversation(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const toolCalls = await agentTracing.getToolCalls(id);
    const feedback = await agentTracing.getFeedback(id);

    res.json({
      conversation,
      toolCalls,
      feedback,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get conversation statistics
router.get('/agent-tracing/stats', authenticate, requirePermission('ai.view_chats'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const [conversationStats, toolCallStats] = await Promise.all([
      agentTracing.getConversationStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      ),
      agentTracing.getToolCallStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      ),
    ]);

    res.json({
      conversations: conversationStats,
      toolCalls: toolCallStats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Agent eval gate status for release checks
router.get('/agent-tracing/eval-gate', authenticate, requirePermission('ai.view_chats'), async (req, res) => {
  try {
    const { runId, promptVersion, modelUsed, categories, minPassRate } = req.query;
    const parsedCategories = typeof categories === 'string'
      ? categories.split(',').map((value) => value.trim()).filter(Boolean)
      : [];
    const gateStatus = await agentTracing.getEvalGateStatus({
      runId: runId as string | undefined,
      promptVersion: promptVersion as string | undefined,
      modelUsed: modelUsed as string | undefined,
      categories: parsedCategories.length > 0 ? parsedCategories : undefined,
      minPassRate: minPassRate ? parseFloat(minPassRate as string) : undefined,
    });

    res.json(gateStatus);
  } catch (error) {
    console.error('Get eval gate error:', error);
    res.status(500).json({ error: 'Failed to fetch eval gate status' });
  }
});

// Weekly tool correctness report and retraining queue
router.get('/agent-tracing/tool-correctness', authenticate, requirePermission('ai.view_chats'), async (req, res) => {
  try {
    const { windowDays } = req.query;
    const report = await agentTracing.getToolCorrectnessReport({
      windowDays: windowDays ? parseInt(windowDays as string, 10) : undefined,
    });

    res.json(report);
  } catch (error) {
    console.error('Get tool correctness error:', error);
    res.status(500).json({ error: 'Failed to fetch tool correctness report' });
  }
});

// Get tool calls for a conversation
router.get('/agent-tracing/conversations/:id/tool-calls', authenticate, requirePermission('ai.view_chats'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const toolCalls = await agentTracing.getToolCalls(id);
    res.json(toolCalls);
  } catch (error) {
    console.error('Get tool calls error:', error);
    res.status(500).json({ error: 'Failed to fetch tool calls' });
  }
});

// Add feedback to a conversation
router.post('/agent-tracing/conversations/:id/feedback', authenticate, requirePermission('ai.view_chats'), async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const { feedbackType, rating, correctedResponse, messageIndex, flagReason, annotation } = req.body;

    const feedback = await agentTracing.addFeedback({
      conversationId,
      feedbackType,
      rating,
      correctedResponse,
      messageIndex,
      flagReason,
      annotation,
      reviewedBy: (req as any).user.email,
      reviewedAt: new Date(),
    });

    await logActivity(
      (req as any).user.id,
      'add_feedback',
      'conversation',
      conversationId.toString(),
      { feedbackType, rating },
      req.ip
    );

    res.json(feedback);
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ error: 'Failed to add feedback' });
  }
});

// Flag or review a tool call
router.post('/agent-tracing/tool-calls/:id/review', authenticate, requirePermission('ai.view_chats'), async (req, res) => {
  try {
    const toolCallId = parseInt(req.params.id);
    const { wasCorrectTool, correctToolSuggestion, flagReason, annotation } = req.body;

    await agentTracing.flagToolCall(toolCallId, {
      wasCorrectTool,
      correctToolSuggestion,
      flagReason,
      annotation,
      reviewedBy: (req as any).user.email,
    });

    await logActivity(
      (req as any).user.id,
      'review_tool_call',
      'tool_call',
      toolCallId.toString(),
      { wasCorrectTool, correctToolSuggestion },
      req.ip
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Review tool call error:', error);
    res.status(500).json({ error: 'Failed to review tool call' });
  }
});

// Get pending reviews (tool calls that haven't been reviewed)
router.get('/agent-tracing/pending-reviews', authenticate, requirePermission('ai.view_chats'), async (req, res) => {
  try {
    const pendingReviews = await agentTracing.getPendingReviews();
    res.json(pendingReviews);
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
});

// Export conversations for fine-tuning in JSONL format
router.get('/agent-tracing/export/fine-tuning', authenticate, requirePermission('settings.edit'), async (req, res) => {
  try {
    const { minRating = 4, includeCorrections = 'true', excludeFlagged = 'true' } = req.query;

    const examples = await agentTracing.exportForFineTuning({
      minRating: parseInt(minRating as string),
      includeCorrections: includeCorrections === 'true',
      excludeFlagged: excludeFlagged === 'true',
    });

    // Convert to JSONL format
    const jsonl = examples.map(ex => JSON.stringify(ex)).join('\n');

    await logActivity(
      (req as any).user.id,
      'export_fine_tuning',
      'agent_tracing',
      undefined,
      { exampleCount: examples.length },
      req.ip
    );

    res.setHeader('Content-Type', 'application/jsonl');
    res.setHeader('Content-Disposition', `attachment; filename="fine-tuning-${new Date().toISOString().split('T')[0]}.jsonl"`);
    res.send(jsonl);
  } catch (error) {
    console.error('Export fine-tuning error:', error);
    res.status(500).json({ error: 'Failed to export fine-tuning data' });
  }
});

// Get export preview (JSON format for viewing)
router.get('/agent-tracing/export/preview', authenticate, requirePermission('ai.view_chats'), async (req, res) => {
  try {
    const { minRating = 4, includeCorrections = 'true', excludeFlagged = 'true', limit = 10 } = req.query;

    const examples = await agentTracing.exportForFineTuning({
      minRating: parseInt(minRating as string),
      includeCorrections: includeCorrections === 'true',
      excludeFlagged: excludeFlagged === 'true',
    });

    res.json({
      totalExamples: examples.length,
      preview: examples.slice(0, parseInt(limit as string)),
    });
  } catch (error) {
    console.error('Export preview error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// ============================================
// API USAGE TRACKING ENDPOINTS
// ============================================

/**
 * GET /api/admin/usage/summary
 *
 * Get total API costs by service for a date range
 * Query params:
 *   - startDate (ISO string, default: 30 days ago)
 *   - endDate (ISO string, default: now)
 */
router.get('/usage/summary', authenticate, requirePermission('reports:view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no date range provided
    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate
      ? new Date(endDate as string)
      : new Date();

    // Get total costs by service
    const summaryByService = await db
      .select({
        service: apiUsage.service,
        totalCostCents: sql<number>`SUM(${apiUsage.estimatedCostCents})`.as('totalCostCents'),
        totalUnits: sql<number>`SUM(${apiUsage.units})`.as('totalUnits'),
        requestCount: sql<number>`COUNT(*)`.as('requestCount'),
      })
      .from(apiUsage)
      .where(
        and(
          gte(apiUsage.createdAt, start),
          lte(apiUsage.createdAt, end)
        )
      )
      .groupBy(apiUsage.service);

    // Calculate grand total
    const grandTotal = summaryByService.reduce((sum, item) => sum + Number(item.totalCostCents), 0);

    // Format the response
    const formattedSummary = summaryByService.map(item => ({
      service: item.service,
      totalCostDollars: Number(item.totalCostCents) / 100,
      totalCostCents: Number(item.totalCostCents),
      totalUnits: Number(item.totalUnits),
      requestCount: Number(item.requestCount),
    }));

    res.json({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      grandTotalCents: grandTotal,
      grandTotalDollars: grandTotal / 100,
      byService: formattedSummary,
    });
  } catch (error) {
    console.error('Usage summary error:', error);
    res.status(500).json({ error: 'Failed to fetch usage summary' });
  }
});

/**
 * GET /api/admin/usage/daily
 *
 * Get daily breakdown of API costs for charts
 * Query params:
 *   - startDate (ISO string, default: 30 days ago)
 *   - endDate (ISO string, default: now)
 */
router.get('/usage/daily', authenticate, requirePermission('reports:view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate
      ? new Date(endDate as string)
      : new Date();

    // Get daily costs by service
    const dailyData = await db
      .select({
        date: sql<string>`DATE(${apiUsage.createdAt})`.as('date'),
        service: apiUsage.service,
        totalCostCents: sql<number>`SUM(${apiUsage.estimatedCostCents})`.as('totalCostCents'),
        requestCount: sql<number>`COUNT(*)`.as('requestCount'),
      })
      .from(apiUsage)
      .where(
        and(
          gte(apiUsage.createdAt, start),
          lte(apiUsage.createdAt, end)
        )
      )
      .groupBy(sql`DATE(${apiUsage.createdAt})`, apiUsage.service)
      .orderBy(sql`DATE(${apiUsage.createdAt})`);

    // Format for charting libraries
    const formattedDaily = dailyData.map(item => ({
      date: item.date,
      service: item.service,
      totalCostDollars: Number(item.totalCostCents) / 100,
      totalCostCents: Number(item.totalCostCents),
      requestCount: Number(item.requestCount),
    }));

    res.json({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      daily: formattedDaily,
    });
  } catch (error) {
    console.error('Daily usage error:', error);
    res.status(500).json({ error: 'Failed to fetch daily usage' });
  }
});

/**
 * GET /api/admin/usage/by-channel
 *
 * Get API costs broken down by channel (web_chat, sms, voice)
 * Query params:
 *   - startDate (ISO string, default: 30 days ago)
 *   - endDate (ISO string, default: now)
 */
router.get('/usage/by-channel', authenticate, requirePermission('reports:view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate
      ? new Date(endDate as string)
      : new Date();

    // Get costs by channel
    const channelData = await db
      .select({
        channel: apiUsage.channel,
        service: apiUsage.service,
        totalCostCents: sql<number>`SUM(${apiUsage.estimatedCostCents})`.as('totalCostCents'),
        totalUnits: sql<number>`SUM(${apiUsage.units})`.as('totalUnits'),
        requestCount: sql<number>`COUNT(*)`.as('requestCount'),
      })
      .from(apiUsage)
      .where(
        and(
          gte(apiUsage.createdAt, start),
          lte(apiUsage.createdAt, end)
        )
      )
      .groupBy(apiUsage.channel, apiUsage.service);

    // Format the response
    const formattedChannelData = channelData.map(item => ({
      channel: item.channel || 'unknown',
      service: item.service,
      totalCostDollars: Number(item.totalCostCents) / 100,
      totalCostCents: Number(item.totalCostCents),
      totalUnits: Number(item.totalUnits),
      requestCount: Number(item.requestCount),
    }));

    // Calculate totals by channel
    const channelTotals = formattedChannelData.reduce((acc, item) => {
      const channel = item.channel;
      if (!acc[channel]) {
        acc[channel] = {
          channel,
          totalCostCents: 0,
          totalCostDollars: 0,
          requestCount: 0,
        };
      }
      acc[channel].totalCostCents += item.totalCostCents;
      acc[channel].totalCostDollars += item.totalCostDollars;
      acc[channel].requestCount += item.requestCount;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      byChannel: formattedChannelData,
      channelTotals: Object.values(channelTotals),
    });
  } catch (error) {
    console.error('Channel usage error:', error);
    res.status(500).json({ error: 'Failed to fetch channel usage' });
  }
});

// ==============================================
// HCP SYNC & CACHED DATA ROUTES
// ==============================================

// Get sync status
router.get('/hcp/sync/status', authenticate, requirePermission('dashboard.view'), async (req, res) => {
  try {
    const { getHCPSyncService } = await import('./hcpSync');
    const syncService = getHCPSyncService();
    const status = await syncService.getSyncStatus();
    res.json(status);
  } catch (error) {
    console.error('HCP sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Trigger manual sync
router.post('/hcp/sync/trigger', authenticate, requirePermission('settings.edit'), async (req, res) => {
  try {
    const { getHCPSyncService } = await import('./hcpSync');
    const syncService = getHCPSyncService();
    const results = await syncService.syncAll();
    await logActivity((req as any).user?.id, 'hcp_sync_triggered', 'sync', undefined, { results }, req.ip);
    res.json({ success: true, results });
  } catch (error) {
    console.error('HCP sync trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});

// Get cached jobs with filters
router.get('/hcp/jobs', authenticate, requirePermission('dashboard.view'), async (req, res) => {
  try {
    const { startDate, endDate, status, limit = '100', offset = '0' } = req.query;

    let query = db.select().from(hcpJobs);

    const conditions = [];
    if (startDate) {
      conditions.push(gte(hcpJobs.scheduledStart, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(hcpJobs.scheduledStart, new Date(endDate as string)));
    }
    if (status) {
      conditions.push(eq(hcpJobs.workStatus, status as string));
    }

    const jobs = await db.query.hcpJobs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (job, { desc }) => [desc(job.scheduledStart)],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    const totalCount = await db.select({ count: sql<number>`count(*)` })
      .from(hcpJobs)
      .then(r => r[0]?.count || 0);

    res.json({
      jobs,
      total: totalCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('HCP jobs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get cached estimates with filters
router.get('/hcp/estimates', authenticate, requirePermission('dashboard.view'), async (req, res) => {
  try {
    const { startDate, endDate, status, limit = '100', offset = '0' } = req.query;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(hcpEstimates.scheduledStart, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(hcpEstimates.scheduledStart, new Date(endDate as string)));
    }
    if (status) {
      conditions.push(eq(hcpEstimates.status, status as string));
    }

    const estimates = await db.query.hcpEstimates.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (est, { desc }) => [desc(est.scheduledStart)],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    const totalCount = await db.select({ count: sql<number>`count(*)` })
      .from(hcpEstimates)
      .then(r => r[0]?.count || 0);

    res.json({
      estimates,
      total: totalCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('HCP estimates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch estimates' });
  }
});

// Get daily stats for historical analytics
router.get('/hcp/daily-stats', authenticate, requirePermission('dashboard.view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await db.query.hcpDailyStats.findMany({
      where: and(
        gte(hcpDailyStats.date, start),
        lte(hcpDailyStats.date, end)
      ),
      orderBy: (stat, { asc }) => [asc(stat.date)],
    });

    // Calculate period totals
    const totals = stats.reduce((acc, day) => ({
      totalRevenue: acc.totalRevenue + (day.revenueCompleted || 0),
      totalJobs: acc.totalJobs + (day.jobsCompleted || 0),
      totalEstimates: acc.totalEstimates + (day.estimatesSent || 0),
      totalEstimatesAccepted: acc.totalEstimatesAccepted + (day.estimatesAccepted || 0),
      totalEmergencies: acc.totalEmergencies + (day.emergencyJobs || 0),
    }), {
      totalRevenue: 0,
      totalJobs: 0,
      totalEstimates: 0,
      totalEstimatesAccepted: 0,
      totalEmergencies: 0,
    });

    res.json({
      stats,
      totals,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        days: stats.length,
      },
    });
  } catch (error) {
    console.error('HCP daily stats error:', error);
    res.status(500).json({ error: 'Failed to fetch daily stats' });
  }
});

// Get estimates pipeline summary
router.get('/hcp/estimates/pipeline', authenticate, requirePermission('dashboard.view'), async (req, res) => {
  try {
    // Get counts by status
    const pipeline = await db.select({
      status: hcpEstimates.status,
      count: sql<number>`count(*)`,
      totalValue: sql<number>`sum(${hcpEstimates.totalAmount})`,
    })
      .from(hcpEstimates)
      .groupBy(hcpEstimates.status);

    // Get recent estimates
    const recent = await db.query.hcpEstimates.findMany({
      orderBy: (est, { desc }) => [desc(est.syncedAt)],
      limit: 10,
    });

    // Calculate conversion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const conversionStats = await db.select({
      total: sql<number>`count(*)`,
      accepted: sql<number>`count(*) filter (where ${hcpEstimates.status} = 'accepted')`,
    })
      .from(hcpEstimates)
      .where(gte(hcpEstimates.hcpCreatedAt, thirtyDaysAgo));

    const conversionRate = conversionStats[0]?.total > 0
      ? (conversionStats[0].accepted / conversionStats[0].total) * 100
      : 0;

    res.json({
      pipeline,
      recent,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalEstimates: conversionStats[0]?.total || 0,
    });
  } catch (error) {
    console.error('HCP estimates pipeline error:', error);
    res.status(500).json({ error: 'Failed to fetch estimates pipeline' });
  }
});

// ==============================================
// COMPETITOR TRACKING ROUTES
// ==============================================
router.use('/competitors', competitorRoutes);

export default router;
