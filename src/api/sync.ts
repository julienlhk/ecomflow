import { Hono } from 'hono';
import { runSync } from '../services/syncService.js';

// Reader note:
// This route is the manual “ship everything pending to Mabang” trigger. The UI’s “Run sync” button hits it so you can watch retries, failures, and state transitions in real time.

export const syncRoutes = new Hono();

// POST /sync/run
// Iterates through all PENDING_SYNC orders, transforms them, calls the mocked Mabang client, and updates states/metrics/dead letters. The JSON summary feeds the toast message in the UI.
syncRoutes.post('/sync/run', async (c) => {
  const summary = await runSync();
  return c.json(summary);
});
