import apiService from '@/stencil/apiService';
import { ItemResult, ItemResultMeta } from '@/stencil/models/item-result';
import { ActionResult } from '@/stencil/models/action-result';
import { ListInput } from '@/stencil/models/list-input';
import { ListResult, ListResultMeta } from '@/stencil/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/stencil/models/routed-input';


import { IWidgetReadRequest } from '@/stencil/models/features/user/widget/widgetreadrequest';

import { IWidget_Public } from '@/stencil/models/entities/widget';

export const addTagTypes = [] as const;

const widgetApi = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build => ({
         get: build.query<ItemResult<IWidget_Public>, IWidgetReadRequest>({
            query: (params: IWidgetReadRequest) => ({
               url: `v1/widgets/get`,
               method: 'POST',
               data: params
            }),
            providesTags: []
         }),
         
		}),
		overrideExisting: false
	});

export default widgetApi;

export const {
	useGetQuery,
	endpoints: widgetEndpoints
} = widgetApi;


export type widgetApiType = {
	[widgetApi.reducerPath]: ReturnType<typeof widgetApi.reducer>;
};