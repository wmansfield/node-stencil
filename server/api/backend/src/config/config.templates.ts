export const ConfigTemplates = {
   // Primary Authority Source (override root)
   AuthorityAwsSecretsRegion: (authority: string) => `${authority.toUpperCase()}_AUTHORITY_AWS_SECRETS_REGION`,
   AuthorityAwsSecretsPrefix: (authority: string) => `${authority.toUpperCase()}_AUTHORITY_AWS_SECRETS_PREFIX`,

   Authority: (tenant: string) => `${tenant.toUpperCase()}_AUTHORITY`,

   // Mongo Database Configuration Templates
   MongoUri: (tenant: string) => `${tenant.toUpperCase()}_MONGO_URI`,
   MongoDatabase: (tenant: string) => `${tenant.toUpperCase()}_MONGO_DATABASE`,
   MongoMaxPoolSize: (tenant: string) => `${tenant.toUpperCase()}_MONGO_MAX_POOL_SIZE`,
   MongoMinPoolSize: (tenant: string) => `${tenant.toUpperCase()}_MONGO_MIN_POOL_SIZE`,
   KmsProvider: (tenant: string) => `${tenant.toUpperCase()}_KMS_PROVIDER`,
   AwsAccessKeyId: (tenant: string) => `${tenant.toUpperCase()}_AWS_ACCESS_KEY_ID`,
   AwsAccessKeySecret: (tenant: string) => `${tenant.toUpperCase()}_AWS_ACCESS_KEY_SECRET`,
   AwsAccessKeySessionToken: (tenant: string) => `${tenant.toUpperCase()}_AWS_ACCESS_SESSION_TOKEN`,
   AwsKmsRegion: (tenant: string) => `${tenant.toUpperCase()}_AWS_KMS_REGION`,
   AwsKmsArn: (tenant: string) => `${tenant.toUpperCase()}_AWS_KMS_ARN`,
   AwsKmsArnCustodian: (tenant: string) => `${tenant.toUpperCase()}_AWS_KMS_ARN_CUSTODIAN`,

   // Azure KMS Configuration Templates
   AzureTenantId: (tenant: string) => `${tenant.toUpperCase()}_AZURE_TENANT_ID`,
   AzureClientId: (tenant: string) => `${tenant.toUpperCase()}_AZURE_CLIENT_ID`,
   AzureClientSecret: (tenant: string) => `${tenant.toUpperCase()}_AZURE_CLIENT_SECRET`,
   AzureKeyVaultEndpoint: (tenant: string) => `${tenant.toUpperCase()}_AZURE_KEY_VAULT_ENDPOINT`,
   AzureQueryableKeyName: (tenant: string) => `${tenant.toUpperCase()}_AZURE_QUERYABLE_KEY_NAME`,
   AzureCustodianKeyName: (tenant: string) => `${tenant.toUpperCase()}_AZURE_CUSTODIAN_KEY_NAME`,

   // Firebase Configuration Templates
   FirebaseProjectId: () => 'FIREBASE_PROJECT_ID',
   FirebasePrivateKey: () => 'FIREBASE_PRIVATE_KEY',
   FirebaseClientEmail: () => 'FIREBASE_CLIENT_EMAIL',

   EncryptionDatabase: () => 'ENCRYPTION_DATABASE',
   EncryptionCollection: () => 'ENCRYPTION_COLLECTION',

   // Storage Configuration Templates
   StorageMaxFileSize: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_MAX_FILE_SIZE`,
   StorageAllowedContentTypes: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_ALLOWED_CONTENT_TYPES`,
   StorageAllowedFileExtensions: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_ALLOWED_FILE_EXTENSIONS`,
   StorageProvider: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_PROVIDER`,

   // Azure Storage Configuration
   StorageAzureAccountName: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AZURE_ACCOUNT_NAME`,
   StorageAzureAccountKey: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AZURE_ACCOUNT_KEY`,
   StorageAzureContainerName: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AZURE_CONTAINER_NAME`,
   StorageAzureCustomDomain: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AZURE_CUSTOM_DOMAIN`,

   // AWS S3 Storage Configuration
   StorageAwsAccessKeyId: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AWS_ACCESS_KEY_ID`,
   StorageAwsAccessKeySecret: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AWS_ACCESS_KEY_SECRET`,
   StorageAwsRegion: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AWS_REGION`,
   StorageAwsBucketName: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AWS_BUCKET_NAME`,
   StorageAwsCloudFrontDomain: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AWS_CLOUDFRONT_DOMAIN`,
   StorageAwsCloudFrontKeyPairId: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AWS_CLOUDFRONT_KEY_PAIR_ID`,
   StorageAwsCloudFrontPrivateKey: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_AWS_CLOUDFRONT_PRIVATE_KEY`,

   // Google Cloud Storage Configuration
   StorageGcsProjectId: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_GCS_PROJECT_ID`,
   StorageGcsPrivateKey: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_GCS_PRIVATE_KEY`,
   StorageGcsClientEmail: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_GCS_CLIENT_EMAIL`,
   StorageGcsBucketName: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_GCS_BUCKET_NAME`,
   StorageGcsCustomDomain: (tenant: string) => `${tenant.toUpperCase()}_STORAGE_GCS_CUSTOM_DOMAIN`,

   // Rate limiting (Redis URL; e.g. redis://localhost:6379 or rediss:// for TLS)
   RedisUrl: () => 'REDIS_URL',

   // Federation (cross-jurisdiction HTTPS)
   FederationJurisdiction: () => 'FEDERATION_JURISDICTION',
   FederationEndpoints: () => 'FEDERATION_ENDPOINTS',
   FederationDevToken: () => 'FEDERATION_DEV_TOKEN',
   FederationTimeoutMs: () => 'FEDERATION_TIMEOUT_MS',

   // Public URLs
   PublicApiBaseUrl: () => 'PUBLIC_API_BASE_URL',
   PublicWebBaseUrl: () => 'PUBLIC_WEB_BASE_URL',
};
