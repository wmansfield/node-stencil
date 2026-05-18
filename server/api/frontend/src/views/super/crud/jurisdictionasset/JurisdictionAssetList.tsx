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

import { IJurisdictionAsset } from '@/stencil/models/entities/jurisdictionasset';
import { jurisdictionassetEndpoints, useGetJurisdictionAssetsQuery } from '@/stencil/endpoints/entities/jurisdictionAssetApi';
import { ListInputJurisdictionAsset } from '@/stencil/models/entities/requests/list-input-jurisdictionasset';
import JurisdictionAssetEditor from './JurisdictionAssetEditor';
import { AssetKind } from '@/stencil/models/entities/assetkind';
import { AssetDependency } from '@/stencil/models/entities/assetdependency';
import { RoutedInput } from '@/stencil/models/routed-input';

import { Link, useNavigate, useParams } from 'react-router';

type JurisdictionAssetListProps = Meta & {
   expands?: boolean;
}
function JurisdictionAssetList(props: JurisdictionAssetListProps) {
	const { expands = true } = props;
   const routeParams = useParams();
	const { jurisdiction_id } = routeParams;
   
   const dispatch = useAppDispatch();
   const navigate = useNavigate();
	const [apiRequest, setApiRequest] = useState<RoutedInput<ListInputJurisdictionAsset>>(() => {
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
	
	const jurisdictionassets = useGetJurisdictionAssetsQuery({...apiRequest}, { refetchOnMountOrArgChange: true });

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
      dispatch(jurisdictionassetEndpoints.getJurisdictionAssets.initiate(request, { forceRefetch: true }));
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
      const paging = jurisdictionassets?.data?.paging;
      if (paging) {
         setTablePagingData({
            total: paging.total_pages * paging.page_size,
            pageIndex: paging.current_page,
            pageSize: paging.page_size,
         });
      }
   }, [jurisdictionassets?.data?.paging]);


	const columns = useMemo<ColumnDef<IJurisdictionAsset>[]>(
		() => [
         {
				id: 'asset_kind',
				accessorFn: (row) => AssetKind[row.asset_kind],
				header: 'Assetkind',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: false
			},
      		{
				id: 'file_name',
				accessorKey: 'file_name',
				header: 'File Name',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: false
			},
      		{
				id: 'storage_key',
				accessorKey: 'storage_key',
				header: 'Storage Key',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: false
			},
      		
         {
            header: '',
            id: 'action',
            cell: props => <JurisdictionAssetEditor is_create={false} _id={props.row.original._id} jurisdiction_id={jurisdiction_id!}/>,
         }
         
		],
		[]
	);

	

	return (
      <AdaptiveCard className={classNames(expands && 'h-full')}  bodyClass={classNames(expands && 'h-full')}>
         <div className={classNames(expands && 'h-full', 'flex flex-col gap-4')}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3>JurisdictionAssets</h3>
                  <JurisdictionAssetEditor is_create={true} jurisdiction_id={jurisdiction_id!}/>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
               <Input
                  placeholder="Search"
                  prefix={<TbSearch className="text-lg" />}
                  onChange={handleSearchChange}
               />
               <Button variant="plain" icon={<Loading type="refreshing" loading={jurisdictionassets.isFetching && !!jurisdictionassets?.data?.items} />} onClick={handleRefresh} />
            </div>
            <DataTable
               columns={columns}
               expands={expands}
               data={jurisdictionassets?.data?.items || []}
               loading={jurisdictionassets.isLoading}
               fetching={jurisdictionassets.isFetching}
               pagingData={tablePagingData}
               onPaginationChange={handlePaginationChange}
               onSelectChange={handleSelectChange}
               onSort={handleSort}
            />
         </div>
      </AdaptiveCard>
	);
}

export default JurisdictionAssetList;