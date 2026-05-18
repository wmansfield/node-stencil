import apiService from '@/stencil/apiService';
import { IGlobalAccount} from '@/stencil/models/entities/globalaccount';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListInputGlobalAccount } from '@/stencil/models/entities/requests/list-input-globalaccount';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';

export const addTagTypes = ['globalaccount', 'globalaccounts'] as const;

const GlobalAccountsApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         getGlobalAccounts: build.query<ListResult<IGlobalAccount>, ListInputGlobalAccount>({
            query: params => ({ 
               url: `admin/globalaccount/find`,
               method: 'GET',
               params: params
            }),
            providesTags: ['globalaccounts']
         }),
			getGlobalAccount: build.query<ItemResult<IGlobalAccount>, string>({
				query: params => ({ 
					url: `admin/globalaccount/${params}`,
					method: 'GET'
				}),
				providesTags: ['globalaccount']
			}),
			deleteGlobalAccount: build.mutation<ActionResult, string>({
				query: (params) => ({
					url: `admin/globalaccount/${params}`,
					method: 'DELETE'
				}),
				invalidatesTags: ['globalaccount', 'globalaccounts']
			}),
			createGlobalAccount: build.mutation<ItemResult<IGlobalAccount>, IGlobalAccount>({
				query: (globalaccount) => {
					return {
						url: `admin/globalaccount`,
						method: 'POST',
						data: globalaccount
					};
				},
				invalidatesTags: ['globalaccount', 'globalaccounts']
			}),replaceGlobalAccount: build.mutation<ItemResult<IGlobalAccount>, IGlobalAccount>({
				query: (globalaccount) => ({
					url: `admin/globalaccount/${globalaccount._id}`,
					method: 'PUT',
					data: globalaccount
				}),
				invalidatesTags: ['globalaccount','globalaccounts']
			})
		}),
		overrideExisting: false
	});

export default GlobalAccountsApi;

export const {
	useGetGlobalAccountsQuery,
	useGetGlobalAccountQuery,
	useDeleteGlobalAccountMutation,
	useCreateGlobalAccountMutation,useReplaceGlobalAccountMutation,
	endpoints: globalaccountEndpoints
} = GlobalAccountsApi;

export type GlobalAccountsApiType = {
	[GlobalAccountsApi.reducerPath]: ReturnType<typeof GlobalAccountsApi.reducer>;
};