import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-[color,box-shadow,border-color] outline-none',
                'placeholder:text-muted-foreground',
                'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                'dark:bg-input/30',
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
