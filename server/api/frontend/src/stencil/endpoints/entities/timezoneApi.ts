import apiService from '@/stencil/apiService';
import { ITimezone} from '@/stencil/models/entities/timezone';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListInputTimezone } from '@/stencil/models/entities/requests/list-input-timezone';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';
import { ITimezone_Public } from '@/stencil/models/entities/timezone';

export const addTagTypes = ['timezone', 'timezones'] as const;

const TimezonesApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         getTimezones: build.query<ListResult<ITimezone>, ListInputTimezone>({
            query: params => ({ 
               url: `admin/timezone/find`,
               method: 'GET',
               params: params
            }),
            providesTags: ['timezones']
         }),
			getTimezone: build.query<ItemResult<ITimezone>, string>({
				query: params => ({ 
					url: `admin/timezone/${params}`,
					method: 'GET'
				}),
				providesTags: ['timezone']
			}),
			deleteTimezone: build.mutation<ActionResult, string>({
				query: (params) => ({
					url: `admin/timezone/${params}`,
					method: 'DELETE'
				}),
				invalidatesTags: ['timezone', 'timezones']
			}),
			createTimezone: build.mutation<ItemResult<ITimezone>, ITimezone>({
				query: (timezone) => {
					return {
						url: `admin/timezone`,
						method: 'POST',
						data: timezone
					};
				},
				invalidatesTags: ['timezone', 'timezones']
			}),replaceTimezone: build.mutation<ItemResult<ITimezone>, ITimezone>({
				query: (timezone) => ({
					url: `admin/timezone/${timezone._id}`,
					method: 'PUT',
					data: timezone
				}),
				invalidatesTags: ['timezone','timezones']
			})
		}),
		overrideExisting: false
	});

export default TimezonesApi;

export const {
	useGetTimezonesQuery,
	useGetTimezoneQuery,
	useDeleteTimezoneMutation,
	useCreateTimezoneMutation,useReplaceTimezoneMutation,
	endpoints: timezoneEndpoints
} = TimezonesApi;

export type TimezonesApiType = {
	[TimezonesApi.reducerPath]: ReturnType<typeof TimezonesApi.reducer>;
};