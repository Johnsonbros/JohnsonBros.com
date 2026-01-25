import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  getCustomerByIdentity,
  getMessagesByThread,
  getThreadByCustomer,
  normalizePhoneToE164,
} from '../lib/sharedThread';

const router = Router();

function requireInternalToken(req: Request, res: Response, next: () => void) {
  const token = req.headers['x-internal-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!process.env.INTERNAL_ADMIN_TOKEN || token !== process.env.INTERNAL_ADMIN_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

router.use(requireInternalToken);

router.get('/customer-by-identity', async (req: Request, res: Response) => {
  const parsed = z
    .object({
      type: z.string().min(1),
      value: z.string().min(1),
    })
    .safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query' });
  }

  let value = parsed.data.value;
  if (parsed.data.type === 'phone') {
    try {
      value = normalizePhoneToE164(parsed.data.value);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
  }

  const identity = await getCustomerByIdentity(parsed.data.type, value);

  res.json({ identity });
});

router.get('/thread/:customerId', async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const thread = await getThreadByCustomer(customerId);
  res.json({ thread });
});

router.get('/messages/:threadId', async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 50);
  const messages = await getMessagesByThread(req.params.threadId, Number.isNaN(limit) ? 50 : limit);
  res.json({ messages });
});

export default router;
