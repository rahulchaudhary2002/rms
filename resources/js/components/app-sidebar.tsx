import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchItem } from '@/components/global-search';
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
import { index as unitsIndex } from '@/routes/units';
import { index as unitConversionsIndex } from '@/routes/unit-conversions';
import { index as ingredientCategoriesIndex } from '@/routes/ingredient-categories';
import { index as ingredientsIndex } from '@/routes/ingredients';
import type { Auth } from '@/types';

type ViewportMode = 'mobile' | 'medium' | 'large';

type OpenGroupOverride = {
    url: string;
    value: string;
};

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
    label?: string;
    items: MenuItem[];
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

const settingsGroup: MenuGroup = {
    id: 'settings',
    title: 'Settings',
    label: 'Settings',
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
};

function isPathActive(currentUrl: string, href: string, activeMatch?: string[]) {
    const candidates = activeMatch && activeMatch.length > 0 ? activeMatch : [href];
    return candidates.some(
        (path) =>
            currentUrl === path ||
            currentUrl.startsWith(`${path}/`) ||
            currentUrl.startsWith(`${path}?`),
    );
}

function buildDynamicGroups(auth: Auth): MenuGroup[] {
    const isSuperAdmin = auth.user?.is_superadmin === true;
    const can = (slug: string) => isSuperAdmin || auth.can?.[slug] === true;
    const canAny = (slugs: string[]) => slugs.some((slug) => can(slug));
    const groups: MenuGroup[] = [];

    if (canAny(['users-manage', 'roles-view', 'permissions-view', 'access-control-manage'])) {
        const items: MenuItem[] = [];
        if (can('users-manage')) items.push({ title: 'Users', href: usersIndex.url(), icon: 'group', activeMatch: [usersIndex.url()] });
        if (can('roles-view')) items.push({ title: 'Roles', href: rolesIndex.url(), icon: 'shield_person', activeMatch: [rolesIndex.url()] });
        if (can('permissions-view')) items.push({ title: 'Permissions', href: permissionsIndex.url(), icon: 'key', activeMatch: [permissionsIndex.url()] });
        if (can('access-control-manage')) {
            items.push({ title: 'Role Permissions', href: rpIndex.url(), icon: 'lock', activeMatch: [rpIndex.url()] });
            items.push({ title: 'User Roles', href: urIndex.url(), icon: 'manage_accounts', activeMatch: [urIndex.url()] });
            items.push({ title: 'Permission Overrides', href: upoIndex.url(), icon: 'tune', activeMatch: [upoIndex.url()] });
            items.push({ title: 'Resource Permissions', href: urpIndex.url(), icon: 'rule', activeMatch: [urpIndex.url()] });
        }
        groups.push({ id: 'access-control', label: 'Administration', title: 'Access Control', icon: 'admin_panel_settings', items });
    }

    if (canAny(['units-view', 'unit-conversions-view'])) {
        const items: MenuItem[] = [];
        if (can('units-view')) items.push({ title: 'Units', href: unitsIndex.url(), icon: 'straighten', activeMatch: [unitsIndex.url()] });
        if (can('unit-conversions-view')) items.push({ title: 'Unit Conversions', href: unitConversionsIndex.url(), icon: 'swap_horiz', activeMatch: [unitConversionsIndex.url()] });
        groups.push({ id: 'units', label: 'Master Data', title: 'Units', icon: 'straighten', items });
    }

    if (canAny(['ingredient-categories-view', 'ingredients-view'])) {
        const items: MenuItem[] = [];
        if (can('ingredient-categories-view')) items.push({ title: 'Ingredient Categories', href: ingredientCategoriesIndex.url(), icon: 'category', activeMatch: [ingredientCategoriesIndex.url()] });
        if (can('ingredients-view')) items.push({ title: 'Ingredients', href: ingredientsIndex.url(), icon: 'nutrition', activeMatch: [ingredientsIndex.url()] });
        groups.push({ id: 'ingredients', title: 'Ingredients', icon: 'nutrition', items });
    }

    groups.push(settingsGroup);
    return groups;
}

export function getSearchItems(auth: Auth): SearchItem[] {
    const items: SearchItem[] = primaryItems.map((item) => ({
        title: item.title,
        href: item.href,
        group: 'Quick Access',
        groupIcon: item.icon,
    }));
    for (const group of buildDynamicGroups(auth)) {
        for (const item of group.items) {
            items.push({ title: item.title, href: item.href, group: group.title, groupIcon: group.icon });
        }
    }
    return items;
}

