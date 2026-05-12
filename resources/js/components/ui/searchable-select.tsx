import { ChevronDown, Plus, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

type SelectOption = {
    value: string;
    label: string;
    disabled: boolean;
};

type SearchableSelectProps = {
    id?: string;
    name?: string;
    value?: string | number;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    placeholder?: string;
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    onAddNew?: (query: string) => void;
    addNewLabel?: string;
    children: React.ReactNode;
};

type OptionProps = {
    value?: string | number;
    disabled?: boolean;
    children?: React.ReactNode;
};

function getOptionLabel(node: React.ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }

    if (Array.isArray(node)) {
        return node.map(getOptionLabel).join(' ').trim();
    }

    if (React.isValidElement(node)) {
        return getOptionLabel(
            (node.props as { children?: React.ReactNode }).children,
        );
    }

    return '';
}

function extractOptions(children: React.ReactNode): SelectOption[] {
    const options: SelectOption[] = [];

    React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) {
            return;
        }

        if (
            typeof child.type === 'string' &&
            child.type.toLowerCase() === 'option'
        ) {
            const option = child as React.ReactElement<OptionProps>;
            const rawValue = option.props.value;
            options.push({
                value: rawValue == null ? '' : String(rawValue),
                label: getOptionLabel(option.props.children),
                disabled: Boolean(option.props.disabled),
            });

            return;
        }

        if (
            typeof child.type === 'string' &&
            child.type.toLowerCase() === 'optgroup'
        ) {
            const group = child as React.ReactElement<{
                children?: React.ReactNode;
            }>;

            React.Children.forEach(group.props.children, (opt) => {
                if (!React.isValidElement(opt)) {
                    return;
                }

                if (
                    typeof opt.type === 'string' &&
                    opt.type.toLowerCase() === 'option'
                ) {
                    const option = opt as React.ReactElement<OptionProps>;
                    const rawValue = option.props.value;
                    options.push({
                        value: rawValue == null ? '' : String(rawValue),
                        label: getOptionLabel(option.props.children),
                        disabled: Boolean(option.props.disabled),
                    });
                }
            });
        }
    });

    return options;
}

