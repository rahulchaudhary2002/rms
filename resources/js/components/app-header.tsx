import { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { GlobalSearch } from '@/components/global-search';
import { OutletNodeSwitcher } from '@/components/outlet-node-switcher';
import { getSearchItems, openMobileSidebar } from '@/components/app-sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

type NotificationItem = {
    id: string;
    title: string;
    body: string;
    icon?: string;
    href?: string;
    tone?: string;
    read_at?: string | null;
    time?: string | null;
};

type NotificationData = {
    unread_count: number;
    items: NotificationItem[];
};

const notificationToneClasses: Record<string, string> = {
    danger: 'bg-destructive/10 text-destructive',
    info: 'bg-chart-2/10 text-chart-2',
    success: 'bg-chart-3/10 text-chart-3',
    warning: 'bg-chart-4/10 text-chart-4',
};

export function AppHeader() {
    const page = usePage();
    const { auth } = page.props as { auth: Auth };
    const notifications = (page.props.notifications as NotificationData | undefined) ?? {
        unread_count: 0,
        items: [],
    };

    const searchItems = getSearchItems(auth);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const notificationRef = useRef<HTMLDivElement>(null);
    const isDark = resolvedAppearance === 'dark';

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, []);

    const handleThemeToggle = () => {
        const next =
            appearance === 'system'
                ? isDark ? 'light' : 'dark'
                : appearance === 'dark' ? 'light' : 'dark';
        updateAppearance(next);
    };

    const handleNotificationClick = (notification: NotificationItem) => {
        setNotificationsOpen(false);
        if (notification.href) {
            router.visit(notification.href);
        }
    };

    return (
        <header
            id="app-header"
            className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm md:px-6 lg:px-8"
        >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:gap-4">
                <button
                    type="button"
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
                    onClick={openMobileSidebar}
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <OutletNodeSwitcher />
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                <GlobalSearch items={searchItems} />

                <button
                    type="button"
                    className="flex items-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={handleThemeToggle}
                >
                    <span className="material-symbols-outlined">
                        {isDark ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                <div className="relative" ref={notificationRef}>
                    <button
                        type="button"
                        className="relative flex items-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            setNotificationsOpen((v) => !v);
                        }}
                    >
                        <span className="material-symbols-outlined">notifications</span>
                        {notifications.unread_count > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                                {notifications.unread_count > 9 ? '9+' : notifications.unread_count}
                            </span>
                        )}
                    </button>

                    <div
                        className={cn(
                            'absolute right-0 mt-3 w-72 max-w-[calc(100vw-1rem)] origin-top-right rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl transition-all duration-300 sm:w-80',
                            notificationsOpen ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0',
                        )}
                    >
                        <div className="flex items-center justify-between border-b border-border p-4">
                            <h4 className="font-headline text-sm font-bold">Notifications</h4>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto">
                            {notifications.items.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <span className="material-symbols-outlined text-3xl text-muted-foreground/50">notifications_off</span>
                                    <p className="mt-2 text-sm font-medium text-foreground">No notifications</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Alerts will appear here.</p>
                                </div>
                            ) : (
                                notifications.items.map((notification, index) => (
                                    <button
                                        type="button"
                                        key={notification.id}
                                        className={cn(
                                            'w-full p-4 text-left transition-colors hover:bg-accent',
                                            notification.read_at === null && 'bg-accent',
                                            index < notifications.items.length - 1 && 'border-b border-border',
                                        )}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex gap-3">
                                            <div
                                                className={cn(
                                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                                    notificationToneClasses[notification.tone ?? 'info'] ?? notificationToneClasses.info,
                                                )}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    {notification.icon ?? 'notifications'}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex items-start gap-2">
                                                    <p className="min-w-0 flex-1 text-sm font-semibold">{notification.title}</p>
                                                    {notification.read_at === null && (
                                                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                                    )}
                                                </div>
                                                <p className="text-xs leading-5 text-muted-foreground">{notification.body}</p>
                                                {notification.time && (
                                                    <p className="text-[10px] text-muted-foreground">{notification.time}</p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
