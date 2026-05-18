import { IConfigSource } from './config.types';

export class EnvironmentConfigSource implements IConfigSource {
   public readonly name = 'environment';

   async getValue(key: string): Promise<string | undefined> {
      const result = process.env[key];
      if (result && result.trim().length > 0) {
         return result.trim();
      }
      return undefined;
   }
}
