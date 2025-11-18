import {
  addDeadLetter,
  getErpOrder,
  listSyncRecords,
  recordMetric,
  saveSyncRecord,
  saveWmsOrder
} from '../store/db.js';
import type { InternalOrder, OrderSyncRecord } from '../models/types.js';
import { sendToMabang } from '../wms/mabangClient.js';

const MAX_RETRIES = 3;

// Reader note:
// This is the orchestration heart of the project—transforms incoming ERP orders into the internal format, calls the mocked Mabang API (with retries), updates metrics, and pushes anything that permanently fails into the dead-letter queue so the UI can surface it.

function enqueueDeadLetter(record: OrderSyncRecord, reason: string) {
  addDeadLetter({
    erpOrderId: record.erpOrderId,
    ecomflowOrderId: record.ecomflowOrderId,
    reason,
    failedAt: Date.now(),
    attempts: record.attempts,
    lastError: record.lastError
  });
}

function buildInternalOrder(record: OrderSyncRecord): InternalOrder {
  const erpOrder = getErpOrder(record.erpOrderId);
  if (!erpOrder) {
    throw new Error(`ERP order ${record.erpOrderId} missing in store`);
  }

  return {
    ecomflowOrderId: record.ecomflowOrderId,
    erpOrderId: erpOrder.erpOrderId,
    organizationId: erpOrder.organizationId,
    channelId: erpOrder.channelId,
    address: erpOrder.deliveryAddress,
    lineItems: erpOrder.lines.flatMap((line) => {
      if (!line.sublines || line.sublines.length === 0) {
        return [
          {
            sku: line.product.code,
            quantity: line.quantity,
            description: line.product.name,
            hsCode: line.product.hsCode ?? undefined,
            unitValue: line.unitCustomsValue
          }
        ];
      }

      return line.sublines.map((subline) => ({
        sku: subline.product.code,
        quantity: subline.quantity,
        description: subline.product.name,
        hsCode: subline.product.hsCode ?? undefined,
        unitValue: line.unitCustomsValue
      }));
    })
  };
}

async function attemptSend(order: InternalOrder) {
  let attempts = 0;
  let lastError: Error | undefined;

  while (attempts < MAX_RETRIES) {
    try {
      const result = await sendToMabang(order);
      return { success: true as const, attemptsUsed: attempts + 1, mabangOrderId: result.mabangOrderId };
    } catch (error) {
      attempts += 1;
      lastError = error instanceof Error ? error : new Error('Unknown Mabang error');
      if (attempts >= MAX_RETRIES) {
        break;
      }
    }
  }

  return { success: false as const, attemptsUsed: attempts, lastError };
}

// Kicks off the end-to-end sync run. Returns a summary that we echo back to the client so the dashboard knows how many orders were processed, forwarded, or failed.
export async function runSync() {
  const candidateRecords = listSyncRecords().filter((record) => record.state === 'PENDING_SYNC');
  const summary = { processed: candidateRecords.length, sentToWms: 0, failed: 0 };

  for (const record of candidateRecords) {
    if (record.mabangOrderId) {
      continue;
    }

    try {
      const internalOrder = buildInternalOrder(record);
      const result = await attemptSend(internalOrder);
      record.attempts += result.attemptsUsed;
      record.lastUpdatedAt = Date.now();

      if (result.success) {
        record.state = 'SENT_TO_WMS';
        record.mabangOrderId = result.mabangOrderId;
        record.lastError = undefined;
        saveSyncRecord(record);

        saveWmsOrder({
          mabangOrderId: result.mabangOrderId,
          ecomflowOrderId: record.ecomflowOrderId,
          status: 'CREATED',
          createdAt: Date.now()
        });
        recordMetric('synced');

        summary.sentToWms += 1;
      } else {
        record.state = 'FAILED';
        record.lastError = result.lastError?.message ?? 'Unknown failure';
        saveSyncRecord(record);
        recordMetric('failed');
        enqueueDeadLetter(record, record.lastError);
        summary.failed += 1;
      }
    } catch (error) {
      record.state = 'FAILED';
      record.lastError = error instanceof Error ? error.message : 'Unexpected sync failure';
      record.lastUpdatedAt = Date.now();
      saveSyncRecord(record);
      recordMetric('failed');
      enqueueDeadLetter(record, record.lastError);
      summary.failed += 1;
    }
  }

  return summary;
}
