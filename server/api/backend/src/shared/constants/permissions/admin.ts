export const AdminPermissions = {
   Admin: {
      GlobalSetting: {
         Read: 'admin:globalsetting:read',
         Write: 'admin:globalsetting:write',
      },
      Timezone: {
         Read: 'admin:timezone:read',
         Write: 'admin:timezone:write',
         Public: {
            Read: 'admin:timezone.public:read',
         },
         
      },
      Role: {
         Read: 'admin:role:read',
         Write: 'admin:role:write',
      },
      GlobalAccount: {
         Read: 'admin:globalaccount:read',
         Write: 'admin:globalaccount:write',
      },
      Jurisdiction: {
         Read: 'admin:jurisdiction:read',
         Write: 'admin:jurisdiction:write',
         Public: {
            Read: 'admin:jurisdiction.public:read',
         },
         
      },
      JurisdictionSetting: {
         Read: 'admin:jurisdictionsetting:read',
         Write: 'admin:jurisdictionsetting:write',
      },
      JurisdictionAsset: {
         Read: 'admin:jurisdictionasset:read',
         Write: 'admin:jurisdictionasset:write',
         Info: {
            Read: 'admin:jurisdictionasset.info:read',
         },
         
         Process: {
            Write: 'admin:jurisdictionasset.process:write',
         },
         
      },
      Account: {
         Read: 'admin:account:read',
         Write: 'admin:account:write',
         Internal: {
            Read: 'admin:account.internal:read',
         },
         
         Public: {
            Read: 'admin:account.public:read',
         },
         
         Connection: {
            Read: 'admin:account.connection:read',
         },
         
         Self: {
            Read: 'admin:account.self:read',
         },
         
         Identity: {
            Read: 'admin:account.identity:read',
         },
         
         Info: {
            Write: 'admin:account.info:write',
         },
         
         Status: {
            Write: 'admin:account.status:write',
         },
         
         Permissions: {
            Write: 'admin:account.permissions:write',
         },
         
      },
      Widget: {
         Read: 'admin:widget:read',
         Write: 'admin:widget:write',
         Config: {
            Write: 'admin:widget.config:write',
         },
         
      },
      
   }
} as const;