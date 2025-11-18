import { Hono } from 'hono';
import { acknowledgeFromWms } from '../services/wmsService.js';

// Reader note:
// Think of this route as the “warehouse called back” webhook. When you paste a MAB-XXXX identifier in the dashboard and hit “Send WMS ack”, it lands here to flip the state to ACKNOWLEDGED_BY_WMS and keep the reconciliation view happy.

export const wmsRoutes = new Hono();

// POST /wms/ack
// Validates the body, finds the corresponding sync + WMS record, marks both as acknowledged and bumps the metrics. Handy when you want to simulate the final hop in the loop.
wmsRoutes.post('/wms/ack', async (c) => {
  const payload = await c.req.json().catch(() => ({}));
  try {
    const result = acknowledgeFromWms(payload);
    return c.json({ message: 'Acknowledged', record: result.record });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});
