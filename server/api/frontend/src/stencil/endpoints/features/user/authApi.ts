import apiService from '@/stencil/apiService';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';


import { IRegisterRequest } from '@/stencil/models/features/user/auth/registerrequest';

import { IAccount_Self } from '@/stencil/models/entities/account';

import { IJurisdictionAsset_Info } from '@/stencil/models/entities/jurisdictionasset';

export const addTagTypes = [] as const;

const authApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         getSelf: build.mutation<ItemResult<IAccount_Self>, string >({
            query: (auth_token: string) => ({
					url: `v1/auth/self`,
					method: 'POST',
               headers: { Authorization: `Bearer ${auth_token}`, }
				}),
				invalidatesTags: []
			}),

         register: build.mutation<ItemResult<IAccount_Self>, IRegisterRequest >({
            query: (params: IRegisterRequest) => ({
					url: `v1/auth/register`,
					method: 'POST',
					data: params,
               headers: { Authorization: `Bearer ${params.auth_token}`,'x-jurisdiction': params.jurisdiction,  }
				}),
				invalidatesTags: []
			}),

         
		}),
		overrideExisting: false
	});

export default authApi;

export const {
   useGetSelfMutation,
   useRegisterMutation,
	endpoints: authEndpoints
} = authApi;


export type authApiType = {
	[authApi.reducerPath]: ReturnType<typeof authApi.reducer>;
};