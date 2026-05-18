import apiService from '@/stencil/apiService';
import { IJurisdiction} from '@/stencil/models/entities/jurisdiction';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListInputJurisdiction } from '@/stencil/models/entities/requests/list-input-jurisdiction';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';
import { IJurisdiction_Public } from '@/stencil/models/entities/jurisdiction';

export const addTagTypes = ['jurisdiction', 'jurisdictions'] as const;

const JurisdictionsApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         getJurisdictions: build.query<ListResult<IJurisdiction>, ListInputJurisdiction>({
            query: params => ({ 
               url: `admin/jurisdiction/find`,
               method: 'GET',
               params: params
            }),
            providesTags: ['jurisdictions']
         }),
			getJurisdiction: build.query<ItemResult<IJurisdiction>, string>({
				query: params => ({ 
					url: `admin/jurisdiction/${params}`,
					method: 'GET'
				}),
				providesTags: ['jurisdiction']
			}),
			deleteJurisdiction: build.mutation<ActionResult, string>({
				query: (params) => ({
					url: `admin/jurisdiction/${params}`,
					method: 'DELETE'
				}),
				invalidatesTags: ['jurisdiction', 'jurisdictions']
			}),
			createJurisdiction: build.mutation<ItemResult<IJurisdiction>, IJurisdiction>({
				query: (jurisdiction) => {
					return {
						url: `admin/jurisdiction`,
						method: 'POST',
						data: jurisdiction
					};
				},
				invalidatesTags: ['jurisdiction', 'jurisdictions']
			}),replaceJurisdiction: build.mutation<ItemResult<IJurisdiction>, IJurisdiction>({
				query: (jurisdiction) => ({
					url: `admin/jurisdiction/${jurisdiction._id}`,
					method: 'PUT',
					data: jurisdiction
				}),
				invalidatesTags: ['jurisdiction','jurisdictions']
			})
		}),
		overrideExisting: false
	});

export default JurisdictionsApi;

export const {
	useGetJurisdictionsQuery,
	useGetJurisdictionQuery,
	useDeleteJurisdictionMutation,
	useCreateJurisdictionMutation,useReplaceJurisdictionMutation,
	endpoints: jurisdictionEndpoints
} = JurisdictionsApi;

export type JurisdictionsApiType = {
	[JurisdictionsApi.reducerPath]: ReturnType<typeof JurisdictionsApi.reducer>;
};