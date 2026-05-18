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

import { IAccount } from '@/stencil/models/entities/account';
import { accountEndpoints, useGetAccountsQuery } from '@/stencil/endpoints/entities/accountApi';
import { ListInputAccount } from '@/stencil/models/entities/requests/list-input-account';
import AccountEditor from './AccountEditor';
import { AccountStatus } from '@/stencil/models/entities/accountstatus';
import { RoutedInput } from '@/stencil/models/routed-input';

import { Link, useNavigate, useParams } from 'react-router';

type AccountListProps = Meta & {
   expands?: boolean;
}
function AccountList(props: AccountListProps) {
	const { expands = true } = props;
   const routeParams = useParams();
	const { jurisdiction_id } = routeParams;
   
   const dispatch = useAppDispatch();
   const navigate = useNavigate();
	const [apiRequest, setApiRequest] = useState<RoutedInput<ListInputAccount>>(() => {
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
	
	const accounts = useGetAccountsQuery({...apiRequest}, { refetchOnMountOrArgChange: true });

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
      dispatch(accountEndpoints.getAccounts.initiate(request, { forceRefetch: true }));
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

   
   const detailLink = useCallback((_id: string) => {
      return `/super/jurisdiction/${jurisdiction_id}/account/${_id}`;
   }, []);

   const onCreate = useCallback((account: IAccount): void => {
      if (account) {
         navigate(detailLink(account._id));
      }
   }, []);
	
   useEffect(() => {
      const paging = accounts?.data?.paging;
      if (paging) {
         setTablePagingData({
            total: paging.total_pages * paging.page_size,
            pageIndex: paging.current_page,
            pageSize: paging.page_size,
         });
      }
   }, [accounts?.data?.paging]);


	const columns = useMemo<ColumnDef<IAccount>[]>(
		() => [
         {
				id: 'email',
				accessorKey: 'email',
				header: 'E-mail',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: true
			},
      		{
				id: 'display_name',
				accessorKey: 'display_name',
				header: 'Display Name',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: true
			},
      		{
				id: 'auth_identifier',
				accessorKey: 'auth_identifier',
				header: 'Auth Identifier',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: false
			},
      		{
				id: 'auth_provider',
				accessorKey: 'auth_provider',
				header: 'Auth Provider',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: false
			},
      		{
				id: 'account_status',
				accessorFn: (row) => AccountStatus[row.account_status],
				header: 'Status',
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
                  <h3>Accounts</h3>
                  <AccountEditor is_create={true} onCreate={onCreate} jurisdiction_id={jurisdiction_id!}/>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
               <Input
                  placeholder="Search"
                  prefix={<TbSearch className="text-lg" />}
                  onChange={handleSearchChange}
               />
               <Button variant="plain" icon={<Loading type="refreshing" loading={accounts.isFetching && !!accounts?.data?.items} />} onClick={handleRefresh} />
            </div>
            <DataTable
               columns={columns}
               expands={expands}
               data={accounts?.data?.items || []}
               loading={accounts.isLoading}
               fetching={accounts.isFetching}
               pagingData={tablePagingData}
               onPaginationChange={handlePaginationChange}
               onSelectChange={handleSelectChange}
               onSort={handleSort}
            />
         </div>
      </AdaptiveCard>
	);
}

export default AccountList;