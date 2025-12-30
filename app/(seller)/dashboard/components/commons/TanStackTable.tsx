"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Skeleton from "react-loading-skeleton";

interface TanStackTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;

  error?: string | null;
  itemsPerPage?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    totalRows: number;
  };
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
}

function TanStackTable<T>({
  data,
  columns,
  loading = false,
  error,
  pagination,
  onPaginationChange,
}: TanStackTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination
      ? Math.ceil(pagination.totalRows / pagination.pageSize)
      : 0,
    state: {
      pagination: pagination
        ? {
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
          }
        : undefined,
    },
    onPaginationChange: (updater) => {
      if (onPaginationChange) {
        const newPagination =
          typeof updater === "function"
            ? updater({
                pageIndex: pagination?.pageIndex || 0,
                pageSize: pagination?.pageSize || 10,
              })
            : updater;

        onPaginationChange(newPagination);
      }
    },
  });

  // return (
  //   <div className="w-full overflow-x-auto rounded-xl border border-amber-200 bg-white shadow-md">
  //     <table className="min-w-full divide-y divide-gray-200 text-sm">
  //       {/* Always show table head */}
  //       <thead className="bg-green-50 text-xs font-semibold text-gray-700 uppercase">
  //         {table.getHeaderGroups().map((headerGroup) => (
  //           <tr key={headerGroup.id}>
  //             {headerGroup.headers.map((header) => (
  //               <th
  //                 key={header.id}
  //                 className="px-4 py-3 text-left whitespace-nowrap"
  //               >
  //                 {header.isPlaceholder
  //                   ? null
  //                   : flexRender(
  //                       header.column.columnDef.header,
  //                       header.getContext()
  //                     )}
  //               </th>
  //             ))}
  //           </tr>
  //         ))}
  //       </thead>

  //       {/* Show Skeleton in tbody if loading */}
  //       <tbody className="divide-y divide-gray-100 text-gray-800">
  //         {loading ? (
  //           [...Array(pagination?.pageSize || 10)].map((_, idx) => (
  //             <tr key={`skeleton-row-${idx}`}>
  //               {columns.map((_, colIdx) => (
  //                 <td key={colIdx} className="px-4 py-3 whitespace-nowrap">
  //                   <Skeleton height={40} />
  //                 </td>
  //               ))}
  //             </tr>
  //           ))
  //         ) : error ? (
  //           <tr>
  //             <td colSpan={columns.length} className="text-red-500 p-4">
  //               Error: {error}
  //             </td>
  //           </tr>
  //         ) : data.length === 0 ? (
  //           <tr>
  //             <td
  //               colSpan={columns.length}
  //               className="text-gray-600 text-sm p-6 text-center"
  //             >
  //               No data available
  //             </td>
  //           </tr>
  //         ) : (
  //           table.getRowModel().rows.map((row) => (
  //             <tr key={row.id} className="hover:bg-green-50 transition">
  //               {row.getVisibleCells().map((cell) => (
  //                 <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
  //                   {flexRender(cell.column.columnDef.cell, cell.getContext())}
  //                 </td>
  //               ))}
  //             </tr>
  //           ))
  //         )}
  //       </tbody>
  //     </table>

  //     {/* Pagination */}
  //     {pagination && !loading && (
  //       <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full px-4 py-4 border-t border-gray-200 bg-gray-50 gap-4">
  //         <div className="text-sm text-gray-600">
  //           Showing{" "}
  //           <span className="font-semibold text-gray-800">
  //             {pagination.pageIndex * pagination.pageSize + 1}
  //           </span>{" "}
  //           to{" "}
  //           <span className="font-semibold text-gray-800">
  //             {Math.min(
  //               (pagination.pageIndex + 1) * pagination.pageSize,
  //               pagination.totalRows
  //             )}
  //           </span>{" "}
  //           of{" "}
  //           <span className="font-semibold text-gray-800">
  //             {pagination.totalRows}
  //           </span>{" "}
  //           entries
  //         </div>

  //         <div className="flex items-center space-x-3">
  //           <button
  //             onClick={() =>
  //               onPaginationChange?.({
  //                 pageIndex: pagination.pageIndex - 1,
  //                 pageSize: pagination.pageSize,
  //               })
  //             }
  //             disabled={pagination.pageIndex === 0}
  //             className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-green-800 text-white rounded-md disabled:opacity-40 transition"
  //           >
  //             <ArrowLeftIcon className="w-4 h-4 mr-1" />
  //             Previous
  //           </button>

  //           <span className="text-sm font-medium text-gray-700">
  //             Page {pagination.pageIndex + 1} of{" "}
  //             {Math.max(
  //               Math.ceil(pagination.totalRows / pagination.pageSize),
  //               1
  //             )}
  //           </span>

  //           <button
  //             onClick={() =>
  //               onPaginationChange?.({
  //                 pageIndex: pagination.pageIndex + 1,
  //                 pageSize: pagination.pageSize,
  //               })
  //             }
  //             disabled={
  //               pagination.pageIndex >=
  //               Math.ceil(pagination.totalRows / pagination.pageSize) - 1
  //             }
  //             className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-green-800 text-white rounded-md disabled:opacity-40 transition"
  //           >
  //             Next
  //             <ArrowRightIcon className="w-4 h-4 ml-1" />
  //           </button>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
  return (
    <div className="w-full space-y-4">
      {/* 1. MOBILE VIEW: Stacks cells as a list of cards (Hidden on md+) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          [...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="p-4 bg-white rounded-xl border border-amber-200 animate-pulse"
            >
              <Skeleton height={20} width="60%" className="mb-4" />
              <Skeleton height={15} width="40%" className="mb-2" />
              <Skeleton height={15} width="80%" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200 text-gray-500">
            No data available
          </div>
        ) : (
          table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 space-y-3"
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  className="flex justify-between items-start gap-2 border-b border-gray-50 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    {cell.column.columnDef.header?.toString()}
                  </span>
                  <div className="text-sm font-medium text-gray-800 text-right">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* 2. DESKTOP VIEW: The Classic Table (Hidden on small screens) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-amber-200 bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-green-50 text-xs font-semibold text-gray-700 uppercase">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-4 text-left whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {loading
                ? [...Array(pagination?.pageSize || 5)].map((_, idx) => (
                    <tr key={`skeleton-${idx}`}>
                      {columns.map((_, colIdx) => (
                        <td key={colIdx} className="px-4 py-4">
                          <Skeleton height={24} />
                        </td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-green-50/50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-4 whitespace-nowrap"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. RESPONSIVE PAGINATION */}
      {pagination && !loading && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between w-full px-4 py-4 border rounded-xl border-gray-200 bg-white gap-4">
          <div className="text-sm text-gray-600 text-center lg:text-left order-2 lg:order-1">
            Showing{" "}
            <span className="font-bold text-gray-900">
              {pagination.pageIndex * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-gray-900">
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                pagination.totalRows
              )}
            </span>{" "}
            of{" "}
            <span className="font-bold text-gray-900">
              {pagination.totalRows}
            </span>
          </div>

          <div className="flex items-center justify-center space-x-2 order-1 lg:order-2">
            <button
              onClick={() =>
                onPaginationChange?.({
                  pageIndex: pagination.pageIndex - 1,
                  pageSize: pagination.pageSize,
                })
              }
              disabled={pagination.pageIndex === 0}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition shadow-sm"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>

            <div className="px-4 py-1.5 bg-green-50 border border-amber-100 rounded-lg text-sm font-bold text-green-900">
              {pagination.pageIndex + 1} /{" "}
              {Math.max(
                Math.ceil(pagination.totalRows / pagination.pageSize),
                1
              )}
            </div>

            <button
              onClick={() =>
                onPaginationChange?.({
                  pageIndex: pagination.pageIndex + 1,
                  pageSize: pagination.pageSize,
                })
              }
              disabled={
                pagination.pageIndex >=
                Math.ceil(pagination.totalRows / pagination.pageSize) - 1
              }
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition shadow-sm"
            >
              <ArrowRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TanStackTable;
