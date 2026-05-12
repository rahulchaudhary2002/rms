import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';

import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

const items = [
    { title: 'Profile', href: editProfile().url },
    { title: 'Security', href: editSecurity().url },
    { title: 'Appearance', href: editAppearance().url },
];

export default function SettingsLayoutShell({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div>
            <div className="flex flex-col gap-12 lg:flex-row">
                <nav
                    className="scrollbar-hide flex w-full shrink-0 flex-row gap-1 overflow-x-auto pb-4 lg:w-48 lg:flex-col lg:pb-0"
                    aria-label="Settings"
                >
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center rounded-lg px-4 py-2.5 text-sm whitespace-nowrap transition-all',
                                isCurrentOrParentUrl(item.href)
                                    ? 'border border-border bg-card font-semibold text-primary shadow-sm'
                                    : 'font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            )}
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>

                <div className="flex-1 space-y-12">{children}</div>
            </div>
        </div>
    );
}
