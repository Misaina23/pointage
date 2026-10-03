"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export type Column<T> = {
    key: string;
    header: string;
    align?: "left" | "right" | "center";
    width?: string;
    render: (row: T, index: number) => ReactNode;
};

type DataTableProps<T> = {
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T, index: number) => string | number;
    emptyLabel?: string;
    footer?: ReactNode;
    onRowClick?: (row: T) => void;
    pageSize?: number;
    pagination?: boolean;
};

export function DataTable<T>({
    columns,
    rows,
    rowKey,
    emptyLabel = "Aucune donnée à afficher.",
    footer,
    onRowClick,
    pageSize = 5,
    pagination = true,
}: DataTableProps<T>) {
    const normalizedRows = Array.isArray(rows) ? rows : [];
    const [page, setPage] = useState(1);
    const rowsPerPage = Math.max(1, pageSize);
    const lastPage = Math.max(1, Math.ceil(normalizedRows.length / rowsPerPage));
    const currentPage = Math.min(page, lastPage);
    const visibleRows = pagination
        ? normalizedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
        : normalizedRows;

    return (
        <>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    style={{ width: column.width, textAlign: column.align ?? "left" }}
                                    scope="col"
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {normalizedRows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <p className="empty-history">{emptyLabel}</p>
                                </td>
                            </tr>
                        ) : (
                            visibleRows.map((row, index) => (
                                <tr
                                    key={rowKey(row, (currentPage - 1) * rowsPerPage + index)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    className={onRowClick ? "is-clickable" : undefined}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} style={{ textAlign: column.align ?? "left" }}>
                                            {column.render(row, (currentPage - 1) * rowsPerPage + index)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                    {footer && <tfoot className="table-foot">{footer}</tfoot>}
                </table>
            </div>
            {pagination && (
                <Pagination
                    currentPage={currentPage}
                    lastPage={lastPage}
                    onChange={setPage}
                />
            )}
        </>
    );
}

export function Pagination({
    currentPage,
    lastPage,
    onChange,
}: {
    currentPage: number;
    lastPage: number;
    onChange: (page: number) => void;
}) {
    if (lastPage <= 1) {
        return null;
    }

    return (
        <nav className="pagination" aria-label="Pagination">
            <button
                type="button"
                className="compact-button"
                disabled={currentPage <= 1}
                onClick={() => onChange(currentPage - 1)}
            >
                Précédent
            </button>
            <span>
                Page {currentPage} sur {lastPage}
            </span>
            <button
                type="button"
                className="compact-button"
                disabled={currentPage >= lastPage}
                onClick={() => onChange(currentPage + 1)}
            >
                Suivant
            </button>
        </nav>
    );
}