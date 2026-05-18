import apiService from '@/stencil/apiService';
import { IGlobalSetting} from '@/stencil/models/entities/globalsetting';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListInputGlobalSetting } from '@/stencil/models/entities/requests/list-input-globalsetting';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';

export const addTagTypes = ['globalsetting', 'globalsettings'] as const;

const GlobalSettingsApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         getGlobalSettings: build.query<ListResult<IGlobalSetting>, ListInputGlobalSetting>({
            query: params => ({ 
               url: `admin/globalsetting/find`,
               method: 'GET',
               params: params
            }),
            providesTags: ['globalsettings']
         }),
			getGlobalSetting: build.query<ItemResult<IGlobalSetting>, string>({
				query: params => ({ 
					url: `admin/globalsetting/${params}`,
					method: 'GET'
				}),
				providesTags: ['globalsetting']
			}),
			deleteGlobalSetting: build.mutation<ActionResult, string>({
				query: (params) => ({
					url: `admin/globalsetting/${params}`,
					method: 'DELETE'
				}),
				invalidatesTags: ['globalsetting', 'globalsettings']
			}),
			createGlobalSetting: build.mutation<ItemResult<IGlobalSetting>, IGlobalSetting>({
				query: (globalsetting) => {
					return {
						url: `admin/globalsetting`,
						method: 'POST',
						data: globalsetting
					};
				},
				invalidatesTags: ['globalsetting', 'globalsettings']
			}),replaceGlobalSetting: build.mutation<ItemResult<IGlobalSetting>, IGlobalSetting>({
				query: (globalsetting) => ({
					url: `admin/globalsetting/${globalsetting._id}`,
					method: 'PUT',
					data: globalsetting
				}),
				invalidatesTags: ['globalsetting','globalsettings']
			})
		}),
		overrideExisting: false
	});

export default GlobalSettingsApi;

export const {
	useGetGlobalSettingsQuery,
	useGetGlobalSettingQuery,
	useDeleteGlobalSettingMutation,
	useCreateGlobalSettingMutation,useReplaceGlobalSettingMutation,
	endpoints: globalsettingEndpoints
} = GlobalSettingsApi;

export type GlobalSettingsApiType = {
	[GlobalSettingsApi.reducerPath]: ReturnType<typeof GlobalSettingsApi.reducer>;
};