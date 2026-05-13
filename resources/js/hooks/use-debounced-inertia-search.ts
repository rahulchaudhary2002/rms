import { useEffect, useRef } from 'react';

type CancelToken = {
    cancel: () => void;
};

type SearchRequestOptions = {
    onCancelToken: (token: CancelToken) => void;
};

type UseDebouncedInertiaSearchOptions = {
    value: string;
    delay?: number;
    enabled?: boolean;
    onSearch: (value: string, options: SearchRequestOptions) => void;
};

export function useDebouncedInertiaSearch({
    value,
    delay = 1000,
    enabled = true,
    onSearch,
}: UseDebouncedInertiaSearchOptions) {
    const cancelTokenRef = useRef<CancelToken | null>(null);
    const lastSubmittedRef = useRef(value);
    const latestOnSearchRef = useRef(onSearch);
    const effectiveDelay = Math.max(delay, 1000);

    useEffect(() => {
        latestOnSearchRef.current = onSearch;
    }, [onSearch]);

    useEffect(() => {
        if (!enabled) return;

        const timer = window.setTimeout(() => {
            if (value === lastSubmittedRef.current) return;

            cancelTokenRef.current?.cancel();
            lastSubmittedRef.current = value;

            latestOnSearchRef.current(value, {
                onCancelToken: (token) => {
                    cancelTokenRef.current = token;
                },
            });
        }, effectiveDelay);

        return () => window.clearTimeout(timer);
    }, [effectiveDelay, enabled, value]);

    useEffect(() => {
        return () => {
            cancelTokenRef.current?.cancel();
        };
    }, []);
}
