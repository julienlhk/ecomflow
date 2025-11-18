import { Hono } from 'hono';
import { runReconciliation } from '../services/reconciliationService.js';

// Reader note:
// The reconciliation view (counts + detailed issues) is powered by this route. Whenever the dashboard loads or you click “Run reconciliation”, it calls this endpoint to compare ERP, sync, and WMS stores and highlight any drift.

export const reconciliationRoutes = new Hono();

// GET /reconciliation/run
// Returns both the summary counts (inSync/onlyInERP/onlyInWMS/statusMismatch) and the detailed list used for debugging. Great for spotting problems without digging into logs.
reconciliationRoutes.get('/reconciliation/run', (c) => {
  const result = runReconciliation();
  return c.json(result);
});
