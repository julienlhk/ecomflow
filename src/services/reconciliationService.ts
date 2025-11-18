import { listErpOrders, listSyncRecords, listWmsOrders } from '../store/db.js';
import type { ReconciliationSummary } from '../models/types.js';

// Reader note:
// This helper is what makes the reconciliation summary meaningful. It walks every ERP, sync, and WMS record to explain who’s missing where and why the badge might turn yellow/red.

export function runReconciliation() {
  const erpOrders = listErpOrders();
  const syncRecords = listSyncRecords();
  const wmsOrders = listWmsOrders();

  const syncByErpId = new Map(syncRecords.map((record) => [record.erpOrderId, record]));
  const wmsByEcomflowId = new Map(wmsOrders.map((record) => [record.ecomflowOrderId, record]));

  let inSync = 0;
  let onlyInErp = 0;
  let onlyInWms = 0;
  let statusMismatch = 0;

  const details: Array<{ erpOrderId?: string; mabangOrderId?: string; issue: string }> = [];

  for (const erpOrder of erpOrders) {
    const syncRecord = syncByErpId.get(erpOrder.erpOrderId);

    if (!syncRecord) {
      onlyInErp += 1;
      details.push({ erpOrderId: erpOrder.erpOrderId, issue: 'Missing sync record' });
      continue;
    }

    if (!syncRecord.mabangOrderId) {
      statusMismatch += 1;
      details.push({ erpOrderId: erpOrder.erpOrderId, issue: 'Not yet forwarded to WMS' });
      continue;
    }

    const wmsOrder = wmsByEcomflowId.get(syncRecord.ecomflowOrderId);

    if (!wmsOrder) {
      onlyInErp += 1;
      details.push({ erpOrderId: erpOrder.erpOrderId, issue: 'Missing WMS record' });
      continue;
    }

    const fullyAcknowledged =
      syncRecord.state === 'ACKNOWLEDGED_BY_WMS' && wmsOrder.status === 'ACKNOWLEDGED';

    if (fullyAcknowledged) {
      inSync += 1;
    } else {
      statusMismatch += 1;
      details.push({
        erpOrderId: erpOrder.erpOrderId,
        mabangOrderId: wmsOrder.mabangOrderId,
        issue: 'Awaiting acknowledgment'
      });
    }
  }

  const erpIds = new Set(erpOrders.map((order) => order.erpOrderId));

  for (const wmsOrder of wmsOrders) {
    const syncRecord = syncRecords.find((record) => record.ecomflowOrderId === wmsOrder.ecomflowOrderId);
    if (!syncRecord || !erpIds.has(syncRecord.erpOrderId)) {
      onlyInWms += 1;
      details.push({ mabangOrderId: wmsOrder.mabangOrderId, issue: 'Missing ERP counterpart' });
    }
  }

  const summary: ReconciliationSummary = {
    inSync,
    onlyInErp,
    onlyInWms,
    statusMismatch
  };

  return { summary, details };
}
