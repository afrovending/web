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

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-red-200 bg-white shadow-md">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        {/* Always show table head */}
        <thead className="bg-yellow-50 text-xs font-semibold text-gray-700 uppercase">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left whitespace-nowrap"
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

        {/* Show Skeleton in tbody if loading */}
        <tbody className="divide-y divide-gray-100 text-gray-800">
          {loading ? (
            [...Array(pagination?.pageSize || 10)].map((_, idx) => (
              <tr key={`skeleton-row-${idx}`}>
                {columns.map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 whitespace-nowrap">
                    <Skeleton height={40} />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="text-red-500 p-4">
                Error: {error}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-gray-600 text-sm p-6 text-center"
              >
                No data available
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-yellow-50 transition">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && !loading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full px-4 py-4 border-t border-gray-200 bg-gray-50 gap-4">
          <div className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {pagination.pageIndex * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-800">
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                pagination.totalRows
              )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">
              {pagination.totalRows}
            </span>{" "}
            entries
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                onPaginationChange?.({
                  pageIndex: pagination.pageIndex - 1,
                  pageSize: pagination.pageSize,
                })
              }
              disabled={pagination.pageIndex === 0}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-yellow-800 text-white rounded-md disabled:opacity-40 transition"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Previous
            </button>

            <span className="text-sm font-medium text-gray-700">
              Page {pagination.pageIndex + 1} of{" "}
              {Math.max(
                Math.ceil(pagination.totalRows / pagination.pageSize),
                1
              )}
            </span>

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
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-yellow-800 text-white rounded-md disabled:opacity-40 transition"
            >
              Next
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TanStackTable;
