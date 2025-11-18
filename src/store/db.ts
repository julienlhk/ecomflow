import type {
  DeadLetterRecord,
  ErpOrderInput,
  MetricsSnapshot,
  OrderSyncRecord,
  WmsOrderRecord
} from '../models/types.js';

interface DatabaseState {
  erpOrders: Map<string, ErpOrderInput>;
  syncRecords: Map<string, OrderSyncRecord>;
  wmsOrders: Map<string, WmsOrderRecord>;
  metrics: MetricsSnapshot;
  deadLetters: DeadLetterRecord[];
}

const state: DatabaseState = {
  erpOrders: new Map(),
  syncRecords: new Map(),
  wmsOrders: new Map(),
  metrics: {
    received: 0,
    synced: 0,
    acknowledged: 0,
    failed: 0,
    lastUpdatedAt: Date.now()
  },
  deadLetters: []
};

type MetricEvent = 'received' | 'synced' | 'acknowledged' | 'failed';

export function saveErpOrder(order: ErpOrderInput) {
  state.erpOrders.set(order.erpOrderId, order);
}

export function getErpOrder(erpOrderId: string) {
  return state.erpOrders.get(erpOrderId);
}

export function listErpOrders() {
  return Array.from(state.erpOrders.values());
}

export function saveSyncRecord(record: OrderSyncRecord) {
  state.syncRecords.set(record.ecomflowOrderId, record);
}

export function getSyncRecordByErpId(erpOrderId: string) {
  for (const record of state.syncRecords.values()) {
    if (record.erpOrderId === erpOrderId) {
      return record;
    }
  }
  return undefined;
}

export function getSyncRecord(ecomflowOrderId: string) {
  return state.syncRecords.get(ecomflowOrderId);
}

export function listSyncRecords() {
  return Array.from(state.syncRecords.values());
}

export function saveWmsOrder(order: WmsOrderRecord) {
  state.wmsOrders.set(order.mabangOrderId, order);
}

export function getWmsOrder(mabangOrderId: string) {
  return state.wmsOrders.get(mabangOrderId);
}

export function listWmsOrders() {
  return Array.from(state.wmsOrders.values());
}

export function recordMetric(event: MetricEvent) {
  state.metrics[event] += 1;
  state.metrics.lastUpdatedAt = Date.now();
}

export function getMetricsSnapshot(): MetricsSnapshot {
  return { ...state.metrics };
}

export function addDeadLetter(entry: DeadLetterRecord) {
  const index = state.deadLetters.findIndex((item) => item.erpOrderId === entry.erpOrderId);
  if (index >= 0) {
    state.deadLetters[index] = entry;
  } else {
    state.deadLetters.push(entry);
  }
}

export function listDeadLetters() {
  return state.deadLetters.map((entry) => ({ ...entry }));
}

export function removeDeadLetter(erpOrderId: string) {
  const index = state.deadLetters.findIndex((record) => record.erpOrderId === erpOrderId);
  if (index >= 0) {
    state.deadLetters.splice(index, 1);
    return true;
  }
  return false;
}

export function getDeadLetter(erpOrderId: string) {
  return state.deadLetters.find((record) => record.erpOrderId === erpOrderId);
}
