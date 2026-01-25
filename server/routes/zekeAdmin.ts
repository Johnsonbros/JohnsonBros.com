import express from 'express';
import { Logger } from '../src/logger';
import { db } from '../db';
import { interactionLogs, zekeKPIs } from '@shared/schema';
import { desc, gte } from 'drizzle-orm';

const router = express.Router();

// Get ZEKE KPIs
router.get('/kpis', async (req, res) => {
  try {
    const kpis = await db.query.zekeKPIs.findMany({
      orderBy: [desc(zekeKPIs.date)],
      limit: 30
    });
    res.json(kpis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent interactions
router.get('/interactions', async (req, res) => {
  try {
    const logs = await db.query.interactionLogs.findMany({
      orderBy: [desc(interactionLogs.createdAt)],
      limit: 50
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
