import { Binary } from 'bson';

export type EncryptedField = {
   path: string;
   bsonType: string;
   keyId?: Binary;
   keyAltName?: string;
   queries?: {
      queryType: 'equality' | 'range';
   };
};

export type EncryptedFieldsMap = {
   [collectionNamespace: string]: {
      fields: EncryptedField[];
   };
};
