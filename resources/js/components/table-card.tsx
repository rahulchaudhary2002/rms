import type { KeyboardEventHandler, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type TableCardProps = {
    title: string;
    description?: string;
    toolbar?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
};

type TableSearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
    onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
};

export function TableCard({ title, description, toolbar, children, footer, className }: TableCardProps) {
    return (
        <Card className={cn('gap-0 py-0', className)}>
            <CardHeader className="rounded-t-xl flex flex-col gap-4 border-b border-border bg-card px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <CardTitle className="font-headline text-base font-extrabold text-foreground">
                        {title}
                    </CardTitle>
                    {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
                </div>
                {toolbar ? (
                    <div data-print-hide className="flex flex-wrap items-center gap-2">
                        {toolbar}
                    </div>
                ) : null}
            </CardHeader>

            <div className={cn(!footer && 'rounded-b-xl')}>{children}</div>

            {footer ? (
                <CardFooter
                    data-print-hide
                    className="rounded-b-xl flex flex-col gap-4 border-t border-border bg-card px-6 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                    {footer}
                </CardFooter>
            ) : null}
        </Card>
    );
}

export function TableSearchInput({ value, onChange, placeholder, className, onKeyDown }: TableSearchInputProps) {
    return (
        <div
            className={cn(
                'group flex h-9 items-center rounded-lg border border-input bg-card px-3 shadow-sm transition-[border-color,box-shadow,background-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30',
                className,
            )}
        >
            <span className="material-symbols-outlined mr-2 text-base text-muted-foreground/80 transition-colors group-focus-within:text-foreground">
                search
            </span>
            <Input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0 dark:bg-transparent"
            />
        </div>
    );
}
