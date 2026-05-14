import { Link, router, usePage } from '@inertiajs/react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { GlobalSearch } from '@/components/global-search';
import { OutletNodeSwitcher } from '@/components/outlet-node-switcher';
import type { SearchItem } from '@/components/global-search';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { dashboard, logout } from '@/routes';
import { index as usersIndex } from '@/routes/users';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as permissionsIndex } from '@/routes/access-control/permissions';
import { index as rpIndex } from '@/routes/access-control/role-permissions';
import { index as urIndex } from '@/routes/access-control/user-roles';
import { index as upoIndex } from '@/routes/access-control/user-permission-overrides';
import { index as urpIndex } from '@/routes/access-control/user-resource-permissions';
import type { AppLayoutProps, Auth, BreadcrumbItem } from '@/types';

type ViewportMode = 'mobile' | 'medium' | 'large';

type MenuItem = {
    title: string;
    href: string;
    icon: string;
    activeMatch?: string[];
};

type MenuGroup = {
    id: string;
    title: string;
    icon: string;
    items: MenuItem[];
};

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

type OpenGroupOverride = {
    url: string;
    value: string;
};

type SidebarProps = {
    appName: string;
    auth: Auth;
    currentUrl: string;
    viewportMode: ViewportMode;
    compactMode: boolean;
    mobileSidebarOpen: boolean;
    openGroup: string;
    openDropRight: string | null;
    dropRightTop: number;
    userMenuOpen: boolean;
    onMobileSidebarToggle: (open: boolean) => void;
    onMiniToggle: () => void;
    onOpenGroupChange: (group: string) => void;
    onOpenDropRightChange: (group: string | null) => void;
    onDropRightTopChange: (top: number) => void;
    onUserMenuToggle: (open: boolean) => void;
    onLogout: () => void;
};

const appLogoName =
    import.meta.env.VITE_APP_LOGO_NAME ||
    import.meta.env.VITE_APP_NAME ||
    'RMS';

const primaryItems: MenuItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
        icon: 'space_dashboard',
        activeMatch: [dashboard.url()],
    },
];

const menuGroups: MenuGroup[] = [
    {
        id: 'settings',
        title: 'Settings',
        icon: 'settings',
        items: [
            {
                title: 'Profile',
                href: editProfile().url,
                icon: 'person',
                activeMatch: [editProfile().url],
            },
            {
                title: 'Security',
                href: editSecurity().url,
                icon: 'shield',
                activeMatch: [editSecurity().url],
            },
            {
                title: 'Appearance',
                href: editAppearance().url,
                icon: 'palette',
                activeMatch: [editAppearance().url],
            },
        ],
    },
];

const notificationToneClasses: Record<string, string> = {
    danger: 'bg-destructive/10 text-destructive',
    info: 'bg-chart-2/10 text-chart-2',
    success: 'bg-chart-3/10 text-chart-3',
    warning: 'bg-chart-4/10 text-chart-4',
};

function getSearchItems(auth: Auth): SearchItem[] {
    const items = primaryItems.map((item) => ({
        title: item.title,
        href: item.href,
        group: 'Quick Access',
        groupIcon: item.icon,
    }));

    for (const group of buildDynamicGroups(auth)) {
        for (const item of group.items) {
            items.push({
                title: item.title,
                href: item.href,
                group: group.title,
                groupIcon: group.icon,
            });
        }
    }

    return items;
}

function isPathActive(
    currentUrl: string,
    href: string,
    activeMatch?: string[],
) {
    const candidates =
        activeMatch && activeMatch.length > 0 ? activeMatch : [href];

    return candidates.some(
        (path) =>
            currentUrl === path ||
            currentUrl.startsWith(`${path}/`) ||
            currentUrl.startsWith(`${path}?`),
    );
}

function titleFromPathSegment(segment: string): string {
    return segment
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function buildBreadcrumbsFromUrl(currentUrl: string): BreadcrumbItem[] {
    const path = currentUrl.split('?')[0].split('#')[0] || '/';

    if (path === '/' || path === '') {
        return [{ title: 'Dashboard', href: dashboard.url() }];
    }

    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) {
        return [{ title: 'Dashboard', href: dashboard.url() }];
    }

    const breadcrumbs: BreadcrumbItem[] = [];
    let accumulated = '';

    for (const segment of segments) {
        accumulated += `/${segment}`;
        breadcrumbs.push({
            title: titleFromPathSegment(segment),
            href: accumulated,
        });
    }

    return breadcrumbs;
}

