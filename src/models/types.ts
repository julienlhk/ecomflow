import { z } from 'zod';

export const erpAddressSchema = z.object({
  name: z.string(),
  address1: z.string(),
  address2: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  city: z.string(),
  zip: z.string(),
  countryCode: z.string().length(2),
  subdivisionCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable()
});

export const erpOrderLineProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  hsCode: z.string().optional().nullable()
});

export const erpOrderSublineSchema = z.object({
  id: z.number(),
  product: erpOrderLineProductSchema,
  quantity: z.number().min(1)
});

export const erpOrderLineSchema = z.object({
  id: z.number(),
  product: erpOrderLineProductSchema,
  quantity: z.number().min(1),
  currency: z.string(),
  unitCustomsValue: z.number().nonnegative(),
  sublines: z.array(erpOrderSublineSchema).optional()
});

export const erpOrderInputSchema = z.object({
  erpOrderId: z.string(),
  organizationId: z.string(),
  channelId: z.string(),
  deliveryAddress: erpAddressSchema,
  lines: z.array(erpOrderLineSchema).min(1)
});

export type ErpOrderInput = z.infer<typeof erpOrderInputSchema>;

export const syncStateSchema = z.enum([
  'PENDING_SYNC',
  'SENT_TO_WMS',
  'ACKNOWLEDGED_BY_WMS',
  'FAILED'
]);
export type SyncState = z.infer<typeof syncStateSchema>;

export interface OrderSyncRecord {
  ecomflowOrderId: string;
  erpOrderId: string;
  mabangOrderId?: string;
  state: SyncState;
  lastError?: string;
  attempts: number;
  lastUpdatedAt: number;
}

export interface InternalOrderLineItem {
  sku: string;
  quantity: number;
  description: string;
  hsCode?: string;
  unitValue: number;
}

export interface InternalOrder {
  ecomflowOrderId: string;
  erpOrderId: string;
  organizationId: string;
  channelId: string;
  address: ErpOrderInput['deliveryAddress'];
  lineItems: InternalOrderLineItem[];
}

export interface WmsOrderRecord {
  mabangOrderId: string;
  ecomflowOrderId: string;
  status: 'CREATED' | 'ACKNOWLEDGED';
  createdAt: number;
  acknowledgedAt?: number;
}

export interface ReconciliationSummary {
  inSync: number;
  onlyInErp: number;
  onlyInWms: number;
  statusMismatch: number;
}

export interface OrdersResponseItem {
  erpOrderId: string;
  ecomflowOrderId: string;
  mabangOrderId?: string;
  state: SyncState;
  lastError?: string;
  attempts: number;
}

export interface MetricsSnapshot {
  received: number;
  synced: number;
  acknowledged: number;
  failed: number;
  lastUpdatedAt: number;
}

export interface DeadLetterRecord {
  erpOrderId: string;
  ecomflowOrderId: string;
  reason: string;
  failedAt: number;
  attempts: number;
  lastError?: string;
}

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL';

export interface HealthStatusResponse {
  status: HealthStatus;
  summary: ReconciliationSummary;
  metrics: MetricsSnapshot;
  deadLetterCount: number;
  threshold: {
    mismatchTolerance: number;
  };
}
