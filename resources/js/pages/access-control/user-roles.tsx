import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import type { Role } from '@/types';

type User = { id: number; name: string; email: string };
type Assignment = {
    id: number;
    user: User;
    role: Role;
    scope_type: string;
    scope_id: number | null;
    is_active: boolean;
    assigned_by: User | null;
    created_at: string;
};
type PaginatedAssignments = {
    data: Assignment[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
};

type Props = {
    assignments: PaginatedAssignments;
    users: User[];
    roles: Role[];
    filters: Record<string, string>;
};

export default function UserRoles({ assignments, users, roles, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    const filterForm = useForm({ user_id: filters.user_id ?? '', role_id: filters.role_id ?? '', scope_type: filters.scope_type ?? '', is_active: filters.is_active ?? '' });
    const assignForm = useForm({ user_id: '', role_id: '', scope_type: 'global', scope_id: '' });

    function applyFilter() {
        filterForm.get('/access-control/user-roles', { preserveState: true, replace: true });
    }

    function assign(e: React.FormEvent) {
        e.preventDefault();
        assignForm.post('/access-control/user-roles', { onSuccess: () => assignForm.reset() });
    }

    return (
        <>
            <Head title="User Role Assignments" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'User Roles' },
                ]}
                title="User Role Assignments"
                description="Assign roles to users with optional scope."
            />

            {flash?.success && (
                <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {flash.success}
                </div>
            )}

            {/* Assign form */}
            <div className="mb-8 rounded-xl border border-border p-5">
                <h3 className="mb-4 text-sm font-semibold">Assign Role</h3>
                <form onSubmit={assign} className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="space-y-1.5">
                        <Label>User</Label>
                        <Select value={assignForm.data.user_id} onValueChange={(v) => assignForm.setData('user_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                            <SelectContent>
                                {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={assignForm.errors.user_id} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Role</Label>
                        <Select value={assignForm.data.role_id} onValueChange={(v) => assignForm.setData('role_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={assignForm.errors.role_id} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Scope Type</Label>
                        <Select value={assignForm.data.scope_type} onValueChange={(v) => { assignForm.setData('scope_type', v); if (v === 'global') assignForm.setData('scope_id', ''); }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Global</SelectItem>
                                <SelectItem value="outlet">Outlet</SelectItem>
                                <SelectItem value="warehouse">Warehouse</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {assignForm.data.scope_type !== 'global' && (
                        <div className="space-y-1.5">
                            <Label>Scope ID</Label>
                            <Input
                                type="number"
                                value={assignForm.data.scope_id}
                                onChange={(e) => assignForm.setData('scope_id', e.target.value)}
                                placeholder="ID"
                            />
                            <InputError message={assignForm.errors.scope_id} />
                        </div>
                    )}
                    <div className="col-span-full">
                        <Button type="submit" disabled={assignForm.processing}>Assign Role</Button>
                    </div>
                </form>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3">
                <Select value={filterForm.data.user_id} onValueChange={(v) => filterForm.setData('user_id', v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="All Users" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterForm.data.role_id} onValueChange={(v) => filterForm.setData('role_id', v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="All Roles" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={applyFilter}>Filter</Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">User</th>
                            <th className="px-4 py-3 text-left font-semibold">Role</th>
                            <th className="px-4 py-3 text-left font-semibold">Scope</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                            <th className="px-4 py-3 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {assignments.data.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No assignments found.</td></tr>
                        )}
                        {assignments.data.map((a) => (
                            <tr key={a.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{a.user?.name}</div>
                                    <div className="text-xs text-muted-foreground">{a.user?.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline">{a.role?.name}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="capitalize">{a.scope_type}</span>
                                    {a.scope_id && <span className="ml-1 text-muted-foreground">#{a.scope_id}</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={a.is_active ? 'default' : 'secondary'}>{a.is_active ? 'Active' : 'Inactive'}</Badge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title={a.is_active ? 'Deactivate' : 'Activate'}
                                            onClick={() => router.patch(`/access-control/user-roles/${a.id}`, { is_active: !a.is_active }, { preserveScroll: true })}
                                        >
                                            {a.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => confirm('Remove this role assignment?') && router.delete(`/access-control/user-roles/${a.id}`, { preserveScroll: true })}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {assignments.last_page > 1 && (
                <div className="mt-4 flex justify-center gap-1">
                    {assignments.links.map((link, i) => (
                        <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url}
                            onClick={() => link.url && router.get(link.url)} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}
        </>
    );
}
