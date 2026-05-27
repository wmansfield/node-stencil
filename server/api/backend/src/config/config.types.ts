export interface IConfigSource {
   name: string;
   getValue(key: string): Promise<string | undefined>;
}

export interface MongoConfig {
   uri: string;
   database: string;
   maxPoolSize?: number;
   minPoolSize?: number;
   kms_aws?: KMSAwsConfig;
   kms_azure?: KMSAzureConfig;
}
export interface KMSAwsConfig {
   accessKeyId: string;
   secretAccessKey: string;
   sessionToken?: string;
   kmsRegion: string;
   kmsArn: string;
   kmsArnCustodian: string;
}
export interface KMSAzureConfig {
   tenantId: string;
   clientId: string;
   clientSecret: string;
   keyVaultEndpoint: string;
   keyNameQueryable: string;
   keyNameCustodian: string;
}

export interface TenantConfig {
   tenant_code: string;
   mongo?: MongoConfig;
   attempted: boolean;
}
