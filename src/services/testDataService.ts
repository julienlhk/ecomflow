import type { ErpOrderInput } from '../models/types.js';
import { ingestErpOrder } from './erpService.js';
import type { z } from 'zod';
import { erpOrderLineSchema } from '../models/types.js';

// Reader note:
// This module just builds believable Fulfil payloads so we can demo the flow without Postman. Some orders even include bundle sublines, mirroring the real world 'kit' edge case.

const sampleSkus = ['SKU-ALPHA', 'SKU-BETA', 'SKU-GAMMA'];

function buildSampleOrder(): ErpOrderInput {
  const randomSku = sampleSkus[Math.floor(Math.random() * sampleSkus.length)];
  const now = Date.now();
  const hasSublines = Math.random() > 0.5;

  const baseLine: z.infer<typeof erpOrderLineSchema> = {
    id: now,
    product: {
      id: now,
      name: hasSublines ? 'Product Bundle' : 'Demo Product',
      code: randomSku,
      hsCode: '4202920000'
    },
    quantity: 1,
    currency: 'EUR',
    unitCustomsValue: 25
  };

  if (hasSublines) {
    baseLine.sublines = [
      {
        id: now + 1,
        product: {
          id: now + 1,
          name: 'Bundle Component A',
          code: 'SKU-COMP-A',
          hsCode: '4202920000'
        },
        quantity: 1
      },
      {
        id: now + 2,
        product: {
          id: now + 2,
          name: 'Bundle Component B',
          code: 'SKU-COMP-B',
          hsCode: '4202920000'
        },
        quantity: 2
      }
    ];
  }

  return {
    erpOrderId: `FUL-${now}`,
    organizationId: 'ORG-DEMO',
    channelId: 'ONLINE',
    deliveryAddress: {
      name: 'Julien El Achcar',
      address1: '99 boulevard de la Chapelle',
      city: 'Paris',
      zip: '75001',
      countryCode: 'FR',
      subdivisionCode: 'Ile-de-France',
      phone: '+33612345678'
    },
    lines: [baseLine]
  };
}

// Exposed helper that the /test/order endpoint uses.
export function injectSampleErpOrder() {
  const sampleOrder = buildSampleOrder();
  return ingestErpOrder(sampleOrder);
}
