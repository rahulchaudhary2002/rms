import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Role } from '@/types';

type PaginatedRoles = {
    data: Role[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    roles: PaginatedRoles;
    filters: { search?: string; level?: string; is_active?: string };
};

export default function RolesIndex({ roles, filters }: Props) {
    const { data, setData, get } = useForm({
        search: filters.search ?? '',
        level: filters.level ?? '',
        is_active: filters.is_active ?? '',
    });

    function applyFilter() {
        get('/access-control/roles', { preserveState: true, replace: true });
    }

    function confirmDelete(role: Role) {
        if (confirm(`Delete role "${role.name}"? This cannot be undone.`)) {
            router.delete(`/access-control/roles/${role.id}`);
        }
    }

    return (
        <>
            <Head title="Roles" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Roles' },
                ]}
                title="Roles"
                description="Manage system roles and their access levels."
                actions={
                    <Can permission="roles-create">
                        <Button asChild size="sm">
                            <Link href="/access-control/roles/create">
                                <Plus className="mr-1 h-4 w-4" />
                                New Role
                            </Link>
                        </Button>
                    </Can>
                }
            />

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
                <Input
                    placeholder="Search roles..."
                    className="max-w-xs"
                    value={data.search}
                    onChange={(e) => setData('search', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <Select value={data.level} onValueChange={(v) => { setData('level', v === 'all' ? '' : v); }}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="outlet">Outlet</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={data.is_active} onValueChange={(v) => { setData('is_active', v === 'all' ? '' : v); }}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={applyFilter}>Filter</Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">Name</th>
                            <th className="px-4 py-3 text-left font-semibold">Slug</th>
                            <th className="px-4 py-3 text-left font-semibold">Level</th>
                            <th className="px-4 py-3 text-left font-semibold">Permissions</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                            <th className="px-4 py-3 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {roles.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                    No roles found.
                                </td>
                            </tr>
                        )}
                        {roles.data.map((role) => (
                            <tr key={role.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3 font-medium">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                        {role.name}
                                        {role.is_system && (
                                            <Badge variant="secondary" className="text-[10px]">System</Badge>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{role.slug}</td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline" className="capitalize">{role.level}</Badge>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {(role as any).permissions_count ?? 0}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={role.is_active ? 'default' : 'secondary'}>
                                        {role.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Can permission="roles-update">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/access-control/roles/${role.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </Can>
                                        <Can permission="roles-delete">
                                            {!role.is_system && (
                                                <Button variant="ghost" size="icon" onClick={() => confirmDelete(role)}>
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

            {/* Pagination */}
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