function buildDynamicGroups(auth: Auth): MenuGroup[] {
    const isSuperAdmin = auth.user?.is_superadmin === true;
    const can = (slug: string) => isSuperAdmin || auth.can?.[slug] === true;

    const acItems: MenuItem[] = [];

    if (can('users-manage')) {
        acItems.push({ title: 'Users', href: usersIndex.url(), icon: 'group', activeMatch: [usersIndex.url()] });
    }
    if (can('roles-view')) {
        acItems.push({ title: 'Roles', href: rolesIndex.url(), icon: 'shield_person', activeMatch: [rolesIndex.url()] });
    }
    if (can('permissions-view')) {
        acItems.push({ title: 'Permissions', href: permissionsIndex.url(), icon: 'key', activeMatch: [permissionsIndex.url()] });
    }
    if (can('access-control-manage')) {
        acItems.push({ title: 'Role Permissions', href: rpIndex.url(), icon: 'lock', activeMatch: [rpIndex.url()] });
        acItems.push({ title: 'User Roles', href: urIndex.url(), icon: 'manage_accounts', activeMatch: [urIndex.url()] });
        acItems.push({ title: 'Permission Overrides', href: upoIndex.url(), icon: 'tune', activeMatch: [upoIndex.url()] });
        acItems.push({ title: 'Resource Permissions', href: urpIndex.url(), icon: 'rule', activeMatch: [urpIndex.url()] });
    }

    const groups: MenuGroup[] = [];

    if (acItems.length > 0) {
        groups.push({ id: 'access-control', title: 'Access Control', icon: 'admin_panel_settings', items: acItems });
    }

    groups.push(...menuGroups);

    return groups;
}

