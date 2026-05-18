import apiService from '@/stencil/apiService';
import { IAccount} from '@/stencil/models/entities/account';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListInputAccount } from '@/stencil/models/entities/requests/list-input-account';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';
import { IAccount_Internal } from '@/stencil/models/entities/account';
import { IAccount_Public } from '@/stencil/models/entities/account';
import { IAccount_Connection } from '@/stencil/models/entities/account';
import { IAccount_Self } from '@/stencil/models/entities/account';
import { IAccount_Identity } from '@/stencil/models/entities/account';

export const addTagTypes = ['account', 'accounts'] as const;

const AccountsApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         getAccounts: build.query<ListResult<IAccount>, RoutedInput<ListInputAccount>>({
            query: params => ({ 
               url: `admin/${params.jurisdiction_id}/account/find`,
               method: 'GET',
               params: params.input
            }),
            providesTags: ['accounts']
         }),
			getAccount: build.query<ItemResult<IAccount>, RoutedInput<string>>({
				query: params => ({ 
					url: `admin/${params.jurisdiction_id}/account/${params.input}`,
					method: 'GET'
				}),
				providesTags: ['account']
			}),
			getAccountInternal: build.query<ItemResult<IAccount_Internal>, RoutedInput<string>>({
				query: (params) => ({ 
					url: `admin/${params.jurisdiction_id}/account/${params.input}/internal`,
          			method: 'GET',
				}),
				providesTags: ['account']
			}),
			getAccountPublic: build.query<ItemResult<IAccount_Public>, RoutedInput<string>>({
				query: (params) => ({ 
					url: `admin/${params.jurisdiction_id}/account/${params.input}/public`,
          			method: 'GET',
				}),
				providesTags: ['account']
			}),
			getAccountConnection: build.query<ItemResult<IAccount_Connection>, RoutedInput<string>>({
				query: (params) => ({ 
					url: `admin/${params.jurisdiction_id}/account/${params.input}/connection`,
          			method: 'GET',
				}),
				providesTags: ['account']
			}),
			deleteAccount: build.mutation<ActionResult, RoutedInput<string>>({
				query: (params) => ({
					url: `admin/${params.jurisdiction_id}/account/${params.input}`,
					method: 'DELETE'
				}),
				invalidatesTags: ['account', 'accounts']
			}),
			createAccount: build.mutation<ItemResult<IAccount>, IAccount>({
				query: (account) => {
					return {
						url: `admin/${account.jurisdiction_id}/account`,
						method: 'POST',
						data: account
					};
				},
				invalidatesTags: ['account', 'accounts']
			}),replaceAccount: build.mutation<ItemResult<IAccount>, IAccount>({
				query: (account) => ({
					url: `admin/${account.jurisdiction_id}/account/${account._id}`,
					method: 'PUT',
					data: account
				}),
				invalidatesTags: ['account','accounts']
			})
		}),
		overrideExisting: false
	});

export default AccountsApi;

export const {
	useGetAccountsQuery,
	useGetAccountInternalQuery,
	useGetAccountPublicQuery,
	useGetAccountConnectionQuery,
	useGetAccountQuery,
	useDeleteAccountMutation,
	useCreateAccountMutation,useReplaceAccountMutation,
	endpoints: accountEndpoints
} = AccountsApi;

export type AccountsApiType = {
	[AccountsApi.reducerPath]: ReturnType<typeof AccountsApi.reducer>;
};