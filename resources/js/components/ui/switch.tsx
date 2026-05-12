import * as React from 'react';
import { cn } from '@/lib/utils';

type SwitchProps = {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
} & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'onChange' | 'type' | 'role' | 'aria-checked'
>;

export function Switch({
    checked,
    onCheckedChange,
    disabled,
    className,
    ...props
}: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
                checked
                    ? 'border-primary bg-primary/20'
                    : 'border-border bg-muted',
                className,
            )}
            {...props}
        >
            <span
                className={cn(
                    'inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
                    checked ? 'translate-x-6 bg-primary' : 'translate-x-1',
                )}
            />
        </button>
    );
}
