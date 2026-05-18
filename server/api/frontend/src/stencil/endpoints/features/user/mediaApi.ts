import apiService from '@/stencil/apiService';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';


import { IUploadInfo } from '@/stencil/models/features/user/media/uploadinfo';

import { IRoutedPreSignedUrl } from '@/stencil/models/features/user/media/routedpresignedurl';

import { IPreSignedUrl } from '@/stencil/models/entities/presignedurl';

import { IJurisdictionAsset_Info } from '@/stencil/models/entities/jurisdictionasset';

export const addTagTypes = [] as const;

const mediaApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         uploadPrepare: build.mutation<ItemResult<IPreSignedUrl>, IUploadInfo >({
            query: (params: IUploadInfo) => ({
					url: `v1/media/${params.jurisdiction_id}/prepare`,
					method: 'POST',
					data: params
				}),
				invalidatesTags: []
			}),

         uploadComplete: build.mutation<ItemResult<IJurisdictionAsset_Info>, IRoutedPreSignedUrl >({
            query: (params: IRoutedPreSignedUrl) => ({
					url: `v1/media/${params.jurisdiction_id}/complete`,
					method: 'POST',
					data: params
				}),
				invalidatesTags: []
			}),

         
		}),
		overrideExisting: false
	});

export default mediaApi;

export const {
   useUploadPrepareMutation,
   useUploadCompleteMutation,
	endpoints: mediaEndpoints
} = mediaApi;


export type mediaApiType = {
	[mediaApi.reducerPath]: ReturnType<typeof mediaApi.reducer>;
};