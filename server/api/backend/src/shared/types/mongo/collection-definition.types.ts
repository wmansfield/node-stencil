import { Binary } from 'mongodb';
import { Schema } from 'mongoose';

export type EncryptedField = {
   path: string;
   bsonType: string;
   keyId?: Binary;
};

export type CollectionDefinition = {
   name: string;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   schema: Schema<any>;
   encryptedFields?: EncryptedField[];
};
