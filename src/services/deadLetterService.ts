import { getDeadLetter, getSyncRecordByErpId, listDeadLetters, removeDeadLetter, saveSyncRecord } from '../store/db.js';

// Reader note:
// When the sync service gives up on an order, it lands here. These helpers feed the dead-letter table in the dashboard and allow a human to re-queue a failed record.

export function fetchDeadLetters() {
  return listDeadLetters();
}

// Replay removes the entry from the queue and resets the sync record to PENDING_SYNC so the
// next /sync/run attempt can try again.
export function replayDeadLetter(erpOrderId: string) {
  const deadLetter = getDeadLetter(erpOrderId);
  if (!deadLetter) {
    throw new Error(`Dead letter for ERP order ${erpOrderId} not found`);
  }

  const syncRecord = getSyncRecordByErpId(erpOrderId);
  if (!syncRecord) {
    throw new Error(`Sync record for ERP order ${erpOrderId} not found`);
  }

  syncRecord.state = 'PENDING_SYNC';
  syncRecord.attempts = 0;
  syncRecord.lastError = undefined;
  syncRecord.lastUpdatedAt = Date.now();
  delete syncRecord.mabangOrderId;
  saveSyncRecord(syncRecord);

  removeDeadLetter(erpOrderId);

  return { record: syncRecord };
}
