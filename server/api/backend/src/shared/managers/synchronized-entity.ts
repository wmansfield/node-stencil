export interface SynchronizableEntityIsolated {
   get collectionName(): string;
   synchronizeDirtyItems: (tenant_code: string, agent_name: string, shouldStop: () => boolean) => Promise<number>;
   invalidateAll: (tenant_code: string, agent_name: string) => Promise<void>;
}
export interface SynchronizableEntityShared {
   get collectionName(): string;
   synchronizeDirtyItems: (agent_name: string, shouldStop: () => boolean) => Promise<number>;
   invalidateAll: (agent_name: string) => Promise<void>;
}
