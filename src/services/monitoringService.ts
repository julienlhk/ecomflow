import type { HealthStatusResponse, MetricsSnapshot } from '../models/types.js';
import { getMetricsSnapshot, listDeadLetters } from '../store/db.js';
import { runReconciliation } from './reconciliationService.js';

const MISMATCH_TOLERANCE = 2;

// Reader note:
// This service keeps the “health badge” honest by blending reconciliation results, aggregated metrics, and dead-letter counts into a single status payload.
export function fetchMetrics(): MetricsSnapshot {
  return getMetricsSnapshot();
}

export function getHealthStatus(): HealthStatusResponse {
  const reconciliationResult = runReconciliation();
  const summary = reconciliationResult.summary;
  const metrics = getMetricsSnapshot();
  const deadLetterCount = listDeadLetters().length;

  const mismatchScore = summary.statusMismatch + summary.onlyInErp + summary.onlyInWms;

  let status: HealthStatusResponse['status'] = 'HEALTHY';
  if (mismatchScore > 0 || metrics.failed > 0 || deadLetterCount > 0) {
    status = 'DEGRADED';
  }
  if (mismatchScore > MISMATCH_TOLERANCE || deadLetterCount > MISMATCH_TOLERANCE) {
    status = 'CRITICAL';
  }

  return {
    status,
    summary,
    metrics,
    deadLetterCount,
    threshold: {
      mismatchTolerance: MISMATCH_TOLERANCE
    }
  };
}