export function SearchableSelect({
    className,
    children,
    value,
    onChange,
    name,
    disabled,
    id,
    required,
    onAddNew,
    addNewLabel = 'Add new',
    placeholder,
}: SearchableSelectProps) {
    const options = React.useMemo(() => extractOptions(children), [children]);
    const placeholderOption = React.useMemo(
        () => options.find((option) => option.value === ''),
        [options],
    );
    const [internalValue, setInternalValue] = React.useState(() => {
        if (value != null) {
            return String(value);
        }

        return placeholderOption?.value ?? '';
    });
    const isControlled = value != null;
    const currentValue = isControlled ? String(value) : internalValue;
    const selectedOption = options.find(
        (option) => option.value === currentValue,
    );

    React.useEffect(() => {
        if (isControlled) {
            return;
        }

        if (options.some((option) => option.value === internalValue)) {
            return;
        }

        setInternalValue(placeholderOption?.value ?? '');
    }, [internalValue, isControlled, options, placeholderOption]);

    const [isOpen, setIsOpen] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const listboxId = React.useId();

    const filteredOptions = React.useMemo(() => {
        if (!query.trim()) {
            return options;
        }

        const term = query.toLowerCase();

        return options.filter((option) =>
            option.label.toLowerCase().includes(term),
        );
    }, [options, query]);

    React.useEffect(() => {
        if (!isOpen) {
            setHighlightedIndex(-1);

            return;
        }

        const selectedIndex = filteredOptions.findIndex(
            (option) => option.value === currentValue && !option.disabled,
        );
        const firstEnabledIndex = filteredOptions.findIndex(
            (option) => !option.disabled,
        );
        setHighlightedIndex(
            selectedIndex >= 0 ? selectedIndex : firstEnabledIndex,
        );
    }, [currentValue, filteredOptions, isOpen]);

    const displayValue = isFocused
        ? query
        : selectedOption?.label ||
          placeholder ||
          placeholderOption?.label ||
          '';

    const emitChange = React.useCallback(
        (nextValue: string) => {
            if (!onChange) {
                return;
            }

            const syntheticEvent = {
                target: { value: nextValue, name },
                currentTarget: { value: nextValue, name },
            } as unknown as React.ChangeEvent<HTMLSelectElement>;

            onChange(syntheticEvent);
        },
        [name, onChange],
    );

    const openMenu = React.useCallback(() => {
        if (disabled) {
            return;
        }

        setIsFocused(true);
        setIsOpen(true);
        setQuery('');
    }, [disabled]);

    const closeMenu = React.useCallback(() => {
        setIsOpen(false);
        setIsFocused(false);
        setQuery('');
        setHighlightedIndex(-1);
    }, []);

    const selectOption = React.useCallback(
        (nextValue: string) => {
            if (!isControlled) {
                setInternalValue(nextValue);
            }

            emitChange(nextValue);
            closeMenu();
            inputRef.current?.blur();
        },
        [closeMenu, emitChange, isControlled],
    );

    const moveHighlight = React.useCallback(
        (direction: 1 | -1) => {
            if (filteredOptions.length === 0) {
                return;
            }

            let nextIndex = highlightedIndex;

            for (let i = 0; i < filteredOptions.length; i += 1) {
                nextIndex =
                    (nextIndex + direction + filteredOptions.length) %
                    filteredOptions.length;

                if (!filteredOptions[nextIndex]?.disabled) {
                    setHighlightedIndex(nextIndex);

                    return;
                }
            }
        },
        [filteredOptions, highlightedIndex],
    );

    React.useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                closeMenu();
            }
        };

        document.addEventListener('mousedown', onPointerDown);

        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [closeMenu]);

    return (
        <div ref={wrapperRef} className="relative" data-searchable-select-root>
            <input
                ref={inputRef}
                id={id}
                name={name ? `${name}__search` : undefined}
                disabled={disabled}
                required={required}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-form-type="other"
                aria-autocomplete="none"
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder={
                    !selectedOption
                        ? placeholder || placeholderOption?.label
                        : undefined
                }
                value={displayValue}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                onFocus={openMenu}
                onBlur={(event) => {
                    const nextFocused = event.relatedTarget;

                    if (
                        nextFocused instanceof Node &&
                        wrapperRef.current?.contains(nextFocused)
                    ) {
                        return;
                    }

                    closeMenu();
                }}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(true);
                    }
                }}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setIsOpen(true);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();

                        if (!isOpen) {
                            openMenu();

                            return;
                        }

                        moveHighlight(1);
                    }

                    if (event.key === 'ArrowUp') {
                        event.preventDefault();

                        if (!isOpen) {
                            openMenu();

                            return;
                        }

                        moveHighlight(-1);
                    }

                    if (event.key === 'Enter') {
                        if (!isOpen) {
                            return;
                        }

                        event.preventDefault();
                        const highlightedOption =
                            highlightedIndex >= 0
                                ? filteredOptions[highlightedIndex]
                                : undefined;

                        if (highlightedOption && !highlightedOption.disabled) {
                            selectOption(highlightedOption.value);
                        }
                    }

                    if (event.key === 'Escape') {
                        if (!isOpen) {
                            return;
                        }

                        event.preventDefault();
                        closeMenu();
                        inputRef.current?.blur();
                    }
                }}
                className={cn(
                    'h-11 w-full rounded-lg border border-input bg-background px-3 pr-16 text-sm text-foreground transition-[color,box-shadow,border-color] outline-none',
                    'placeholder:text-muted-foreground',
                    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    'dark:bg-input/30',
                    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                    className,
                )}
            />

            {name && <input type="hidden" name={name} value={currentValue} />}

            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                {currentValue !== '' && (
                    <button
                        type="button"
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                        onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            selectOption('');
                        }}
                        aria-label="Clear selected item"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                <ChevronDown className="pointer-events-none h-4 w-4 text-muted-foreground" />
            </div>

            {isOpen && !disabled && (
                <div
                    id={listboxId}
                    role="listbox"
                    data-searchable-select-listbox
                    className="absolute z-50 mt-1 flex max-h-60 w-full flex-col overflow-hidden rounded-lg border border-input bg-popover text-popover-foreground shadow-lg"
                >
                    <div className="flex-1 overflow-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                No items found.
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => (
                                <button
                                    key={`${option.value}-${option.label}`}
                                    type="button"
                                    disabled={option.disabled}
                                    role="option"
                                    aria-selected={
                                        option.value === currentValue
                                    }
                                    onMouseDown={(event) => {
                                        event.preventDefault();

                                        if (!option.disabled) {
                                            selectOption(option.value);
                                        }
                                    }}
                                    onMouseEnter={() => {
                                        if (!option.disabled) {
                                            setHighlightedIndex(index);
                                        }
                                    }}
                                    className={cn(
                                        'block w-full px-3 py-2 text-left text-sm',
                                        highlightedIndex === index ||
                                            option.value === currentValue
                                            ? 'bg-accent text-accent-foreground'
                                            : 'hover:bg-accent hover:text-accent-foreground',
                                        option.disabled &&
                                            'cursor-not-allowed opacity-50',
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))
                        )}
                    </div>
                    {onAddNew && (
                        <button
                            type="button"
                            onMouseDown={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onAddNew(query.trim());
                            }}
                            className="flex w-full items-center gap-2 border-t px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            <Plus className="h-4 w-4" />
                            {addNewLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
