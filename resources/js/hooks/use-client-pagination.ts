import { useMemo, useState } from 'react';

export const tablePerPageOptions = ['10', '25', '50', '100', 'all'] as const;

export function useClientPagination<T>(items: T[], initialPerPage: string = '10') {
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPageState] = useState(initialPerPage);

    const effectivePerPage = useMemo(() => {
        if (perPage === 'all') {
            return Math.max(items.length, 1);
        }

        const parsed = Number(perPage);

        return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
    }, [items.length, perPage]);

    const totalPages = Math.max(1, Math.ceil(items.length / effectivePerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedItems = useMemo(() => {
        if (perPage === 'all') {
            return items;
        }

        const start = (safeCurrentPage - 1) * effectivePerPage;

        return items.slice(start, start + effectivePerPage);
    }, [effectivePerPage, items, perPage, safeCurrentPage]);

    const from = items.length === 0 ? 0 : (safeCurrentPage - 1) * effectivePerPage + 1;
    const to = items.length === 0 ? 0 : Math.min(items.length, safeCurrentPage * effectivePerPage);

    const pages = useMemo(() => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const start = Math.max(1, safeCurrentPage - 2);
        const end = Math.min(totalPages, start + 4);
        const adjustedStart = Math.max(1, end - 4);

        return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
    }, [safeCurrentPage, totalPages]);

    const setPerPage = (value: string) => {
        setPerPageState(value);
        setCurrentPage(1);
    };

    return {
        currentPage: safeCurrentPage,
        from,
        pages,
        paginatedItems,
        perPage,
        setCurrentPage,
        setPerPage,
        to,
        total: items.length,
        totalPages,
    };
}
