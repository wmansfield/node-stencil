import { Binary, Decimal128 } from 'mongodb';

export const ModelAnnotations = {
   stringToBinary: (uuid: string): Binary | undefined => {
      if (!uuid) {
         return undefined;
      }
      if (typeof uuid == 'object') {
         // may have been an instance of a guid, convert to string first
         uuid = (uuid as any).toString();
      }
      return new Binary(Buffer.from(uuid.replace(/-/g, ''), 'hex'), 4);
   },

   binaryToString: (binary: Binary): string | undefined => {
      if (!binary) {
         return undefined;
      }
      return binary?.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
   },

   stringToDecimal: (value: string): Decimal128 | undefined => {
      if (!value) {
         return undefined;
      }
      return Decimal128.fromString(value);
   },

   decimalToString: (decimal: Decimal128): string | undefined => {
      if (!decimal) {
         return undefined;
      }
      return decimal.toString();
   },

   suppress_id: {
      _id: false,
   },

   document: {
      toJSON: { getters: true },
      toObject: { getters: true },
      versionKey: false as const,
      autoIndex: false,
      autoCreate: false,
   },

   primary_key_uuid: {
      required: true,
      unique: true,
      index: true,
      type: Binary,
      get: (v: Binary) => ModelAnnotations.binaryToString(v),
      set: (v: string) => ModelAnnotations.stringToBinary(v),
   },

   uuid: {
      type: Binary,
      get: (v: Binary) => ModelAnnotations.binaryToString(v),
      set: (v: string) => ModelAnnotations.stringToBinary(v),
   },

   uuids: {
      type: [Binary],
      required: true,
      get: (arr: Binary[]) => arr.map(v => ModelAnnotations.binaryToString(v)),
      set: (arr: string[]) => arr.map(v => ModelAnnotations.stringToBinary(v)),
   },

   enum: {
      type: Number,
      get: (v: Binary) => ModelAnnotations.binaryToString(v),
      set: (v: string) => ModelAnnotations.stringToBinary(v),
   },

   decimal: {
      type: Decimal128,
      get: (v: Decimal128) => ModelAnnotations.decimalToString(v),
      set: (v: string) => ModelAnnotations.stringToDecimal(v),
   },

   decimals: {
      type: [Decimal128],
      required: true,
      get: (arr: Decimal128[]) => arr.map(v => ModelAnnotations.decimalToString(v)),
      set: (arr: string[]) => arr.map(v => ModelAnnotations.stringToDecimal(v)),
   },
};
