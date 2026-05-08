'use client';

import { ReactNode } from 'react';

export interface ColumnDef<T> {
  header: string;
  accessor: keyof T | ((row: T) => unknown);
  cell?: (value: unknown, row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    limit?: number;
  };
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  pagination,
  onPageChange,
}: DataTableProps<T>) {
  
  const getCellValue = (row: T, column: ColumnDef<T>) => {
      if (typeof column.accessor === 'function') {
          return column.accessor(row);
      }
      return row[column.accessor as keyof T];
  };

  if (loading) {
    return (
        <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        {columns.map((col) => <th key={col.header} scope="col" className="px-6 py-3">{col.header}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: pagination?.limit || 10 }).map((_, i) => (
                        <tr key={i} className="bg-white border-b">
                            {columns.map((col) => (
                                <td key={col.header} className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                    {columns.map((col) => <th key={col.header} scope="col" className="px-6 py-3">{col.header}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.map((row) => (
                    <tr key={row.id} className="bg-white border-b hover:bg-gray-50">
                        {columns.map((col) => {
                            const value = getCellValue(row, col);
                            return (
                                <td key={col.header} className="px-6 py-4">
                                    {col.cell ? col.cell(value, row) : value}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {pagination && onPageChange && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-gray-700">
                Página <span className="font-semibold">{pagination.page}</span> de <span className="font-semibold">{pagination.totalPages}</span>
            </span>
            <div className="inline-flex mt-2 xs:mt-0">
                <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-l hover:bg-green-700 disabled:opacity-50"
                >
                    Anterior
                </button>
                <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border-0 border-l border-green-500 rounded-r hover:bg-green-700 disabled:opacity-50"
                >
                    Próximo
                </button>
            </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