let _setMobileSidebarOpen: ((open: boolean) => void) | null = null;

export function openMobileSidebar() {
    _setMobileSidebarOpen?.(true);
}

export function AppSidebar() {
    const page = usePage();
    const auth = page.props.auth as Auth;
    const currentUrl = page.url;
    const appName = String(page.props.name ?? appLogoName);
    const user = auth.user;
    const dynamicGroups = buildDynamicGroups(auth);
    const userInitials =
        user?.name
            ?.split(' ')
            .map((part) => part.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U';

    const initialOpenGroup = useMemo(
        () =>
            buildDynamicGroups(auth).find((group) =>
                group.items.some((item) => isPathActive(currentUrl, item.href, item.activeMatch)),
            )?.id ?? '',
        [currentUrl, auth],
    );

    const [viewportMode, setViewportMode] = useState<ViewportMode>('large');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isMini, setIsMiniState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('sidebar-mini');
        return saved !== null ? Boolean(JSON.parse(saved)) : false;
    });
    const [openGroupOverride, setOpenGroupOverride] = useState<OpenGroupOverride | null>(null);
    const [openDropRight, setOpenDropRight] = useState<string | null>(null);
    const [dropRightTop, setDropRightTop] = useState(120);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const navRef = useRef<HTMLElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const compactMode = viewportMode === 'medium' || (viewportMode === 'large' && isMini);
    const openGroup = openGroupOverride?.url === currentUrl ? openGroupOverride.value : initialOpenGroup;

    useEffect(() => {
        _setMobileSidebarOpen = setMobileSidebarOpen;
        return () => { _setMobileSidebarOpen = null; };
    }, []);

    useEffect(() => {
        localStorage.setItem('sidebar-mini', JSON.stringify(isMini));
    }, [isMini]);

    useEffect(() => {
        const apply = () => {
            const w = window.innerWidth;
            if (w >= 1280) {
                setViewportMode('large');
            } else if (w >= 768) {
                setViewportMode('medium');
                setMobileSidebarOpen(false);
            } else {
                setViewportMode('mobile');
                setIsMiniState(false);
                setMobileSidebarOpen(false);
            }
        };
        apply();
        window.addEventListener('resize', apply);
        return () => window.removeEventListener('resize', apply);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [userMenuOpen]);

    useEffect(() => {
        if (!openDropRight) return;
        const handler = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenDropRight(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [openDropRight]);

    const setIsMini = (value: boolean | ((prev: boolean) => boolean)) => {
        setIsMiniState((prev) => {
            const next = typeof value === 'function' ? value(prev) : value;
            localStorage.setItem('sidebar-mini', JSON.stringify(next));
            return next;
        });
    };

    const handleLogout = () => {
        setUserMenuOpen(false);
        setOpenDropRight(null);
        router.flushAll();
        router.post(logout.url());
    };

    return (
        <>
            <div
                className={cn(
                    'fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden',
                    mobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
                )}
                onClick={() => setMobileSidebarOpen(false)}
            />

            <aside
                id="sidebar"
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col overflow-visible border-r border-sidebar-border bg-sidebar text-sidebar-foreground duration-300 ease-in-out md:static',
                    viewportMode === 'mobile' ? 'transition-transform' : 'transition-[width]',
                    compactMode ? 'w-20' : 'w-72',
                    viewportMode === 'mobile'
                        ? mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        : 'translate-x-0',
                )}
            >
                <div className="relative flex h-20 items-center justify-between p-5">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="signature-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg">
                            <span className="material-symbols-outlined text-primary-foreground">restaurant</span>
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
                        onClick={() => setMobileSidebarOpen(false)}
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    {viewportMode === 'large' && (
                        <button
                            type="button"
                            className="absolute top-10 -right-3 z-50 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-primary xl:flex"
                            onClick={() => {
                                setIsMini((v) => !v);
                                setOpenDropRight(null);
                                setUserMenuOpen(false);
                            }}
                        >
                            <span className="material-symbols-outlined text-xs">
                                {compactMode ? 'chevron_right' : 'chevron_left'}
                            </span>
                        </button>
                    )}
                </div>

                <nav ref={navRef} className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-4 py-4">
                    {primaryItems.map((item) => {
                        const active = isPathActive(currentUrl, item.href, item.activeMatch);
                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={cn(
                                    'mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                                    active
                                        ? 'bg-primary/10 font-semibold text-primary'
                                        : 'font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                )}
                            >
                                <span className={cn('material-symbols-outlined shrink-0', active ? 'text-primary' : 'text-muted-foreground')}>
                                    {item.icon}
                                </span>
                                {!compactMode && <span>{item.title}</span>}
                            </Link>
                        );
                    })}

                    {dynamicGroups.map((group, index) => {
                        const groupActive = group.items.some((item) => isPathActive(currentUrl, item.href, item.activeMatch));
                        const isAccordionOpen = openGroup === group.id;
                        const isDropRightOpen = openDropRight === group.id;
                        const prevGroup = index > 0 ? dynamicGroups[index - 1] : null;
                        const showLabel = !!group.label && group.label !== prevGroup?.label;

                        return (
                            <div key={group.id} className="group relative">
                                {showLabel && !compactMode && (
                                    <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                                        {group.label}
                                    </p>
                                )}
                                {showLabel && compactMode && (
                                    <div className="mx-3 mt-4 mb-1 border-t border-border" />
                                )}

                                <button
                                    type="button"
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                                        groupActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (compactMode) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setDropRightTop(rect.top);
                                            setOpenDropRight(openDropRight === group.id ? null : group.id);
                                            setUserMenuOpen(false);
                                            return;
                                        }
                                        setOpenGroupOverride({ url: currentUrl, value: openGroup === group.id ? '' : group.id });
                                    }}
                                >
                                    <span className={cn('material-symbols-outlined shrink-0', groupActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')}>
                                        {group.icon}
                                    </span>
                                    {!compactMode && (
                                        <>
                                            <span className={cn('flex-1 text-left text-sm', groupActive ? 'font-semibold' : 'font-medium')}>
                                                {group.title}
                                            </span>
                                            <span className={cn('material-symbols-outlined text-sm text-muted-foreground transition-transform', isAccordionOpen && 'rotate-180', groupActive && 'text-primary')}>
                                                expand_more
                                            </span>
                                        </>
                                    )}
                                </button>

                                {!compactMode && (
                                    <div className={cn('grid transition-[grid-template-rows] duration-300 ease-in-out', isAccordionOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                                        <div className="overflow-hidden">
                                            <div className="relative mt-1 ml-10 space-y-1">
                                                <div className="absolute top-0 bottom-4 left-[-18px] w-px bg-border" />
                                                {group.items.map((item) => {
                                                    const active = isPathActive(currentUrl, item.href, item.activeMatch);
                                                    return (
                                                        <Link
                                                            key={item.title}
                                                            href={item.href}
                                                            className={cn(
                                                                'relative flex items-center px-3 py-2 text-sm transition-colors',
                                                                active ? 'font-medium text-primary' : 'font-medium text-muted-foreground hover:text-primary',
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
                                            const active = isPathActive(currentUrl, item.href, item.activeMatch);
                                            return (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className={cn(
                                                        'mb-1 flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm',
                                                        active
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

                <div className="relative border-t border-border p-4" ref={userMenuRef}>
                    <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 transition-colors hover:bg-accent"
                        onClick={(e) => {
                            e.stopPropagation();
                            setUserMenuOpen(!userMenuOpen);
                            setOpenDropRight(null);
                        }}
                    >
                        <div className="signature-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
                            {userInitials}
                        </div>
                        {!compactMode && (
                            <>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-sm font-semibold">{user?.name}</p>
                                    <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
                                </div>
                                <span className="material-symbols-outlined text-lg text-muted-foreground">unfold_more</span>
                            </>
                        )}
                    </button>

                    <div
                        className={cn(
                            'z-50 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl transition-all duration-300',
                            compactMode ? 'fixed bottom-4 left-[4.5rem] w-56' : 'absolute right-4 bottom-full left-4 mb-2',
                            userMenuOpen ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0',
                        )}
                    >
                        <div className="py-1">
                            <Link
                                href={editProfile().url}
                                className="flex items-center px-4 py-3 text-sm text-popover-foreground hover:bg-accent"
                            >
                                <span className="material-symbols-outlined mr-3 text-muted-foreground">person</span>
                                Profile Settings
                            </Link>
                            <hr className="my-1 border-border" />
                            <button
                                type="button"
                                className="flex w-full items-center px-4 py-3 text-sm text-destructive hover:bg-destructive/10"
                                onClick={handleLogout}
                            >
                                <span className="material-symbols-outlined mr-3">logout</span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
