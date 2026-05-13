import { Link } from '@inertiajs/react';
import {
    KeyRound,
    LayoutGrid,
    Lock,
    Settings,
    ShieldCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { useCan } from '@/hooks/use-can';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import accessControl from '@/routes/access-control';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { can, isSuperAdmin } = useCan();
    const { isCurrentUrl } = useCurrentUrl();

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    const showRoles = isSuperAdmin || can('roles-view');
    const showPermissions = isSuperAdmin || can('permissions-view');
    const showManage = isSuperAdmin || can('access-control-manage');
    const showAccessControl =
        isSuperAdmin || showRoles || showPermissions || showManage;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {showAccessControl && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Access Control</SidebarGroupLabel>
                        <SidebarMenu>
                            {showRoles && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl(
                                            accessControl.roles.index(),
                                        )}
                                        tooltip={{ children: 'Roles' }}
                                    >
                                        <Link
                                            href={accessControl.roles.index()}
                                            prefetch
                                        >
                                            <ShieldCheck />
                                            <span>Roles</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}

                            {showPermissions && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl(
                                            accessControl.permissions.index(),
                                        )}
                                        tooltip={{ children: 'Permissions' }}
                                    >
                                        <Link
                                            href={accessControl.permissions.index()}
                                            prefetch
                                        >
                                            <KeyRound />
                                            <span>Permissions</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}

                            {showManage && (
                                <>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                accessControl.rolePermissions.index(),
                                            )}
                                            tooltip={{
                                                children: 'Role Permissions',
                                            }}
                                        >
                                            <Link
                                                href={accessControl.rolePermissions.index()}
                                                prefetch
                                            >
                                                <Lock />
                                                <span>Role Permissions</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                accessControl.userRoles.index(),
                                            )}
                                            tooltip={{ children: 'User Roles' }}
                                        >
                                            <Link
                                                href={accessControl.userRoles.index()}
                                                prefetch
                                            >
                                                <Users />
                                                <span>User Roles</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                accessControl.userPermissionOverrides.index(),
                                            )}
                                            tooltip={{
                                                children:
                                                    'Permission Overrides',
                                            }}
                                        >
                                            <Link
                                                href={accessControl.userPermissionOverrides.index()}
                                                prefetch
                                            >
                                                <Settings />
                                                <span>
                                                    Permission Overrides
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                accessControl.userResourcePermissions.index(),
                                            )}
                                            tooltip={{
                                                children:
                                                    'Resource Permissions',
                                            }}
                                        >
                                            <Link
                                                href={accessControl.userResourcePermissions.index()}
                                                prefetch
                                            >
                                                <Lock />
                                                <span>
                                                    Resource Permissions
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </>
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
