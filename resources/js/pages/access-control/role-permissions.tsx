import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Role, Permission } from '@/types';

type PaginatedRoles = {
    data: (Role & { permissions: Permission[] })[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
};

type Props = {
    roles: PaginatedRoles;
    permissions: Permission[];
    filters: Record<string, string>;
};

export default function RolePermissions({ roles, permissions, filters }: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);
    const { data, setData, get } = useForm({ search: filters.search ?? '', level: filters.level ?? '' });

    const permsByModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
    }, {});

    function applyFilter() {
        get('/access-control/role-permissions', { preserveState: true, replace: true });
    }

    function toggle(permId: number, role: Role & { permissions: Permission[] }) {
        const has = role.permissions.some((p) => p.id === permId);
        if (has) {
            router.delete('/access-control/role-permissions', {
                data: { role_id: role.id, permission_id: permId },
                preserveScroll: true,
            });
        } else {
            router.post('/access-control/role-permissions', {
                role_id: role.id,
                permission_ids: [permId],
            }, { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Role Permissions" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Role Permissions' },
                ]}
                title="Role Permissions"
                description="Assign permissions to roles."
            />

            <div className="mb-6 flex gap-3">
                <Input
                    placeholder="Search roles..."
                    className="max-w-xs"
                    value={data.search}
                    onChange={(e) => setData('search', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <Select value={data.level} onValueChange={(v) => setData('level', v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="All Levels" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="outlet">Outlet</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={applyFilter}>Filter</Button>
            </div>

            <div className="space-y-2">
                {roles.data.map((role) => (
                    <div key={role.id} className="rounded-xl border border-border overflow-hidden">
                        <button
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                            onClick={() => setExpanded(expanded === role.id ? null : role.id)}
                        >
                            <div className="flex items-center gap-3">
                                {expanded === role.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="font-medium">{role.name}</span>
                                <Badge variant="outline" className="capitalize">{role.level}</Badge>
                                {role.is_system && <Badge variant="secondary" className="text-[10px]">System</Badge>}
                            </div>
                            <span className="text-sm text-muted-foreground">{role.permissions.length} permissions</span>
                        </button>

                        {expanded === role.id && (
                            <div className="border-t border-border p-4">
                                {Object.entries(permsByModule).map(([module, perms]) => (
                                    <div key={module} className="mb-4">
                                        <h4 className="mb-2 text-xs font-bold tracking-widest uppercase text-muted-foreground">{module}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {perms.map((perm) => {
                                                const has = role.permissions.some((p) => p.id === perm.id);
                                                return (
                                                    <button
                                                        key={perm.id}
                                                        onClick={() => toggle(perm.id, role)}
                                                        className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                                                            has
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-border bg-background hover:border-primary/50'
                                                        }`}
                                                    >
                                                        {has ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                                        {perm.action}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {roles.last_page > 1 && (
                <div className="mt-4 flex justify-center gap-1">
                    {roles.links.map((link, i) => (
                        <Button
                            key={i}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            onClick={() => link.url && router.get(link.url)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
