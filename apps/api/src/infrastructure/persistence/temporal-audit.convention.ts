/**
 * Temporal audit convention for Lumina database entities.
 * Every persistent model that represents tracked state must include
 * createdAt and updatedAt fields mapped to timestamptz(6).
 */
export interface TemporalAudit {
  createdAt: Date;
  updatedAt: Date;
}

export const TEMPORAL_AUDIT_COLUMNS = {
  createdAt: "created_at",
  updatedAt: "updated_at",
} as const;
