import apiService from '@/stencil/apiService';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';


export const addTagTypes = [] as const;

const TaskApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         triggerInvalidateEverything: build.mutation<ActionResult, void >({
            query: () => ({
					url: `platform/tasks/invalidateall`,
					method: 'POST'
				}),
				invalidatesTags: []
			}),

         triggerSynchronization: build.mutation<ActionResult, void >({
            query: () => ({
					url: `platform/tasks/synchronization`,
					method: 'POST'
				}),
				invalidatesTags: []
			}),

         triggerIndexSync: build.mutation<ActionResult, void >({
            query: () => ({
					url: `platform/tasks/indexer`,
					method: 'POST'
				}),
				invalidatesTags: []
			}),

         triggerImageResize: build.mutation<ActionResult, void >({
            query: () => ({
					url: `platform/tasks/image-resize`,
					method: 'POST'
				}),
				invalidatesTags: []
			}),

         triggerRoleSync: build.mutation<ActionResult, void >({
            query: () => ({
					url: `platform/tasks/role-sync`,
					method: 'POST'
				}),
				invalidatesTags: []
			}),

         
		}),
		overrideExisting: false
	});

export default TaskApi;

export const {
   useTriggerInvalidateEverythingMutation,
   useTriggerSynchronizationMutation,
   useTriggerIndexSyncMutation,
   useTriggerImageResizeMutation,
   useTriggerRoleSyncMutation,
	endpoints: taskEndpoints
} = TaskApi;


export type TaskApiType = {
	[TaskApi.reducerPath]: ReturnType<typeof TaskApi.reducer>;
};