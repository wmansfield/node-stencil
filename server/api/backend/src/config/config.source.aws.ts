import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { IConfigSource } from './config.types';

export class AwsSecretsConfigSource implements IConfigSource {
   private client: SecretsManagerClient;

   constructor(
      public readonly name: string,
      region: string,
      private readonly secretPrefix?: string
   ) {
      this.client = new SecretsManagerClient({ region });
   }

   async getValue(key: string): Promise<string | undefined> {
      const secretId = this.secretPrefix ? `${this.secretPrefix}/${key}` : key;

      try {
         const command = new GetSecretValueCommand({ SecretId: secretId });
         const response = await this.client.send(command);

         if (response.SecretString) {
            return response.SecretString;
         }

         return undefined;
      } catch (error: any) {
         if (error.name === 'ResourceNotFoundException') {
            return undefined;
         }
         console.error(`[AWS Secrets] Error fetching "${secretId}": ${error.message}`);
         return undefined;
      }
   }
}
