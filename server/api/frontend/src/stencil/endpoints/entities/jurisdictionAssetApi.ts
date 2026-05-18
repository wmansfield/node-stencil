import apiService from '@/stencil/apiService';
import { IJurisdictionAsset} from '@/stencil/models/entities/jurisdictionasset';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListInputJurisdictionAsset } from '@/stencil/models/entities/requests/list-input-jurisdictionasset';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';
import { IJurisdictionAsset_Info } from '@/stencil/models/entities/jurisdictionasset';

export const addTagTypes = ['jurisdictionasset', 'jurisdictionassets'] as const;

const JurisdictionAssetsApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         getJurisdictionAssets: build.query<ListResult<IJurisdictionAsset>, RoutedInput<ListInputJurisdictionAsset>>({
            query: params => ({ 
               url: `admin/${params.jurisdiction_id}/jurisdictionasset/find`,
               method: 'GET',
               params: params.input
            }),
            providesTags: ['jurisdictionassets']
         }),
			getJurisdictionAsset: build.query<ItemResult<IJurisdictionAsset>, RoutedInput<string>>({
				query: params => ({ 
					url: `admin/${params.jurisdiction_id}/jurisdictionasset/${params.input}`,
					method: 'GET'
				}),
				providesTags: ['jurisdictionasset']
			}),
			getJurisdictionAssetInfo: build.query<ItemResult<IJurisdictionAsset_Info>, RoutedInput<string>>({
				query: (params) => ({ 
					url: `admin/${params.jurisdiction_id}/jurisdictionasset/${params.input}/info`,
          			method: 'GET',
				}),
				providesTags: ['jurisdictionasset']
			}),
			deleteJurisdictionAsset: build.mutation<ActionResult, RoutedInput<string>>({
				query: (params) => ({
					url: `admin/${params.jurisdiction_id}/jurisdictionasset/${params.input}`,
					method: 'DELETE'
				}),
				invalidatesTags: ['jurisdictionasset', 'jurisdictionassets']
			}),
			createJurisdictionAsset: build.mutation<ItemResult<IJurisdictionAsset>, IJurisdictionAsset>({
				query: (jurisdictionasset) => {
					return {
						url: `admin/${jurisdictionasset.jurisdiction_id}/jurisdictionasset`,
						method: 'POST',
						data: jurisdictionasset
					};
				},
				invalidatesTags: ['jurisdictionasset', 'jurisdictionassets']
			}),replaceJurisdictionAsset: build.mutation<ItemResult<IJurisdictionAsset>, IJurisdictionAsset>({
				query: (jurisdictionasset) => ({
					url: `admin/${jurisdictionasset.jurisdiction_id}/jurisdictionasset/${jurisdictionasset._id}`,
					method: 'PUT',
					data: jurisdictionasset
				}),
				invalidatesTags: ['jurisdictionasset','jurisdictionassets']
			})
		}),
		overrideExisting: false
	});

export default JurisdictionAssetsApi;

export const {
	useGetJurisdictionAssetsQuery,
	useGetJurisdictionAssetInfoQuery,
	useGetJurisdictionAssetQuery,
	useDeleteJurisdictionAssetMutation,
	useCreateJurisdictionAssetMutation,useReplaceJurisdictionAssetMutation,
	endpoints: jurisdictionassetEndpoints
} = JurisdictionAssetsApi;

export type JurisdictionAssetsApiType = {
	[JurisdictionAssetsApi.reducerPath]: ReturnType<typeof JurisdictionAssetsApi.reducer>;
};