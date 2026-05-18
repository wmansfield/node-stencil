import apiService from '@/stencil/apiService';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';


import { IAvatarRequest } from '@/stencil/models/features/user/profile/avatarrequest';

import { INameRequest } from '@/stencil/models/features/user/profile/namerequest';

import { IAccount_Self } from '@/stencil/models/entities/account';

export const addTagTypes = [] as const;

const profileApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         nameUpdate: build.mutation<ItemResult<IAccount_Self>, INameRequest >({
            query: (params: INameRequest) => ({
					url: `v1/profile/name`,
					method: 'POST',
					data: params
				}),
				invalidatesTags: []
			}),

         avatarUpdate: build.mutation<ItemResult<IAccount_Self>, IAvatarRequest >({
            query: (params: IAvatarRequest) => ({
					url: `v1/profile/avatar`,
					method: 'POST',
					data: params
				}),
				invalidatesTags: []
			}),

         
		}),
		overrideExisting: false
	});

export default profileApi;

export const {
   useNameUpdateMutation,
   useAvatarUpdateMutation,
	endpoints: profileEndpoints
} = profileApi;


export type profileApiType = {
	[profileApi.reducerPath]: ReturnType<typeof profileApi.reducer>;
};