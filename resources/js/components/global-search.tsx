import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

export type SearchItem = {
    title: string;
    href: string;
    group: string;
    groupIcon: string;
};

type Props = {
    items: SearchItem[];
};

function highlight(text: string, query: string): ReactNode {
    if (!query.trim()) {
        return text;
    }

    const index = text.toLowerCase().indexOf(query.toLowerCase());

    if (index === -1) {
        return text;
    }

    return (
        <>
            {text.slice(0, index)}
            <mark className="rounded-sm bg-primary/10 px-0.5 text-primary">
                {text.slice(index, index + query.length)}
            </mark>
            {text.slice(index + query.length)}
        </>
    );
}

export function GlobalSearch({ items }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return items;
        }

        return items.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                item.group.toLowerCase().includes(q),
        );
    }, [query, items]);

    const grouped = useMemo(() => {
        const map = new Map<string, { icon: string; items: SearchItem[] }>();

        for (const item of results) {
            if (!map.has(item.group)) {
                map.set(item.group, { icon: item.groupIcon, items: [] });
            }

            map.get(item.group)?.items.push(item);
        }

        return map;
    }, [results]);

    const openSearch = useCallback(() => {
        setQuery('');
        setActiveIndex(0);
        setOpen(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                openSearch();
            }

            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [openSearch]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleMouseDown = (event: MouseEvent) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleMouseDown);

        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [open]);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    useEffect(() => {
        const active = listRef.current?.querySelector(
            '[data-active="true"]',
        ) as HTMLElement | null;

        active?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const handleInputKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter') {
            const item = results[activeIndex];

            if (item) {
                router.visit(item.href);
                setOpen(false);
            }
        }
    };

    const navigate = (href: string) => {
        router.visit(href);
        setOpen(false);
    };

    let flatIndex = 0;
    const groupedWithIndex: Array<{
        group: string;
        icon: string;
        items: Array<{ item: SearchItem; index: number }>;
    }> = [];

    for (const [group, { icon, items: groupItems }] of grouped) {
        groupedWithIndex.push({
            group,
            icon,
            items: groupItems.map((item) => ({
                item,
                index: flatIndex++,
            })),
        });
    }

    return (
        <>
            <button
                type="button"
                aria-label="Open search"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring/30 focus:outline-none"
                onClick={openSearch}
            >
                <span className="material-symbols-outlined">search</span>
            </button>

            {open &&
                createPortal(
                    <>
                        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />

                        <div
                            ref={panelRef}
                            className="fixed inset-0 z-[61] flex flex-col overflow-hidden border-border bg-popover text-popover-foreground shadow-2xl md:inset-auto md:top-[15%] md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:rounded-2xl md:border"
                        >
                            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
                                <span className="material-symbols-outlined shrink-0 text-primary">
                                    search
                                </span>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setActiveIndex(0);
                                    }}
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="Search pages, features..."
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery('')}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <span className="material-symbols-outlined text-base">
                                            close
                                        </span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="flex items-center rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
                                    onClick={() => setOpen(false)}
                                >
                                    <span className="material-symbols-outlined text-base">
                                        close
                                    </span>
                                </button>
                                <kbd
                                    className="hidden cursor-pointer items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:flex"
                                    onClick={() => setOpen(false)}
                                >
                                    Esc
                                </kbd>
                            </div>

                            <div
                                ref={listRef}
                                className="min-h-0 flex-1 overflow-y-auto py-2 md:max-h-96 md:flex-none"
                            >
                                {results.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                                        <span className="material-symbols-outlined text-3xl text-muted-foreground/50">
                                            search_off
                                        </span>
                                        No results for "{query}"
                                    </div>
                                ) : (
                                    groupedWithIndex.map(
                                        ({
                                            group,
                                            icon,
                                            items: groupItems,
                                        }) => (
                                            <div key={group} className="mb-1">
                                                <div className="flex items-center gap-2 px-4 pt-2 pb-1">
                                                    <span className="material-symbols-outlined text-base text-muted-foreground">
                                                        {icon}
                                                    </span>
                                                    <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                        {group}
                                                    </span>
                                                </div>
                                                {groupItems.map(
                                                    ({ item, index }) => (
                                                        <button
                                                            key={item.href}
                                                            type="button"
                                                            data-active={
                                                                index ===
                                                                activeIndex
                                                            }
                                                            className={cn(
                                                                'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                                                                index ===
                                                                    activeIndex
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                                            )}
                                                            onMouseEnter={() =>
                                                                setActiveIndex(
                                                                    index,
                                                                )
                                                            }
                                                            onClick={() =>
                                                                navigate(
                                                                    item.href,
                                                                )
                                                            }
                                                        >
                                                            <span
                                                                className={cn(
                                                                    'material-symbols-outlined text-base',
                                                                    index ===
                                                                        activeIndex
                                                                        ? 'text-primary'
                                                                        : 'text-muted-foreground',
                                                                )}
                                                            >
                                                                arrow_forward
                                                            </span>
                                                            <span>
                                                                {highlight(
                                                                    item.title,
                                                                    query,
                                                                )}
                                                            </span>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        ),
                                    )
                                )}
                            </div>

                            <div className="flex items-center gap-4 border-t border-border px-4 py-2.5">
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
                                        Up/Down
                                    </kbd>
                                    navigate
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
                                        Enter
                                    </kbd>
                                    open
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
                                        Esc
                                    </kbd>
                                    close
                                </span>
                            </div>
                        </div>
                    </>,
                    document.body,
                )}
        </>
    );
}
