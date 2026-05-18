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

import { IJurisdiction } from '@/stencil/models/entities/jurisdiction';
import { jurisdictionEndpoints, useGetJurisdictionsQuery } from '@/stencil/endpoints/entities/jurisdictionApi';
import { ListInputJurisdiction } from '@/stencil/models/entities/requests/list-input-jurisdiction';
import JurisdictionEditor from './JurisdictionEditor';
import { Link, useNavigate, useParams } from 'react-router';

type JurisdictionListProps = Meta & {
   expands?: boolean;
}
function JurisdictionList(props: JurisdictionListProps) {
	const { expands = true } = props;
   
   const dispatch = useAppDispatch();
   const navigate = useNavigate();
	const [apiRequest, setApiRequest] = useState<ListInputJurisdiction>(() => {
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
	
	const jurisdictions = useGetJurisdictionsQuery({...apiRequest}, { refetchOnMountOrArgChange: true });

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
      dispatch(jurisdictionEndpoints.getJurisdictions.initiate(request, { forceRefetch: true }));
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

   
   const detailLink = useCallback((_id: string) => {
      return `/super/jurisdiction/${_id}`;
   }, []);

   const onCreate = useCallback((jurisdiction: IJurisdiction): void => {
      if (jurisdiction) {
         navigate(detailLink(jurisdiction._id));
      }
   }, []);
	
   useEffect(() => {
      const paging = jurisdictions?.data?.paging;
      if (paging) {
         setTablePagingData({
            total: paging.total_pages * paging.page_size,
            pageIndex: paging.current_page,
            pageSize: paging.page_size,
         });
      }
   }, [jurisdictions?.data?.paging]);


	const columns = useMemo<ColumnDef<IJurisdiction>[]>(
		() => [
         {
				id: 'jurisdiction_id',
				accessorKey: 'jurisdiction_id',
				header: 'Jurisdiction Id',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: true
			},
      		
         {
            header: '',
            id: 'action',
            cell: props => (
               <Link to={detailLink(props.row.original._id)}>
                  <Button variant="plain" icon={<TbArrowRight />}>View</Button>
               </Link>
            )
         }
		],
		[]
	);

	

	return (
      <AdaptiveCard className={classNames(expands && 'h-full')}  bodyClass={classNames(expands && 'h-full')}>
         <div className={classNames(expands && 'h-full', 'flex flex-col gap-4')}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3>Jurisdictions</h3>
                  <JurisdictionEditor is_create={true} onCreate={onCreate} />
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
               <Input
                  placeholder="Search"
                  prefix={<TbSearch className="text-lg" />}
                  onChange={handleSearchChange}
               />
               <Button variant="plain" icon={<Loading type="refreshing" loading={jurisdictions.isFetching && !!jurisdictions?.data?.items} />} onClick={handleRefresh} />
            </div>
            <DataTable
               columns={columns}
               expands={expands}
               data={jurisdictions?.data?.items || []}
               loading={jurisdictions.isLoading}
               fetching={jurisdictions.isFetching}
               pagingData={tablePagingData}
               onPaginationChange={handlePaginationChange}
               onSelectChange={handleSelectChange}
               onSort={handleSort}
            />
         </div>
      </AdaptiveCard>
	);
}

export default JurisdictionList;