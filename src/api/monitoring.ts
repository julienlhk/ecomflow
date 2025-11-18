import { Hono } from 'hono';
import { fetchDeadLetters, replayDeadLetter } from '../services/deadLetterService.js';
import { getHealthStatus } from '../services/monitoringService.js';

// Reader note:
// This file serves the “bonus” operational endpoints. They drive the health badge, metric counters, and dead-letter queue table you see near the top of the dashboard.

export const monitoringRoutes = new Hono();

// GET /health
// Returns the reconciliation summary, aggregated metrics, and an overall status (HEALTHY/DEGRADED/CRITICAL). The UI badge and metric cards bind directly to this payload.
monitoringRoutes.get('/health', (c) => {
  const status = getHealthStatus();
  return c.json(status);
});

// GET /deadletters
// Lists permanently failed sync attempts so operators can inspect what went wrong.
monitoringRoutes.get('/deadletters', (c) => {
  return c.json({ deadLetters: fetchDeadLetters() });
});

// POST /deadletters/:erpOrderId/replay
// Resets a failed record back to PENDING_SYNC and removes it from the queue so the next “Run sync” command can re-attempt it. The replay buttons in the table call this route.
monitoringRoutes.post('/deadletters/:erpOrderId/replay', async (c) => {
  const erpOrderId = c.req.param('erpOrderId');
  try {
    const result = replayDeadLetter(erpOrderId);
    return c.json({ message: 'Replay scheduled', record: result.record });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to replay dead letter';
    return c.json({ error: message }, 400);
  }
});
