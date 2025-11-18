import { Hono } from 'hono';
import { injectSampleErpOrder } from '../services/testDataService.js';

// Reader note:
// This tiny helper lets you spin up realistic-looking Fulfil orders without crafting JSON. The dashboard’s “Inject sample ERP order” button calls this endpoint.

export const testRoutes = new Hono();

// POST /test/order
// Creates a random-but-valid ERP payload (with address, lines, optional bundles) and pushes it through the same ingestion path as a real external message.
testRoutes.post('/test/order', (c) => {
  const result = injectSampleErpOrder();
  return c.json({ message: 'Sample order injected', record: result.record });
});
