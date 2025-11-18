import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { erpRoutes } from './api/erp.js';
import { syncRoutes } from './api/sync.js';
import { wmsRoutes } from './api/wms.js';
import { reconciliationRoutes } from './api/reconciliation.js';
import { ordersRoutes } from './api/orders.js';
import { testRoutes } from './api/test.js';
import { monitoringRoutes } from './api/monitoring.js';

const app = new Hono();

app.route('/', erpRoutes);
app.route('/', syncRoutes);
app.route('/', wmsRoutes);
app.route('/', reconciliationRoutes);
app.route('/', ordersRoutes);
app.route('/', testRoutes);
app.route('/', monitoringRoutes);

const currentDir = dirname(fileURLToPath(import.meta.url));
const dashboardPath = join(currentDir, 'ui', 'dashboard.html');

app.get('/', (c) => {
  const html = readFileSync(dashboardPath, 'utf-8');
  return c.html(html);
});

const port = Number(process.env.PORT ?? 8787);

console.log(`Backend integration server running on http://localhost:${port}`);
console.log('please hire me XD');

serve({ fetch: app.fetch, port });
