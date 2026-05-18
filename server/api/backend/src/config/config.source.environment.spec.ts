import { EnvironmentConfigSource } from './config.source.environment';

describe('EnvironmentConfigSource', () => {
   let configSource: EnvironmentConfigSource;

   beforeEach(() => {
      configSource = new EnvironmentConfigSource();
   });

   it.only('should return a value from env', async () => {
      // set a real value
      const fakeKey = Math.random().toString(36).substring(2, 15);
      const fakeValue = Math.random().toString(36).substring(2, 15);
      process.env[fakeKey] = fakeValue;

      const value = await configSource.getValue(fakeKey);
      expect(value).toBeDefined();
      expect(value).toBe(fakeValue);
   });

   it.only('should return undefined instead of empty string', async () => {
      // set a real value
      const fakeKey = Math.random().toString(36).substring(2, 15);

      // set a blank value
      process.env[fakeKey] = '';
      let value = await configSource.getValue('random');
      expect(value).toBeUndefined();

      // set a space value
      process.env[fakeKey] = ' ';
      value = await configSource.getValue('random');
      expect(value).toBeUndefined();
   });
});
