// Assumptions
export const TENANT_TTL_MS = 5 * 60 * 1000; // 5 minute prune

export const SEARCHABLE_DIVIDER = '|';

// Templates
export const KeyTemplates = {
   TenantDataKey: (tenant: string) => `stencil-tenant.${tenant}.dek`,
};
