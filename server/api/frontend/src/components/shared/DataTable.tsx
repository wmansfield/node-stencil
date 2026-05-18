import { useMemo, useRef, useEffect, useState, useImperativeHandle } from 'react';
import classNames from 'classnames';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import TableRowSkeleton from './loaders/TableRowSkeleton';
import {
   useReactTable,
   getCoreRowModel,
   getFilteredRowModel,
   getPaginationRowModel,
   getSortedRowModel,
   flexRender,
   ColumnDef,
   ColumnSort,
   Row,
   CellContext,
} from '@tanstack/react-table';
import type { TableProps } from '@/components/ui/Table';
import type { SkeletonProps } from '@/components/ui/Skeleton';
import type { Ref, ChangeEvent, ReactNode } from 'react';
import type { CheckboxProps } from '@/components/ui/Checkbox';
import Loading from './Loading';
import DataNotFound from '@/assets/svg/DataNotFound';

export type OnSortParam = { order: 'asc' | 'desc' | ''; key: string | number };

export type DataTablePagingData = {
   total: number;
   pageIndex: number;
   pageSize: number;
};

type DataTableProps<T> = {
   columns: ColumnDef<T>[];
   customNoDataIcon?: ReactNode;
   data?: unknown[];
   loading?: boolean;
   sortingLoading?: boolean;
   fetching?: boolean;
   noData?: boolean;
   instanceId?: string;
   onCheckBoxChange?: (checked: boolean, row: T) => void;
   onIndeterminateCheckBoxChange?: (checked: boolean, rows: Row<T>[]) => void;
   onPaginationChange?: (page: number) => void;
   onSelectChange?: (num: number) => void;
   onSort?: (sort: OnSortParam) => void;
   pageSizes?: number[];
   selectable?: boolean;
   skeletonAvatarColumns?: number[];
   skeletonAvatarProps?: SkeletonProps;
   pagingData?: DataTablePagingData;
   checkboxChecked?: (row: T) => boolean;
   indeterminateCheckboxChecked?: (row: Row<T>[]) => boolean;
   /**
    * When true, the table will expand to fill available vertical space.
    * The table body will become scrollable when content overflows.
    * Requires the parent container to have a defined height (e.g., h-full, h-screen, etc.).
    */
   expands?: boolean;
   /**
    * When true, hides the pagination controls and page size selector.
    */
   hidePagination?: boolean;
   ref?: Ref<DataTableResetHandle | HTMLTableElement>;
} & TableProps;

type CheckBoxChangeEvent = ChangeEvent<HTMLInputElement>;

interface IndeterminateCheckboxProps extends Omit<CheckboxProps, 'onChange'> {
   onChange: (event: CheckBoxChangeEvent) => void;
   indeterminate: boolean;
   onCheckBoxChange?: (event: CheckBoxChangeEvent) => void;
   onIndeterminateCheckBoxChange?: (event: CheckBoxChangeEvent) => void;
}

const { Tr, Th, Td, THead, TBody, Sorter } = Table;

