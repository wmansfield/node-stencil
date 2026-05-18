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

import { IJurisdictionSetting } from '@/stencil/models/entities/jurisdictionsetting';
import { jurisdictionsettingEndpoints, useGetJurisdictionSettingsQuery } from '@/stencil/endpoints/entities/jurisdictionSettingApi';
import { ListInputJurisdictionSetting } from '@/stencil/models/entities/requests/list-input-jurisdictionsetting';
import JurisdictionSettingEditor from './JurisdictionSettingEditor';
import { RoutedInput } from '@/stencil/models/routed-input';

import { Link, useNavigate, useParams } from 'react-router';

type JurisdictionSettingListProps = Meta & {
   expands?: boolean;
}
function JurisdictionSettingList(props: JurisdictionSettingListProps) {
	const { expands = true } = props;
   const routeParams = useParams();
	const { jurisdiction_id } = routeParams;
   
   const dispatch = useAppDispatch();
   const navigate = useNavigate();
	const [apiRequest, setApiRequest] = useState<RoutedInput<ListInputJurisdictionSetting>>(() => {
      return {
         jurisdiction_id: jurisdiction_id!,
         input: {
            skip: 0,
            take: 10,
            order_by: undefined,
            descending: false,
            keyword: undefined
         }
      };
   });

	const [tablePagingData, setTablePagingData] = useState<DataTablePagingData>({
		total: 0,
		pageIndex: 1,
		pageSize: 10,
	});
	
	const jurisdictionsettings = useGetJurisdictionSettingsQuery({...apiRequest}, { refetchOnMountOrArgChange: true });

   const performSearch = (value: string) => {
      setApiRequest(prev => ({
         ...prev,
         input: { 
            ...prev.input, 
            keyword: value,
            skip: 0 
         },
      }));
   }
   const debounceSearch = useDebounce((performSearch), 500)

	const handleRefresh = useCallback(() => {
      const request = {
         ...apiRequest,
         input: { 
            ...apiRequest.input, 
            skip: 0
         },
      };
      dispatch(jurisdictionsettingEndpoints.getJurisdictionSettings.initiate(request, { forceRefetch: true }));
   }, []);

   const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      debounceSearch(e.target.value)
   }, []);

   const handleSort = useCallback((sort: OnSortParam): void => {
      if (!!sort) {
         setApiRequest(prev => ({ 
            ...prev,
            input: { 
               ...prev.input, 
               order_by: sort.key.toString(), 
               descending: sort.order == 'desc'
            },
         }));
      }
   }, []);

   const handlePaginationChange = useCallback((page_number: number) => {
      setApiRequest(prev => ({
         ...prev,
         input: { 
            ...prev.input,
            skip: (page_number - 1) * prev.input.take 
         },
         
      }));
   }, []);

   const handleSelectChange = useCallback((num: number) => {
      setApiRequest(prev => ({
         ...prev,
         input: {
            ...prev.input,
            skip: 0,
            take: num,
         },
         
      }));
      setTablePagingData(prev => ({ 
         ...prev, 
         pageSize: num // leave page number, wait for new data to return
      }));
   }, []);

   
	
   useEffect(() => {
      const paging = jurisdictionsettings?.data?.paging;
      if (paging) {
         setTablePagingData({
            total: paging.total_pages * paging.page_size,
            pageIndex: paging.current_page,
            pageSize: paging.page_size,
         });
      }
   }, [jurisdictionsettings?.data?.paging]);


	const columns = useMemo<ColumnDef<IJurisdictionSetting>[]>(
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
            cell: props => <JurisdictionSettingEditor is_create={false} _id={props.row.original._id} jurisdiction_id={jurisdiction_id!}/>,
         }
         
		],
		[]
	);

	

	return (
      <AdaptiveCard className={classNames(expands && 'h-full')}  bodyClass={classNames(expands && 'h-full')}>
         <div className={classNames(expands && 'h-full', 'flex flex-col gap-4')}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3>Jurisdiction Settings</h3>
                  <JurisdictionSettingEditor is_create={true} jurisdiction_id={jurisdiction_id!}/>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
               <Input
                  placeholder="Search"
                  prefix={<TbSearch className="text-lg" />}
                  onChange={handleSearchChange}
               />
               <Button variant="plain" icon={<Loading type="refreshing" loading={jurisdictionsettings.isFetching && !!jurisdictionsettings?.data?.items} />} onClick={handleRefresh} />
            </div>
            <DataTable
               columns={columns}
               expands={expands}
               data={jurisdictionsettings?.data?.items || []}
               loading={jurisdictionsettings.isLoading}
               fetching={jurisdictionsettings.isFetching}
               pagingData={tablePagingData}
               onPaginationChange={handlePaginationChange}
               onSelectChange={handleSelectChange}
               onSort={handleSort}
            />
         </div>
      </AdaptiveCard>
	);
}

export default JurisdictionSettingList;