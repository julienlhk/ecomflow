import type { OrdersResponseItem, ErpOrderInput } from '../models/types.js';
import { listSyncRecords, getErpOrder, getSyncRecordByErpId } from '../store/db.js';

// Reader note:
// These helpers keep the dashboard tables lightweight. We send a trimmed list for the main grid, and pull the original ERP payload on demand when someone expands a row.

export function listOrders(): OrdersResponseItem[] {
  return listSyncRecords()
    .map((record) => ({
      erpOrderId: record.erpOrderId,
      ecomflowOrderId: record.ecomflowOrderId,
      mabangOrderId: record.mabangOrderId,
      state: record.state,
      lastError: record.lastError,
      attempts: record.attempts
    }))
    .sort((a, b) => a.erpOrderId.localeCompare(b.erpOrderId));
}

// Fetch the original ERP order and its sync metadata so we can show the “raw” payload in the UI.
export function getOrderDetails(erpOrderId: string): { erpOrder: ErpOrderInput; syncRecord: ReturnType<typeof getSyncRecordByErpId> } | null {
  const erpOrder = getErpOrder(erpOrderId);
  if (!erpOrder) {
    return null;
  }
  const syncRecord = getSyncRecordByErpId(erpOrderId);
  return { erpOrder, syncRecord: syncRecord ?? null };
}
