import type { InternalOrder } from '../models/types.js';
import { randomUUID } from 'crypto';

const FAILURE_RATE = 0.2;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendToMabang(order: InternalOrder) {
  const latency = 150 + Math.floor(Math.random() * 200);
  await delay(latency);

  if (Math.random() < FAILURE_RATE) {
    throw new Error('Mabang API temporary failure');
  }

  const mabangOrderId = `MAB-${randomUUID().slice(0, 8).toUpperCase()}`;
  console.log('[mabangClient] Order forwarded', { mabangOrderId, erpOrderId: order.erpOrderId });

  return { mabangOrderId };
}
