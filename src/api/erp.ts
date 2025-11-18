import { Hono } from 'hono';
import { ingestErpOrder } from '../services/erpService.js';

// heads-up for the person reading this code:
// This router is the mocked “Fulfil → Ecomflow” entry point. Whenever the dashboard injects a sample order (or you POST your own payload), it lands here so we can run Zod validation, enforce idempotency, and stash the order for the rest of the flow.
export const erpRoutes = new Hono();

// POST /erp/orders
// Accepts the ERP payload, validates it, and either creates a fresh sync record (state = PENDING_SYNC) or reports that we’ve already seen the order. The dashboard message under “Manual Controls” comes from this response.
erpRoutes.post('/erp/orders', async (c) => {
  const payload = await c.req.json().catch(() => ({}));
  try {
    const result = ingestErpOrder(payload);
    return c.json({ message: result.created ? 'Order ingested' : 'Order already exists', record: result.record });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});
