import { Hono } from 'hono';
import { listOrders, getOrderDetails } from '../services/ordersService.js';

// Reader note:
// These routes back the dashboard tables. `/orders` feeds the main grid, and the details endpoint powers the expandable rows that show the raw Fulfil payload (address, lines, kits).

export const ordersRoutes = new Hono();

// GET /orders
// Returns a trimmed list of sync records for quick rendering (state chips, attempts, errors).
ordersRoutes.get('/orders', (c) => {
  return c.json({ orders: listOrders() });
});

// GET /orders/:erpOrderId/details
// Fetches the original ERP payload + sync metadata so we can explain exactly what we received and how it’s being processed.
ordersRoutes.get('/orders/:erpOrderId/details', (c) => {
  const erpOrderId = c.req.param('erpOrderId');
  const details = getOrderDetails(erpOrderId);
  if (!details) {
    return c.json({ error: 'Order not found' }, 404);
  }
  return c.json(details);
});
