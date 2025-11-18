import { randomUUID } from 'crypto';
import { erpOrderInputSchema, type OrderSyncRecord } from '../models/types.js';
import { getSyncRecordByErpId, saveErpOrder, saveSyncRecord, recordMetric } from '../store/db.js';

// Reader note:
// Think of this service as the first guardrail in the pipeline. It validates the ERP payload, keeps us idempotent (no duplicate sync records), and nudges the metrics so the dashboard’s “Received” counter stays honest.

export function ingestErpOrder(payload: unknown) {
  const erpOrder = erpOrderInputSchema.parse(payload);
  const existingRecord = getSyncRecordByErpId(erpOrder.erpOrderId);

  if (existingRecord) {
    return { record: existingRecord, created: false };
  }

  saveErpOrder(erpOrder);

  const record: OrderSyncRecord = {
    ecomflowOrderId: `ECO-${randomUUID().slice(0, 8).toUpperCase()}`,
    erpOrderId: erpOrder.erpOrderId,
    state: 'PENDING_SYNC',
    attempts: 0,
    lastUpdatedAt: Date.now()
  };

  saveSyncRecord(record);
  recordMetric('received');

  return { record, created: true };
}
