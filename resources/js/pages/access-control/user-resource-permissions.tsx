import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import type { Permission } from '@/types';

type User = { id: number; name: string; email: string };
type ResourcePerm = {
    id: number;
    user: User;
    permission: Permission;
    resource_type: string;
    resource_id: number;
    effect: 'allow' | 'deny';
    reason: string | null;
    is_active: boolean;
    assigned_by: User | null;
    created_at: string;
};
type Paginated = {
    data: ResourcePerm[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
};

type Props = { resourcePerms: Paginated; users: User[]; permissions: Permission[]; resourceTypes: string[]; filters: Record<string, string> };

export default function UserResourcePermissions({ resourcePerms, users, permissions, resourceTypes, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    const filterForm = useForm({ user_id: filters.user_id ?? '', permission_id: filters.permission_id ?? '', resource_type: filters.resource_type ?? '', effect: filters.effect ?? '', is_active: filters.is_active ?? '' });
    const addForm = useForm({ user_id: '', permission_id: '', resource_type: '', resource_id: '', effect: 'allow', reason: '', is_active: true });

    function applyFilter() {
        filterForm.get('/access-control/user-resource-permissions', { preserveState: true, replace: true });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        addForm.post('/access-control/user-resource-permissions', { onSuccess: () => addForm.reset() });
    }

    return (
        <>
            <Head title="Resource Permissions" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Resource Permissions' },
                ]}
                title="User Resource Permissions"
                description="Grant or deny access to specific resource instances."
            />

            {flash?.success && (
                <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {flash.success}
                </div>
            )}

            {/* Add form */}
            <div className="mb-8 rounded-xl border border-border p-5">
                <h3 className="mb-4 text-sm font-semibold">Add Resource Permission</h3>
                <form onSubmit={submit} className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                        <Label>User</Label>
                        <Select value={addForm.data.user_id} onValueChange={(v) => addForm.setData('user_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                            <SelectContent>
                                {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={addForm.errors.user_id} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Permission</Label>
                        <Select value={addForm.data.permission_id} onValueChange={(v) => addForm.setData('permission_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Select permission" /></SelectTrigger>
                            <SelectContent>
                                {permissions.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.slug}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={addForm.errors.permission_id} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Resource Type</Label>
                        <Input
                            value={addForm.data.resource_type}
                            onChange={(e) => addForm.setData('resource_type', e.target.value)}
                            list="resource-types"
                            placeholder="e.g. user, outlet"
                        />
                        <datalist id="resource-types">
                            {resourceTypes.map((t) => <option key={t} value={t} />)}
                        </datalist>
                        <InputError message={addForm.errors.resource_type} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Resource ID</Label>
                        <Input type="number" value={addForm.data.resource_id} onChange={(e) => addForm.setData('resource_id', e.target.value)} placeholder="e.g. 42" />
                        <InputError message={addForm.errors.resource_id} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Effect</Label>
                        <Select value={addForm.data.effect} onValueChange={(v) => addForm.setData('effect', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="allow">Allow</SelectItem>
                                <SelectItem value="deny">Deny</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Reason (optional)</Label>
                        <Input value={addForm.data.reason} onChange={(e) => addForm.setData('reason', e.target.value)} placeholder="Optional reason" />
                    </div>
                    <div className="col-span-full">
                        <Button type="submit" disabled={addForm.processing}>Save Permission</Button>
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
                <Select value={filterForm.data.resource_type} onValueChange={(v) => filterForm.setData('resource_type', v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="All Resource Types" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {resourceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterForm.data.effect} onValueChange={(v) => filterForm.setData('effect', v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="All Effects" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Effects</SelectItem>
                        <SelectItem value="allow">Allow</SelectItem>
                        <SelectItem value="deny">Deny</SelectItem>
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
                            <th className="px-4 py-3 text-left font-semibold">Permission</th>
                            <th className="px-4 py-3 text-left font-semibold">Resource</th>
                            <th className="px-4 py-3 text-left font-semibold">Effect</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                            <th className="px-4 py-3 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {resourcePerms.data.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No resource permissions found.</td></tr>
                        )}
                        {resourcePerms.data.map((rp) => (
                            <tr key={rp.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{rp.user?.name}</div>
                                    <div className="text-xs text-muted-foreground">{rp.user?.email}</div>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">{rp.permission?.slug}</td>
                                <td className="px-4 py-3">
                                    <span className="font-medium">{rp.resource_type}</span>
                                    <span className="ml-1 text-muted-foreground">#{rp.resource_id}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={rp.effect === 'allow' ? 'default' : 'destructive'} className="capitalize">{rp.effect}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={rp.is_active ? 'default' : 'secondary'}>{rp.is_active ? 'Active' : 'Inactive'}</Badge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon"
                                            onClick={() => router.patch(`/access-control/user-resource-permissions/${rp.id}`, { is_active: !rp.is_active }, { preserveScroll: true })}>
                                            {rp.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon"
                                            onClick={() => confirm('Remove this resource permission?') && router.delete(`/access-control/user-resource-permissions/${rp.id}`, { preserveScroll: true })}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {resourcePerms.last_page > 1 && (
                <div className="mt-4 flex justify-center gap-1">
                    {resourcePerms.links.map((link, i) => (
                        <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url}
                            onClick={() => link.url && router.get(link.url)} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}
        </>
    );
}
