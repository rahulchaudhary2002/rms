import * as React from 'react';
import { cn } from '@/lib/utils';
import InputError from '@/components/input-error';

type FormFieldProps = {
    label: string;
    htmlFor?: string;
    error?: string;
    description?: string;
    className?: string;
    required?: boolean;
    children: React.ReactNode;
};

function FormField({
    label,
    htmlFor,
    error,
    description,
    className,
    required,
    children,
}: FormFieldProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <div className="flex items-baseline justify-between gap-2">
                <label
                    htmlFor={htmlFor}
                    className="text-xs font-bold tracking-wider text-foreground/80 uppercase dark:text-foreground/70"
                >
                    {label}{required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
                {description && (
                    <span className="text-xs text-muted-foreground">{description}</span>
                )}
            </div>
            {children}
            {error && <InputError message={error} />}
        </div>
    );
}

export { FormField };
