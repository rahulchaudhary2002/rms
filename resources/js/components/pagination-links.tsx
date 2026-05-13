import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    links?: PaginationLink[];
    className?: string;
};

export default function PaginationLinks({ links, className }: Props) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <nav className={cn('flex flex-wrap items-center gap-2', className)} aria-label="Pagination">
            {links.map((link, index) => (
                <Link
                    key={`${link.label}-${index}`}
                    href={link.url ?? '#'}
                    preserveScroll
                    className={cn(
                        'inline-flex min-w-9 items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                        link.active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-primary',
                        !link.url && 'pointer-events-none opacity-50',
                    )}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </nav>
    );
}
