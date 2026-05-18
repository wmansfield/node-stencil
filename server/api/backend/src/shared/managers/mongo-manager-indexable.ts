export interface IMongoManagerIndexable {
   ensureIndexes(): Promise<void>;
}

export interface IMongoManagerIndexableIsolated {
   ensureIndexes(route: string): Promise<void>;
}
