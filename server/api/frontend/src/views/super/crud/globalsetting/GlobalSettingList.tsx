import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import DataTable, { ColumnDef, DataTablePagingData, OnSortParam} from '@/components/shared/DataTable';
import { Button, Input } from '@/components/ui';
import { TbArrowRight, TbPlus, TbSearch } from 'react-icons/tb';
import useDebounce from '@/utils/hooks/useDebounce';
import Loading from '@/components/shared/Loading';
import { AdaptiveCard } from '@/components/shared';
import classNames from 'classnames';
import { Meta } from '@/@types/routes';
import { useAppDispatch } from '@/store/rootStore';

import { IGlobalSetting } from '@/stencil/models/entities/globalsetting';
import { globalsettingEndpoints, useGetGlobalSettingsQuery } from '@/stencil/endpoints/entities/globalSettingApi';
import { ListInputGlobalSetting } from '@/stencil/models/entities/requests/list-input-globalsetting';
import GlobalSettingEditor from './GlobalSettingEditor';
import { Link, useNavigate, useParams } from 'react-router';

type GlobalSettingListProps = Meta & {
   expands?: boolean;
}
function GlobalSettingList(props: GlobalSettingListProps) {
	const { expands = true } = props;
   
   const dispatch = useAppDispatch();
   const navigate = useNavigate();
	const [apiRequest, setApiRequest] = useState<ListInputGlobalSetting>(() => {
      return {
         skip: 0,
         take: 10,
         order_by: undefined,
         descending: false,
         keyword: undefined
      };
   });

	const [tablePagingData, setTablePagingData] = useState<DataTablePagingData>({
		total: 0,
		pageIndex: 1,
		pageSize: 10,
	});
	
	const globalsettings = useGetGlobalSettingsQuery({...apiRequest}, { refetchOnMountOrArgChange: true });

   const performSearch = (value: string) => {
      setApiRequest(prev => ({
         ...prev,
         keyword: value,
         skip: 0
      }));
   }
   const debounceSearch = useDebounce((performSearch), 500)

	const handleRefresh = useCallback(() => {
      const request = {
         ...apiRequest,
         skip: 0
      };
      dispatch(globalsettingEndpoints.getGlobalSettings.initiate(request, { forceRefetch: true }));
   }, []);

   const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      debounceSearch(e.target.value)
   }, []);

   const handleSort = useCallback((sort: OnSortParam): void => {
      if (!!sort) {
         setApiRequest(prev => ({ 
            ...prev,
             order_by: sort.key.toString(), descending: sort.order == 'desc',
         }));
      }
   }, []);

   const handlePaginationChange = useCallback((page_number: number) => {
      setApiRequest(prev => ({
         ...prev,
         skip: (page_number - 1) * prev.take,
         
      }));
   }, []);

   const handleSelectChange = useCallback((num: number) => {
      setApiRequest(prev => ({
         ...prev,
         skip: 0,
         take: num,
      }));
      setTablePagingData(prev => ({ 
         ...prev, 
         pageSize: num // leave page number, wait for new data to return
      }));
   }, []);

   
	
   useEffect(() => {
      const paging = globalsettings?.data?.paging;
      if (paging) {
         setTablePagingData({
            total: paging.total_pages * paging.page_size,
            pageIndex: paging.current_page,
            pageSize: paging.page_size,
         });
      }
   }, [globalsettings?.data?.paging]);


	const columns = useMemo<ColumnDef<IGlobalSetting>[]>(
		() => [
         {
				id: 'name',
				accessorKey: 'name',
				header: 'Name',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: true
			},
      		{
				id: 'value',
				accessorKey: 'value',
				header: 'Value',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: false
			},
      		
         {
            header: '',
            id: 'action',
            cell: props => <GlobalSettingEditor is_create={false} _id={props.row.original._id} />,
         }
         
		],
		[]
	);

	

	return (
      <AdaptiveCard className={classNames(expands && 'h-full')}  bodyClass={classNames(expands && 'h-full')}>
         <div className={classNames(expands && 'h-full', 'flex flex-col gap-4')}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3>Global Settings</h3>
                  <GlobalSettingEditor is_create={true} />
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
               <Input
                  placeholder="Search"
                  prefix={<TbSearch className="text-lg" />}
                  onChange={handleSearchChange}
               />
               <Button variant="plain" icon={<Loading type="refreshing" loading={globalsettings.isFetching && !!globalsettings?.data?.items} />} onClick={handleRefresh} />
            </div>
            <DataTable
               columns={columns}
               expands={expands}
               data={globalsettings?.data?.items || []}
               loading={globalsettings.isLoading}
               fetching={globalsettings.isFetching}
               pagingData={tablePagingData}
               onPaginationChange={handlePaginationChange}
               onSelectChange={handleSelectChange}
               onSort={handleSort}
            />
         </div>
      </AdaptiveCard>
	);
}

export default GlobalSettingList;