import apiService from '@/stencil/apiService';
import { IJurisdictionSetting} from '@/stencil/models/entities/jurisdictionsetting';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListInputJurisdictionSetting } from '@/stencil/models/entities/requests/list-input-jurisdictionsetting';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';

export const addTagTypes = ['jurisdictionsetting', 'jurisdictionsettings'] as const;

const JurisdictionSettingsApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         getJurisdictionSettings: build.query<ListResult<IJurisdictionSetting>, RoutedInput<ListInputJurisdictionSetting>>({
            query: params => ({ 
               url: `admin/${params.jurisdiction_id}/jurisdictionsetting/find`,
               method: 'GET',
               params: params.input
            }),
            providesTags: ['jurisdictionsettings']
         }),
			getJurisdictionSetting: build.query<ItemResult<IJurisdictionSetting>, RoutedInput<string>>({
				query: params => ({ 
					url: `admin/${params.jurisdiction_id}/jurisdictionsetting/${params.input}`,
					method: 'GET'
				}),
				providesTags: ['jurisdictionsetting']
			}),
			deleteJurisdictionSetting: build.mutation<ActionResult, RoutedInput<string>>({
				query: (params) => ({
					url: `admin/${params.jurisdiction_id}/jurisdictionsetting/${params.input}`,
					method: 'DELETE'
				}),
				invalidatesTags: ['jurisdictionsetting', 'jurisdictionsettings']
			}),
			createJurisdictionSetting: build.mutation<ItemResult<IJurisdictionSetting>, IJurisdictionSetting>({
				query: (jurisdictionsetting) => {
					return {
						url: `admin/${jurisdictionsetting.jurisdiction_id}/jurisdictionsetting`,
						method: 'POST',
						data: jurisdictionsetting
					};
				},
				invalidatesTags: ['jurisdictionsetting', 'jurisdictionsettings']
			}),replaceJurisdictionSetting: build.mutation<ItemResult<IJurisdictionSetting>, IJurisdictionSetting>({
				query: (jurisdictionsetting) => ({
					url: `admin/${jurisdictionsetting.jurisdiction_id}/jurisdictionsetting/${jurisdictionsetting._id}`,
					method: 'PUT',
					data: jurisdictionsetting
				}),
				invalidatesTags: ['jurisdictionsetting','jurisdictionsettings']
			})
		}),
		overrideExisting: false
	});

export default JurisdictionSettingsApi;

export const {
	useGetJurisdictionSettingsQuery,
	useGetJurisdictionSettingQuery,
	useDeleteJurisdictionSettingMutation,
	useCreateJurisdictionSettingMutation,useReplaceJurisdictionSettingMutation,
	endpoints: jurisdictionsettingEndpoints
} = JurisdictionSettingsApi;

export type JurisdictionSettingsApiType = {
	[JurisdictionSettingsApi.reducerPath]: ReturnType<typeof JurisdictionSettingsApi.reducer>;
};