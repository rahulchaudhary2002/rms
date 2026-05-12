import * as React from 'react';
import { cn } from '@/lib/utils';
import InputError from '@/components/input-error';

type FormFieldProps = {
    label: string;
    htmlFor?: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
};

function FormField({
    label,
    htmlFor,
    error,
    className,
    children,
}: FormFieldProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <label
                htmlFor={htmlFor}
                className="text-xs font-bold tracking-wider text-foreground/80 uppercase dark:text-foreground/70"
            >
                {label}
            </label>
            {children}
            {error && <InputError message={error} />}
        </div>
    );
}

export { FormField };
