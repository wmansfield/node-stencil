import apiService from '@/stencil/apiService';
import { IWidget} from '@/stencil/models/entities/widget';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListInputWidget } from '@/stencil/models/entities/requests/list-input-widget';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';

export const addTagTypes = ['widget', 'widgets'] as const;

const WidgetsApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         getWidgets: build.query<ListResult<IWidget>, RoutedInput<ListInputWidget>>({
            query: params => ({ 
               url: `admin/${params.jurisdiction_id}/widget/find`,
               method: 'GET',
               params: params.input
            }),
            providesTags: ['widgets']
         }),
			getWidget: build.query<ItemResult<IWidget>, RoutedInput<string>>({
				query: params => ({ 
					url: `admin/${params.jurisdiction_id}/widget/${params.input}`,
					method: 'GET'
				}),
				providesTags: ['widget']
			}),
			deleteWidget: build.mutation<ActionResult, RoutedInput<string>>({
				query: (params) => ({
					url: `admin/${params.jurisdiction_id}/widget/${params.input}`,
					method: 'DELETE'
				}),
				invalidatesTags: ['widget', 'widgets']
			}),
			createWidget: build.mutation<ItemResult<IWidget>, IWidget>({
				query: (widget) => {
					return {
						url: `admin/${widget.jurisdiction_id}/widget`,
						method: 'POST',
						data: widget
					};
				},
				invalidatesTags: ['widget', 'widgets']
			}),replaceWidget: build.mutation<ItemResult<IWidget>, IWidget>({
				query: (widget) => ({
					url: `admin/${widget.jurisdiction_id}/widget/${widget._id}`,
					method: 'PUT',
					data: widget
				}),
				invalidatesTags: ['widget','widgets']
			})
		}),
		overrideExisting: false
	});

export default WidgetsApi;

export const {
	useGetWidgetsQuery,
	useGetWidgetQuery,
	useDeleteWidgetMutation,
	useCreateWidgetMutation,useReplaceWidgetMutation,
	endpoints: widgetEndpoints
} = WidgetsApi;

export type WidgetsApiType = {
	[WidgetsApi.reducerPath]: ReturnType<typeof WidgetsApi.reducer>;
};