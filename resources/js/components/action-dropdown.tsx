import { Link } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type ActionItem = {
    id?: string | number;
    label: string;
    icon: string;
    onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
    href?: string;
    variant?: 'default' | 'danger' | 'destructive';
    permission?: string;
};

type ControlledProps = {
    isOpen: boolean;
    itemId: string | number;
    itemLabel: string;
    onToggle: (id: string | number | null) => void;
    actions?: ActionItem[];
};

type LegacyProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items?: ActionItem[];
};

type Props = ControlledProps | LegacyProps;

export function ActionDropdown(props: Props) {
    const isControlled = 'isOpen' in props;
    const isOpen = isControlled ? props.isOpen : props.open;
    const itemId = isControlled ? props.itemId : 'action-menu';
    const itemLabel = isControlled ? props.itemLabel : 'item';
    const actions = isControlled ? (props.actions ?? []) : (props.items ?? []);

    const closeMenu = () => {
        if (isControlled) {
            props.onToggle(null);
        } else {
            props.onOpenChange(false);
        }
    };

    const toggleMenu = () => {
        if (isControlled) {
            props.onToggle(itemId);
        } else {
            props.onOpenChange(!isOpen);
        }
    };

    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
    const [isAbove, setIsAbove] = useState(false);
    const [menuHeight, setMenuHeight] = useState<number | null>(null);

    const updateMenuPosition = (height: number) => {
        if (!buttonRef.current) return;

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const padding = 8;
        const showAbove = spaceBelow < height + padding && spaceAbove > height + padding;

        const top = showAbove ? buttonRect.top - height - padding : buttonRect.bottom + padding;
        const right = window.innerWidth - buttonRect.right;

        setMenuPosition({ top, right });
        setIsAbove(showAbove);
    };

    useEffect(() => {
        if (!isOpen || !dropdownRef.current) return;

        const height = dropdownRef.current.getBoundingClientRect().height;
        setMenuHeight(height);
    }, [isOpen, actions.length]);

    useLayoutEffect(() => {
        if (!isOpen) return;

        updateMenuPosition(menuHeight || 50);
    }, [isOpen, menuHeight]);

    useEffect(() => {
        if (!isOpen) return;

        const handleViewportChange = () => {
            const height = dropdownRef.current?.getBoundingClientRect().height || menuHeight || 50;
            updateMenuPosition(height);
        };

        window.addEventListener('scroll', handleViewportChange, true);
        window.addEventListener('resize', handleViewportChange);

        return () => {
            window.removeEventListener('scroll', handleViewportChange, true);
            window.removeEventListener('resize', handleViewportChange);
        };
    }, [isOpen, menuHeight]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = () => closeMenu();

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    const handleActionClick = (action: ActionItem) => {
        if (action.onClick) {
            action.onClick({} as React.MouseEvent<HTMLButtonElement>);
        }
        closeMenu();
    };

    const menuContent = (
        <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'fixed',
                top: `${menuPosition?.top}px`,
                right: `${menuPosition?.right}px`,
                transformOrigin: isAbove ? 'bottom right' : 'top right',
            }}
            className={cn(
                'z-50 min-w-[10rem] rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg transition-all duration-200',
                isOpen
                    ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                    : 'pointer-events-none -translate-y-2 scale-95 opacity-0',
            )}
        >
            {actions.map((action, index) =>
                action.href ? (
                    <Link
                        key={String(action.id ?? `${action.label}-${index}`)}
                        href={action.href}
                        onClick={() => closeMenu()}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            action.variant === 'danger' || action.variant === 'destructive'
                                ? 'text-destructive hover:bg-destructive/10'
                                : 'text-popover-foreground hover:bg-accent',
                        )}
                    >
                        <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
                        {action.label}
                    </Link>
                ) : (
                    <button
                        key={String(action.id ?? `${action.label}-${index}`)}
                        type="button"
                        onClick={() => handleActionClick(action)}
                        className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            action.variant === 'danger' || action.variant === 'destructive'
                                ? 'text-destructive hover:bg-destructive/10'
                                : 'text-popover-foreground hover:bg-accent',
                        )}
                    >
                        <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
                        {action.label}
                    </button>
                ),
            )}
        </div>
    );

    return (
        <>
            <div className="inline-flex justify-end">
                <button
                    ref={buttonRef}
                    type="button"
                    aria-label={`Open actions for ${itemLabel}`}
                    aria-expanded={isOpen}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu();
                    }}
                    className={cn(
                        'inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        isOpen
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                >
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
            </div>
            {isOpen && createPortal(menuContent, document.body)}
        </>
    );
}