const IndeterminateCheckbox = (props: IndeterminateCheckboxProps) => {
   const { indeterminate, onChange, onCheckBoxChange, onIndeterminateCheckBoxChange, ...rest } = props;

   const ref = useRef<HTMLInputElement>(null);

   useEffect(() => {
      if (typeof indeterminate === 'boolean' && ref.current) {
         ref.current.indeterminate = !rest.checked && indeterminate;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [ref, indeterminate]);

   const handleChange = (e: CheckBoxChangeEvent) => {
      onChange(e);
      onCheckBoxChange?.(e);
      onIndeterminateCheckBoxChange?.(e);
   };

   return <Checkbox ref={ref} className="mb-0" onChange={(_, e) => handleChange(e)} {...rest} />;
};

export type DataTableResetHandle = {
   resetSorting: () => void;
   resetSelected: () => void;
};

function DataTable<T>(props: DataTableProps<T>) {
   const {
      skeletonAvatarColumns,
      columns: columnsProp = [],
      data = [],
      customNoDataIcon,
      loading,
      sortingLoading = false, // Default to false
      fetching = false,
      noData,
      onCheckBoxChange,
      onIndeterminateCheckBoxChange,
      onPaginationChange,
      onSelectChange,
      onSort,
      pageSizes = [10, 25, 50, 100],
      selectable = false,
      skeletonAvatarProps,
      pagingData = {
         total: 0,
         pageIndex: 1,
         pageSize: 10,
      },
      checkboxChecked,
      indeterminateCheckboxChecked,
      instanceId = 'data-table',
      expands = false,
      hidePagination = false,
      ref,
      className,
      ...rest
   } = props;

   const { pageSize, pageIndex, total } = pagingData;

   const [sorting, setSorting] = useState<ColumnSort[] | null>(null);

   const pageSizeOption = useMemo(
      () =>
         pageSizes.map(number => ({
            value: number,
            label: `${number}`,
         })),
      [pageSizes]
   );

   useEffect(() => {
      if (Array.isArray(sorting)) {
         const sortOrder = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : '';
         const id = sorting.length > 0 ? sorting[0].id : '';
         onSort?.({ order: sortOrder, key: id });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [sorting]);

   const handleIndeterminateCheckBoxChange = (checked: boolean, rows: Row<T>[]) => {
      if (!loading && !sortingLoading && !fetching) {
         onIndeterminateCheckBoxChange?.(checked, rows);
      }
   };

   const handleCheckBoxChange = (checked: boolean, row: T) => {
      if (!loading && !sortingLoading && !fetching) {
         onCheckBoxChange?.(checked, row);
      }
   };

   const finalColumns: ColumnDef<T>[] = useMemo(() => {
      const columns = columnsProp;

      if (selectable) {
         return [
            {
               id: 'select',
               maxSize: 50,
               header: ({ table }) => (
                  <IndeterminateCheckbox
                     checked={indeterminateCheckboxChecked ? indeterminateCheckboxChecked(table.getRowModel().rows) : table.getIsAllRowsSelected()}
                     indeterminate={table.getIsSomeRowsSelected()}
                     onChange={table.getToggleAllRowsSelectedHandler()}
                     onIndeterminateCheckBoxChange={e => {
                        handleIndeterminateCheckBoxChange(e.target.checked, table.getRowModel().rows);
                     }}
                  />
               ),
               cell: ({ row }) => (
                  <IndeterminateCheckbox
                     checked={checkboxChecked ? checkboxChecked(row.original) : row.getIsSelected()}
                     disabled={!row.getCanSelect()}
                     indeterminate={row.getIsSomeSelected()}
                     onChange={row.getToggleSelectedHandler()}
                     onCheckBoxChange={e => handleCheckBoxChange(e.target.checked, row.original)}
                  />
               ),
            },
            ...columns,
         ];
      }
      return columns;
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [columnsProp, selectable, loading, sortingLoading, fetching, checkboxChecked]);

   const table = useReactTable({
      data,
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      columns: finalColumns as ColumnDef<unknown | object | any[], any>[],
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      manualPagination: true,
      manualSorting: !!onSort, // Enable local sorting when onSort is not provided
      onSortingChange: sorter => {
         setSorting(sorter as ColumnSort[]);
      },
      state: {
         sorting: sorting as ColumnSort[],
      },
   });

   const resetSorting = () => {
      table.resetSorting();
   };

   const resetSelected = () => {
      table.resetRowSelection(true);
   };

   useImperativeHandle(ref, () => ({
      resetSorting,
      resetSelected,
   }));

   const handlePaginationChange = (page: number) => {
      if (!loading && !sortingLoading && !fetching) {
         resetSelected();
         onPaginationChange?.(page);
      }
   };

   const handleSelectChange = (value?: number) => {
      if (!loading && !sortingLoading && !fetching) {
         onSelectChange?.(Number(value));
      }
   };

   function isFixed(col: any) {
      return col.columnDef?.meta?.fixed === true;
   }

   function getFixedWidth(col: any) {
      const metaW = col.columnDef?.meta?.width;
      if (typeof metaW === 'number') return metaW;
      // fallback al size solo si la columna es fixed
      return col.getSize();
   }

   return (
      <div className={classNames(expands && 'flex flex-col h-full', className)}>
         <div className={classNames(expands && 'flex-1 overflow-auto', 'relative')}>
            <div className="absolute top-2 left-0 z-10">
               <Loading loading={fetching && !loading} type="inline" />
            </div>
            <Table {...rest}>
               <THead>
                  {table.getHeaderGroups().map(headerGroup => (
                     <Tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => {
                           return (
                              <Th
                                 key={header.id}
                                 colSpan={header.colSpan}
                                 style={
                                    isFixed(header.column)
                                       ? {
                                            width: getFixedWidth(header.column),
                                            minWidth: getFixedWidth(header.column),
                                            maxWidth: getFixedWidth(header.column),
                                         }
                                       : undefined
                                 }
                              >
                                 {header.isPlaceholder ? null : (
                                    <div
                                       className={classNames(
                                          header.column.getCanSort() && 'cursor-pointer select-none point',
                                          (loading || sortingLoading || fetching) && 'pointer-events-none'
                                       )}
                                       onClick={header.column.getToggleSortingHandler()}
                                    >
                                       {flexRender(header.column.columnDef.header, header.getContext())}
                                       {header.column.getCanSort() && <Sorter sort={header.column.getIsSorted()} />}
                                    </div>
                                 )}
                              </Th>
                           );
                        })}
                     </Tr>
                  ))}
               </THead>
               {loading && data.length === 0 ? (
                  <TableRowSkeleton
                     columns={(finalColumns as Array<T>).length}
                     rows={pagingData.pageSize}
                     avatarInColumns={skeletonAvatarColumns}
                     avatarProps={skeletonAvatarProps}
                  />
               ) : (
                  <TBody>
                     {data.length === 0 ? (
                        <Tr>
                           <Td className="hover:bg-transparent" colSpan={finalColumns.length}>
                              <div className="flex flex-col items-center gap-4">
                                 {customNoDataIcon ? (
                                    customNoDataIcon
                                 ) : (
                                    <>
                                       <DataNotFound />
                                       <span className="font-semibold">No data found!</span>
                                    </>
                                 )}
                              </div>
                           </Td>
                        </Tr>
                     ) : (
                        <>
                           {table
                              .getRowModel()
                              .rows.slice(0, pageSize)
                              .map(row => {
                                 return (
                                    <Tr key={row.id}>
                                       {row.getVisibleCells().map(cell => {
                                          return (
                                             <Td
                                                key={cell.id}
                                                style={
                                                   isFixed(cell.column)
                                                      ? {
                                                           width: getFixedWidth(cell.column),
                                                           minWidth: getFixedWidth(cell.column),
                                                           maxWidth: getFixedWidth(cell.column),
                                                        }
                                                      : undefined
                                                }
                                             >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                             </Td>
                                          );
                                       })}
                                    </Tr>
                                 );
                              })}
                        </>
                     )}
                  </TBody>
               )}
            </Table>
            <div className="border-b border-gray-200 dark:border-gray-700"></div>
         </div>
         {!hidePagination && (
            <div className={classNames('flex items-center justify-between mt-4', expands && 'flex-shrink-0')}>
               <Pagination pageSize={pageSize} currentPage={pageIndex} total={total} onChange={handlePaginationChange} />
               <div style={{ minWidth: 130 }}>
                  <Select
                     instanceId={instanceId}
                     size="sm"
                     menuPlacement="top"
                     isSearchable={false}
                     value={pageSizeOption.filter(option => option.value === pageSize)}
                     options={pageSizeOption}
                     onChange={(option: any) => handleSelectChange(option?.value)}
                  />
               </div>
            </div>
         )}
      </div>
   );
}

export type { ColumnDef, Row, CellContext };
export default DataTable;
