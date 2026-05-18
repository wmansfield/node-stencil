export const TaskPermissions = {
   Tasks: {
      Index: {
         Sync: 'tasks:index:sync',
      },
      Synchronization: {
         Sync: 'tasks:synchronization:sync',
      },
      Webhook: {
         Sync: 'tasks:webhook:sync',
      },
      ImageResize: {
         Sync: 'tasks:image-resize:sync',
      },
      RoleSync: {
         Sync: 'tasks:role-sync:sync',
      },
      DistributionFanout: {
         Sync: 'tasks:distribution-fanout:sync',
      },
      DeletionProcessor: {
         Sync: 'tasks:deletion-processor:sync',
      },
      Schema: {
         Sync: 'tasks:schema:sync',
      },
   },
} as const;
