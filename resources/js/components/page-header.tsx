import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

type HeaderBreadcrumb = {
    label: string;
    href?: string;
};

type Props = {
    breadcrumbs: HeaderBreadcrumb[];
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
    breadcrumbClassName?: string;
    titleClassName?: string;
    descriptionClassName?: string;
};

export function PageHeader({
    breadcrumbs,
    title,
    description,
    actions,
    className,
    breadcrumbClassName,
    titleClassName,
    descriptionClassName,
}: Props) {
    return (
        <div
            className={cn(
                'mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
                className,
            )}
        >
            <div>
                <Breadcrumb
                    className={cn(
                        'mb-3 flex flex-wrap items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase',
                        breadcrumbClassName,
                    )}
                >
                    <BreadcrumbList className="gap-2 text-xs font-bold tracking-widest uppercase sm:gap-2">
                        {breadcrumbs.map((item, index) => {
                            const isLast = index === breadcrumbs.length - 1;

                            return (
                                <BreadcrumbItem key={`${item.label}-${index}`}>
                                    {isLast || !item.href ? (
                                        <BreadcrumbPage className="text-primary">
                                            {item.label}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink
                                            asChild
                                            className="text-primary"
                                        >
                                            <Link href={item.href}>{item.label}</Link>
                                        </BreadcrumbLink>
                                    )}

                                    {!isLast && (
                                        <BreadcrumbSeparator className="[&>svg]:size-3">
                                            <span className="material-symbols-outlined text-[10px]">
                                                chevron_right
                                            </span>
                                        </BreadcrumbSeparator>
                                    )}
                                </BreadcrumbItem>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>

                <h1
                    className={cn(
                        'text-2xl font-extrabold tracking-tight text-foreground',
                        titleClassName,
                    )}
                >
                    {title}
                </h1>

                {description && (
                    <p className={cn('mt-1 text-sm text-muted-foreground', descriptionClassName)}>
                        {description}
                    </p>
                )}
            </div>

            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
    );
}
