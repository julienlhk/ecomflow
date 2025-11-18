import { z } from 'zod';
import { getSyncRecord, saveSyncRecord, getWmsOrder, saveWmsOrder, recordMetric } from '../store/db.js';

// Reader note:
// The warehouse acknowledgment simulation lives here. It’s intentionally tiny: validate the payload, flip both the WMS record + sync state, and bump metrics so reconciliation can see that the round trip is complete.

const wmsAckSchema = z.object({
  mabangOrderId: z.string()
});

// When the UI posts a MAB ID, we run this function to mark everything as ACKNOWLEDGED.
export function acknowledgeFromWms(payload: unknown) {
  const { mabangOrderId } = wmsAckSchema.parse(payload);
  const wmsOrder = getWmsOrder(mabangOrderId);

  if (!wmsOrder) {
    throw new Error(`WMS order ${mabangOrderId} not found`);
  }

  const syncRecord = getSyncRecord(wmsOrder.ecomflowOrderId);
  if (!syncRecord) {
    throw new Error(`Sync record for ${wmsOrder.ecomflowOrderId} missing`);
  }

  wmsOrder.status = 'ACKNOWLEDGED';
  wmsOrder.acknowledgedAt = Date.now();
  saveWmsOrder(wmsOrder);

  syncRecord.state = 'ACKNOWLEDGED_BY_WMS';
  syncRecord.lastUpdatedAt = Date.now();
  syncRecord.lastError = undefined;
  saveSyncRecord(syncRecord);
  recordMetric('acknowledged');

  return { record: syncRecord };
}