const Sidebar = memo(function Sidebar({
    appName,
    auth,
    currentUrl,
    viewportMode,
    compactMode,
    mobileSidebarOpen,
    openGroup,
    openDropRight,
    dropRightTop,
    userMenuOpen,
    onMobileSidebarToggle,
    onMiniToggle,
    onOpenGroupChange,
    onOpenDropRightChange,
    onDropRightTopChange,
    onUserMenuToggle,
    onLogout,
}: SidebarProps) {
    const navRef = useRef<HTMLElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const user = auth.user;
    const dynamicGroups = buildDynamicGroups(auth);
    const userInitials =
        user?.name
            ?.split(' ')
            .map((part) => part.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U';

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (
                userMenuOpen &&
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node)
            ) {
                onUserMenuToggle(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () =>
            document.removeEventListener('mousedown', handleOutsideClick);
    }, [userMenuOpen, onUserMenuToggle]);

    useEffect(() => {
        if (!openDropRight) {
            return;
        }

        const handleOutsideClick = (event: MouseEvent) => {
            if (
                navRef.current &&
                !navRef.current.contains(event.target as Node)
            ) {
                onOpenDropRightChange(null);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () =>
            document.removeEventListener('mousedown', handleOutsideClick);
    }, [openDropRight, onOpenDropRightChange]);

    return (
        <>
            <div
                className={cn(
                    'fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden',
                    mobileSidebarOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0',
                )}
                onClick={() => onMobileSidebarToggle(false)}
            />

            <aside
                id="sidebar"
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col overflow-visible border-r border-sidebar-border bg-sidebar text-sidebar-foreground duration-300 ease-in-out md:static',
                    viewportMode === 'mobile'
                        ? 'transition-transform'
                        : 'transition-[width]',
                    compactMode ? 'w-20' : 'w-72',
                    viewportMode === 'mobile'
                        ? mobileSidebarOpen
                            ? 'translate-x-0'
                            : '-translate-x-full'
                        : 'translate-x-0',
                )}
            >
                <div className="relative flex h-20 items-center justify-between p-5">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="signature-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg">
                            <span className="material-symbols-outlined text-primary-foreground">
                                restaurant
                            </span>
                        </div>
                        {!compactMode && (
                            <div>
                                <h1 className="font-headline text-lg leading-tight font-extrabold tracking-tight whitespace-nowrap">
                                    {appName}
                                </h1>
                                <p className="text-[11px] font-medium tracking-wider whitespace-nowrap text-muted-foreground uppercase">
                                    Restaurant Management
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="p-2 text-muted-foreground transition-colors hover:text-foreground md:hidden"
                        onClick={() => onMobileSidebarToggle(false)}
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    {viewportMode === 'large' && (
                        <button
                            type="button"
                            className="absolute top-10 -right-3 z-50 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-primary xl:flex"
                            onClick={() => {
                                onMiniToggle();
                                onOpenDropRightChange(null);
                                onUserMenuToggle(false);
                            }}
                        >
                            <span className="material-symbols-outlined text-xs">
                                {compactMode ? 'chevron_right' : 'chevron_left'}
                            </span>
                        </button>
                    )}
                </div>

                <nav
                    ref={navRef}
                    className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-4 py-4"
                >
                    {primaryItems.map((item) => {
                        const itemActive = isPathActive(
                            currentUrl,
                            item.href,
                            item.activeMatch,
                        );

                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={cn(
                                    'mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                                    itemActive
                                        ? 'bg-primary/10 font-semibold text-primary'
                                        : 'font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                )}
                            >
                                <span
                                    className={cn(
                                        'material-symbols-outlined shrink-0',
                                        itemActive
                                            ? 'text-primary'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {item.icon}
                                </span>
                                {!compactMode && <span>{item.title}</span>}
                            </Link>
                        );
                    })}

                    {dynamicGroups.map((group) => {
                        const groupActive = group.items.some((item) =>
                            isPathActive(
                                currentUrl,
                                item.href,
                                item.activeMatch,
                            ),
                        );
                        const isAccordionOpen = openGroup === group.id;
                        const isDropRightOpen = openDropRight === group.id;

                        return (
                            <div key={group.id} className="group relative">
                                <button
                                    type="button"
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                                        groupActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                    )}
                                    onClick={(event) => {
                                        event.stopPropagation();

                                        if (compactMode) {
                                            const rect =
                                                event.currentTarget.getBoundingClientRect();
                                            onDropRightTopChange(rect.top);
                                            onOpenDropRightChange(
                                                openDropRight === group.id
                                                    ? null
                                                    : group.id,
                                            );
                                            onUserMenuToggle(false);

                                            return;
                                        }

                                        onOpenGroupChange(
                                            openGroup === group.id
                                                ? ''
                                                : group.id,
                                        );
                                    }}
                                >
                                    <span
                                        className={cn(
                                            'material-symbols-outlined shrink-0',
                                            groupActive
                                                ? 'text-primary'
                                                : 'text-muted-foreground group-hover:text-primary',
                                        )}
                                    >
                                        {group.icon}
                                    </span>

                                    {!compactMode && (
                                        <>
                                            <span
                                                className={cn(
                                                    'flex-1 text-left text-sm',
                                                    groupActive
                                                        ? 'font-semibold'
                                                        : 'font-medium',
                                                )}
                                            >
                                                {group.title}
                                            </span>
                                            <span
                                                className={cn(
                                                    'material-symbols-outlined text-sm text-muted-foreground transition-transform',
                                                    isAccordionOpen &&
                                                        'rotate-180',
                                                    groupActive &&
                                                        'text-primary',
                                                )}
                                            >
                                                expand_more
                                            </span>
                                        </>
                                    )}
                                </button>

                                {!compactMode && (
                                    <div
                                        className={cn(
                                            'grid transition-[grid-template-rows] duration-300 ease-in-out',
                                            isAccordionOpen
                                                ? 'grid-rows-[1fr]'
                                                : 'grid-rows-[0fr]',
                                        )}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="relative mt-1 ml-10 space-y-1">
                                                <div className="absolute top-0 bottom-4 left-[-18px] w-px bg-border" />
                                                {group.items.map((item) => {
                                                    const itemActive =
                                                        isPathActive(
                                                            currentUrl,
                                                            item.href,
                                                            item.activeMatch,
                                                        );

                                                    return (
                                                        <Link
                                                            key={item.title}
                                                            href={item.href}
                                                            className={cn(
                                                                'relative flex items-center px-3 py-2 text-sm transition-colors',
                                                                itemActive
                                                                    ? 'font-medium text-primary'
                                                                    : 'font-medium text-muted-foreground hover:text-primary',
                                                            )}
                                                        >
                                                            <span className="absolute top-1/2 left-[-18px] h-px w-3 -translate-y-px bg-border" />
                                                            {item.title}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {compactMode && isDropRightOpen && (
                                    <div
                                        className="fixed left-[4.5rem] z-50 min-w-56 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
                                        style={{ top: `${dropRightTop}px` }}
                                    >
                                        {group.items.map((item) => {
                                            const itemActive = isPathActive(
                                                currentUrl,
                                                item.href,
                                                item.activeMatch,
                                            );

                                            return (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className={cn(
                                                        'mb-1 flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm',
                                                        itemActive
                                                            ? 'bg-primary/10 font-semibold text-primary'
                                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                                    )}
                                                >
                                                    {item.title}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div
                    className="relative border-t border-border p-4"
                    ref={userMenuRef}
                >
                    <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 transition-colors hover:bg-accent"
                        onClick={(event) => {
                            event.stopPropagation();
                            onUserMenuToggle(!userMenuOpen);
                            onOpenDropRightChange(null);
                        }}
                    >
                        <div className="signature-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
                            {userInitials}
                        </div>

                        {!compactMode && (
                            <>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-sm font-semibold">
                                        {user?.name}
                                    </p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-lg text-muted-foreground">
                                    unfold_more
                                </span>
                            </>
                        )}
                    </button>

                    <div
                        className={cn(
                            'z-50 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl transition-all duration-300',
                            compactMode
                                ? 'fixed bottom-4 left-[4.5rem] w-56'
                                : 'absolute right-4 bottom-full left-4 mb-2',
                            userMenuOpen
                                ? 'visible translate-y-0 opacity-100'
                                : 'invisible translate-y-2 opacity-0',
                        )}
                    >
                        <div className="py-1">
                            <Link
                                href={editProfile().url}
                                className="flex items-center px-4 py-3 text-sm text-popover-foreground hover:bg-accent"
                            >
                                <span className="material-symbols-outlined mr-3 text-muted-foreground">
                                    person
                                </span>
                                Profile Settings
                            </Link>
                            <hr className="my-1 border-border" />
                            <button
                                type="button"
                                className="flex w-full items-center px-4 py-3 text-sm text-destructive hover:bg-destructive/10"
                                onClick={onLogout}
                            >
                                <span className="material-symbols-outlined mr-3">
                                    logout
                                </span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
});

export default function AppLayoutShell({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const page = usePage();
    const { auth } = page.props;
    const currentUrl = page.url;
    const notifications = (page.props.notifications as
        | NotificationData
        | undefined) ?? {
        unread_count: 0,
        items: [],
    };
    const initialOpenGroup = useMemo(
        () =>
            buildDynamicGroups(auth as Auth).find((group) =>
                group.items.some((item) =>
                    isPathActive(currentUrl, item.href, item.activeMatch),
                ),
            )?.id ?? '',
        [currentUrl, auth],
    );
    const searchItems = useMemo(() => getSearchItems(auth as Auth), [auth]);
    const [viewportMode, setViewportMode] = useState<ViewportMode>('large');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isMini, setIsMiniState] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        const saved = localStorage.getItem('sidebar-mini');

        return saved !== null ? Boolean(JSON.parse(saved)) : false;
    });
    const [openGroupOverride, setOpenGroupOverride] =
        useState<OpenGroupOverride | null>(null);
    const [openDropRight, setOpenDropRight] = useState<string | null>(null);
    const [dropRightTop, setDropRightTop] = useState(120);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { appearance, resolvedAppearance, updateAppearance } =
        useAppearance();
    const notificationRef = useRef<HTMLDivElement>(null);
    const isDark = resolvedAppearance === 'dark';

    useEffect(() => {
        localStorage.setItem('sidebar-mini', JSON.stringify(isMini));
    }, [isMini]);

    useEffect(() => {
        const applyResponsiveState = () => {
            const width = window.innerWidth;

            if (width >= 1280) {
                setViewportMode('large');
            } else if (width >= 768) {
                setViewportMode('medium');
                setMobileSidebarOpen(false);
            } else {
                setViewportMode('mobile');
                setIsMiniState(false);
                setMobileSidebarOpen(false);
            }
        };

        applyResponsiveState();
        window.addEventListener('resize', applyResponsiveState);

        return () => window.removeEventListener('resize', applyResponsiveState);
    }, []);

    useEffect(() => {
        const handleWindowClick = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                notificationRef.current &&
                !notificationRef.current.contains(target)
            ) {
                setNotificationsOpen(false);
            }
        };

        window.addEventListener('click', handleWindowClick);

        return () => window.removeEventListener('click', handleWindowClick);
    }, []);

    const compactMode =
        viewportMode === 'medium' || (viewportMode === 'large' && isMini);
    const openGroup =
        openGroupOverride?.url === currentUrl
            ? openGroupOverride.value
            : initialOpenGroup;
    const resolvedBreadcrumbs =
        breadcrumbs.length > 0
            ? breadcrumbs
            : buildBreadcrumbsFromUrl(currentUrl);

    const setIsMini = (value: boolean | ((prev: boolean) => boolean)) => {
        setIsMiniState((prev) => {
            const nextValue = typeof value === 'function' ? value(prev) : value;
            localStorage.setItem('sidebar-mini', JSON.stringify(nextValue));

            return nextValue;
        });
    };

    const handleThemeToggle = () => {
        const nextAppearance =
            appearance === 'system'
                ? isDark
                    ? 'light'
                    : 'dark'
                : appearance === 'dark'
                  ? 'light'
                  : 'dark';

        updateAppearance(nextAppearance);
    };

    const handleLogout = () => {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
        setOpenDropRight(null);
        router.flushAll();
        router.post(logout.url());
    };

    const handleNotificationClick = (notification: NotificationItem) => {
        setNotificationsOpen(false);

        if (notification.href) {
            router.visit(notification.href);
        }
    };

    return (
        <div
            id="app-shell"
            className="relative flex h-screen overflow-hidden bg-background font-sans text-foreground transition-colors duration-200 dark:bg-background dark:text-foreground"
        >
            <Sidebar
                appName={String(page.props.name ?? appLogoName)}
                auth={auth}
                currentUrl={currentUrl}
                viewportMode={viewportMode}
                compactMode={compactMode}
                mobileSidebarOpen={mobileSidebarOpen}
                openGroup={openGroup}
                openDropRight={openDropRight}
                dropRightTop={dropRightTop}
                userMenuOpen={userMenuOpen}
                onMobileSidebarToggle={setMobileSidebarOpen}
                onMiniToggle={() => {
                    setIsMini((value) => !value);
                    setOpenDropRight(null);
                    setUserMenuOpen(false);
                }}
                onOpenGroupChange={(value) =>
                    setOpenGroupOverride({ url: currentUrl, value })
                }
                onOpenDropRightChange={setOpenDropRight}
                onDropRightTopChange={setDropRightTop}
                onUserMenuToggle={setUserMenuOpen}
                onLogout={handleLogout}
            />

            <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background dark:bg-background">
                <header
                    id="app-header"
                    className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm md:px-6 lg:px-8"
                >
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:gap-4">
                        <button
                            type="button"
                            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
                            onClick={() => setMobileSidebarOpen(true)}
                        >
                            <span className="material-symbols-outlined">
                                menu
                            </span>
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
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setNotificationsOpen((value) => !value);
                                }}
                            >
                                <span className="material-symbols-outlined">
                                    notifications
                                </span>
                                {notifications.unread_count > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                                        {notifications.unread_count > 9
                                            ? '9+'
                                            : notifications.unread_count}
                                    </span>
                                )}
                            </button>

                            <div
                                className={cn(
                                    'absolute right-0 mt-3 w-72 max-w-[calc(100vw-1rem)] origin-top-right rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl transition-all duration-300 sm:w-80',
                                    notificationsOpen
                                        ? 'visible scale-100 opacity-100'
                                        : 'invisible scale-95 opacity-0',
                                )}
                            >
                                <div className="flex items-center justify-between border-b border-border p-4">
                                    <h4 className="font-headline text-sm font-bold">
                                        Notifications
                                    </h4>
                                </div>

                                <div className="max-h-[320px] overflow-y-auto">
                                    {notifications.items.length === 0 ? (
                                        <div className="px-4 py-8 text-center">
                                            <span className="material-symbols-outlined text-3xl text-muted-foreground/50">
                                                notifications_off
                                            </span>
                                            <p className="mt-2 text-sm font-medium text-foreground">
                                                No notifications
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Alerts will appear here.
                                            </p>
                                        </div>
                                    ) : (
                                        notifications.items.map(
                                            (notification, index) => (
                                                <button
                                                    type="button"
                                                    key={notification.id}
                                                    className={cn(
                                                        'w-full p-4 text-left transition-colors hover:bg-accent',
                                                        notification.read_at ===
                                                            null && 'bg-accent',
                                                        index <
                                                            notifications.items
                                                                .length -
                                                                1 &&
                                                            'border-b border-border',
                                                    )}
                                                    onClick={() =>
                                                        handleNotificationClick(
                                                            notification,
                                                        )
                                                    }
                                                >
                                                    <div className="flex gap-3">
                                                        <div
                                                            className={cn(
                                                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                                                notificationToneClasses[
                                                                    notification.tone ??
                                                                        'info'
                                                                ] ??
                                                                    notificationToneClasses.info,
                                                            )}
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">
                                                                {notification.icon ??
                                                                    'notifications'}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-1 space-y-1">
                                                            <div className="flex items-start gap-2">
                                                                <p className="min-w-0 flex-1 text-sm font-semibold">
                                                                    {
                                                                        notification.title
                                                                    }
                                                                </p>
                                                                {notification.read_at ===
                                                                    null && (
                                                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs leading-5 text-muted-foreground">
                                                                {
                                                                    notification.body
                                                                }
                                                            </p>
                                                            {notification.time && (
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {
                                                                        notification.time
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ),
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div
                    id="app-content"
                    className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-12"
                >
                    {children}
                </div>

                <div className="signature-gradient h-1 w-full shrink-0" />
            </main>
        </div>
    );
}
