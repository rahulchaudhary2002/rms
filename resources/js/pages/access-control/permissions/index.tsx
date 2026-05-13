import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Permission } from '@/types';

type PaginatedPermissions = {
    data: Permission[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
};

type Props = {
    permissions: PaginatedPermissions;
    modules: string[];
    actions: string[];
    filters: Record<string, string>;
};

export default function PermissionsIndex({ permissions, modules, actions, filters }: Props) {
    const { data, setData, get } = useForm({
        search: filters.search ?? '',
        module: filters.module ?? '',
        action: filters.action ?? '',
        level: filters.level ?? '',
        is_active: filters.is_active ?? '',
    });

    function applyFilter() {
        get('/access-control/permissions', { preserveState: true, replace: true });
    }

    function confirmDelete(permission: Permission) {
        if (confirm(`Delete permission "${permission.slug}"?`)) {
            router.delete(`/access-control/permissions/${permission.id}`);
        }
    }

    return (
        <>
            <Head title="Permissions" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Permissions' },
                ]}
                title="Permissions"
                description="Manage available system permissions."
                actions={
                    <Can permission="permissions-create">
                        <Button asChild size="sm">
                            <Link href="/access-control/permissions/create">
                                <Plus className="mr-1 h-4 w-4" />
                                New Permission
                            </Link>
                        </Button>
                    </Can>
                }
            />

            <div className="mb-6 flex flex-wrap gap-3">
                <Input
                    placeholder="Search..."
                    className="max-w-xs"
                    value={data.search}
                    onChange={(e) => setData('search', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <Select value={data.module} onValueChange={(v) => setData('module', v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="All Modules" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={data.action} onValueChange={(v) => setData('action', v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={applyFilter}>Filter</Button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">Name</th>
                            <th className="px-4 py-3 text-left font-semibold">Slug</th>
                            <th className="px-4 py-3 text-left font-semibold">Module</th>
                            <th className="px-4 py-3 text-left font-semibold">Action</th>
                            <th className="px-4 py-3 text-left font-semibold">Level</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                            <th className="px-4 py-3 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {permissions.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No permissions found.</td>
                            </tr>
                        )}
                        {permissions.data.map((perm) => (
                            <tr key={perm.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3 font-mono text-xs">
                                    {perm.name}
                                    {perm.is_system && <Badge variant="secondary" className="ml-2 text-[10px]">System</Badge>}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">{perm.slug}</td>
                                <td className="px-4 py-3">{perm.module}</td>
                                <td className="px-4 py-3">{perm.action}</td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline" className="capitalize">{perm.level}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={perm.is_active ? 'default' : 'secondary'}>
                                        {perm.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Can permission="permissions-update">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/access-control/permissions/${perm.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </Can>
                                        <Can permission="permissions-delete">
                                            {!perm.is_system && (
                                                <Button variant="ghost" size="icon" onClick={() => confirmDelete(perm)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </Can>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {permissions.last_page > 1 && (
                <div className="mt-4 flex justify-center gap-1">
                    {permissions.links.map((link, i) => (
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
