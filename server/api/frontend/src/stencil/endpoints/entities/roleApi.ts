import apiService from '@/stencil/apiService';
import { IRole} from '@/stencil/models/entities/role';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListInputRole } from '@/stencil/models/entities/requests/list-input-role';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';

export const addTagTypes = ['role', 'roles'] as const;

const RolesApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         getRoles: build.query<ListResult<IRole>, ListInputRole>({
            query: params => ({ 
               url: `admin/role/find`,
               method: 'GET',
               params: params
            }),
            providesTags: ['roles']
         }),
			getRole: build.query<ItemResult<IRole>, string>({
				query: params => ({ 
					url: `admin/role/${params}`,
					method: 'GET'
				}),
				providesTags: ['role']
			}),
			deleteRole: build.mutation<ActionResult, string>({
				query: (params) => ({
					url: `admin/role/${params}`,
					method: 'DELETE'
				}),
				invalidatesTags: ['role', 'roles']
			}),
			createRole: build.mutation<ItemResult<IRole>, IRole>({
				query: (role) => {
					return {
						url: `admin/role`,
						method: 'POST',
						data: role
					};
				},
				invalidatesTags: ['role', 'roles']
			}),replaceRole: build.mutation<ItemResult<IRole>, IRole>({
				query: (role) => ({
					url: `admin/role/${role._id}`,
					method: 'PUT',
					data: role
				}),
				invalidatesTags: ['role','roles']
			})
		}),
		overrideExisting: false
	});

export default RolesApi;

export const {
	useGetRolesQuery,
	useGetRoleQuery,
	useDeleteRoleMutation,
	useCreateRoleMutation,useReplaceRoleMutation,
	endpoints: roleEndpoints
} = RolesApi;

export type RolesApiType = {
	[RolesApi.reducerPath]: ReturnType<typeof RolesApi.reducer>;
};