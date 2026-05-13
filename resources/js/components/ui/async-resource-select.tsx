import { ChevronDown, Loader2, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

type ResourceOption = {
    value: string;
    label: string;
};

type AsyncResourceSelectProps = {
    resourceType: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

type FetchState = {
    options: ResourceOption[];
    total: number;
    lastPage: number;
    currentPage: number;
    loading: boolean;
};

const EMPTY: FetchState = { options: [], total: 0, lastPage: 1, currentPage: 1, loading: false };

export function AsyncResourceSelect({
    resourceType,
    value,
    onChange,
    placeholder = 'Select...',
    disabled,
    className,
}: AsyncResourceSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const [state, setState] = React.useState<FetchState>(EMPTY);
    const [loadingMore, setLoadingMore] = React.useState(false);
    const [selectedLabel, setSelectedLabel] = React.useState('');

    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const debounceRef = React.useRef<number | null>(null);
    const listboxId = React.useId();
    const abortRef = React.useRef<AbortController | null>(null);

    const isDisabled = disabled || !resourceType;

    const fetchOptions = React.useCallback(async (type: string, search: string, page: number, append = false) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        if (!append) {
            setState((prev) => ({ ...prev, loading: true }));
        } else {
            setLoadingMore(true);
        }

        try {
            const params = new URLSearchParams({ type, page: String(page) });
            if (search) params.set('search', search);

            const res = await fetch(`/access-control/resource-lookup?${params}`, {
                signal: controller.signal,
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (!res.ok) throw new Error('Failed');

            const json = await res.json() as { data: ResourceOption[]; total: number; last_page: number; current_page: number };

            setState((prev) => ({
                options: append ? [...prev.options, ...json.data] : json.data,
                total: json.total,
                lastPage: json.last_page,
                currentPage: json.current_page,
                loading: false,
            }));
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return;
            setState((prev) => ({ ...prev, loading: false }));
        } finally {
            setLoadingMore(false);
        }
    }, []);

    // Reload when resourceType changes
    React.useEffect(() => {
        if (!resourceType) {
            setState(EMPTY);
            return;
        }
        setQuery('');
        setState(EMPTY);
        onChange('');
        setSelectedLabel('');
        void fetchOptions(resourceType, '', 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resourceType]);

    // Debounced search
    React.useEffect(() => {
        if (!resourceType || !isOpen) return;

        if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);

        debounceRef.current = window.setTimeout(() => {
            void fetchOptions(resourceType, query, 1);
        }, 400);

        return () => {
            if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
        };
    }, [query, resourceType, isOpen, fetchOptions]);

    // Abort on unmount
    React.useEffect(() => () => { abortRef.current?.abort(); }, []);

    // Close on outside click
    React.useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                closeMenu();
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    const openMenu = () => {
        if (isDisabled) return;
        setIsFocused(true);
        setIsOpen(true);
        setQuery('');
    };

    const closeMenu = () => {
        setIsOpen(false);
        setIsFocused(false);
        setQuery('');
        setHighlightedIndex(-1);
    };

    const selectOption = (option: ResourceOption) => {
        onChange(option.value);
        setSelectedLabel(option.label);
        closeMenu();
        inputRef.current?.blur();
    };

    const clearValue = () => {
        onChange('');
        setSelectedLabel('');
    };

    const loadMore = () => {
        if (state.currentPage < state.lastPage && !loadingMore) {
            void fetchOptions(resourceType, query, state.currentPage + 1, true);
        }
    };

    React.useEffect(() => {
        if (!isOpen) { setHighlightedIndex(-1); return; }
        const idx = state.options.findIndex((o) => o.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
    }, [isOpen, state.options, value]);

    const displayValue = isFocused ? query : (selectedLabel || (value ? `ID: ${value}` : ''));

    const moveHighlight = (dir: 1 | -1) => {
        if (!state.options.length) return;
        setHighlightedIndex((prev) => (prev + dir + state.options.length) % state.options.length);
    };

    return (
        <div ref={wrapperRef} className="relative" data-searchable-select-root>
            <input
                ref={inputRef}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                disabled={isDisabled}
                placeholder={!value ? placeholder : undefined}
                value={displayValue}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                onFocus={openMenu}
                onBlur={(e) => {
                    if (e.relatedTarget instanceof Node && wrapperRef.current?.contains(e.relatedTarget)) return;
                    closeMenu();
                }}
                onClick={() => { if (!isDisabled) setIsOpen(true); }}
                onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); isOpen ? moveHighlight(1) : openMenu(); }
                    if (e.key === 'ArrowUp') { e.preventDefault(); isOpen ? moveHighlight(-1) : openMenu(); }
                    if (e.key === 'Enter' && isOpen) {
                        e.preventDefault();
                        const opt = highlightedIndex >= 0 ? state.options[highlightedIndex] : undefined;
                        if (opt) selectOption(opt);
                    }
                    if (e.key === 'Escape' && isOpen) { e.preventDefault(); closeMenu(); inputRef.current?.blur(); }
                }}
                className={cn(
                    'h-11 w-full rounded-lg border border-input bg-background px-3 pr-16 text-sm text-foreground transition-[color,box-shadow,border-color] outline-none',
                    'placeholder:text-muted-foreground',
                    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    'dark:bg-input/30',
                    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                    className,
                )}
            />

            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                {state.loading && !isOpen && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {value && !isDisabled && (
                    <button
                        type="button"
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); clearValue(); }}
                        aria-label="Clear"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                <ChevronDown className="pointer-events-none h-4 w-4 text-muted-foreground" />
            </div>

            {isOpen && !isDisabled && (
                <div
                    id={listboxId}
                    role="listbox"
                    data-searchable-select-listbox
                    className="absolute z-50 mt-1 flex max-h-64 w-full flex-col overflow-hidden rounded-lg border border-input bg-popover text-popover-foreground shadow-lg"
                >
                    <div className="flex-1 overflow-auto">
                        {state.loading ? (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        ) : state.options.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No items found.</div>
                        ) : (
                            state.options.map((option, index) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="option"
                                    aria-selected={option.value === value}
                                    onMouseDown={(e) => { e.preventDefault(); selectOption(option); }}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={cn(
                                        'block w-full px-3 py-2 text-left text-sm',
                                        highlightedIndex === index || option.value === value
                                            ? 'bg-accent text-accent-foreground'
                                            : 'hover:bg-accent hover:text-accent-foreground',
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))
                        )}
                    </div>

                    {state.currentPage < state.lastPage && (
                        <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); loadMore(); }}
                            className="flex w-full items-center justify-center gap-2 border-t px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            {loadingMore
                                ? <><Loader2 className="h-3 w-3 animate-spin" /> Loading more...</>
                                : `Load more (${state.options.length} of ${state.total})`
                            }
                        </button>
                    )}

                    {!state.loading && state.options.length > 0 && state.currentPage >= state.lastPage && (
                        <div className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
                            {state.total} result{state.total !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
