import { AdminPermissions } from './admin';
import { AnalyticsPermissions } from './analytics';
import { HealthPermissions } from './health';
import { TaskPermissions } from './task';

export const AppPermissions = {
   ...HealthPermissions,
   ...AdminPermissions,
   ...AnalyticsPermissions,
   ...TaskPermissions,
} as const;
