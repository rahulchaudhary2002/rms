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
type Override = {
    id: number;
    user: User;
    permission: Permission;
    scope_type: string;
    scope_id: number | null;
    effect: 'allow' | 'deny';
    reason: string | null;
    is_active: boolean;
    assigned_by: User | null;
    created_at: string;
};
type Paginated = {
    data: Override[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
};

type Props = { overrides: Paginated; users: User[]; permissions: Permission[]; filters: Record<string, string> };

export default function UserPermissionOverrides({ overrides, users, permissions, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    const filterForm = useForm({ user_id: filters.user_id ?? '', permission_id: filters.permission_id ?? '', scope_type: filters.scope_type ?? '', effect: filters.effect ?? '', is_active: filters.is_active ?? '' });
    const addForm = useForm({ user_id: '', permission_id: '', scope_type: 'global', scope_id: '', effect: 'allow', reason: '', is_active: true });

    function applyFilter() {
        filterForm.get('/access-control/user-permission-overrides', { preserveState: true, replace: true });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        addForm.post('/access-control/user-permission-overrides', { onSuccess: () => addForm.reset() });
    }

    return (
        <>
            <Head title="Permission Overrides" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Permission Overrides' },
                ]}
                title="User Permission Overrides"
                description="Grant or deny specific permissions per user, overriding role defaults."
            />

            {flash?.success && (
                <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {flash.success}
                </div>
            )}

            {/* Add form */}
            <div className="mb-8 rounded-xl border border-border p-5">
                <h3 className="mb-4 text-sm font-semibold">Add Override</h3>
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
                        <Label>Scope Type</Label>
                        <Select value={addForm.data.scope_type} onValueChange={(v) => { addForm.setData('scope_type', v); if (v === 'global') addForm.setData('scope_id', ''); }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Global</SelectItem>
                                <SelectItem value="outlet">Outlet</SelectItem>
                                <SelectItem value="warehouse">Warehouse</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {addForm.data.scope_type !== 'global' && (
                        <div className="space-y-1.5">
                            <Label>Scope ID</Label>
                            <Input type="number" value={addForm.data.scope_id} onChange={(e) => addForm.setData('scope_id', e.target.value)} placeholder="ID" />
                            <InputError message={addForm.errors.scope_id} />
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label>Reason (optional)</Label>
                        <Input value={addForm.data.reason} onChange={(e) => addForm.setData('reason', e.target.value)} placeholder="Why this override?" />
                    </div>
                    <div className="col-span-full">
                        <Button type="submit" disabled={addForm.processing}>Save Override</Button>
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
                            <th className="px-4 py-3 text-left font-semibold">Scope</th>
                            <th className="px-4 py-3 text-left font-semibold">Effect</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                            <th className="px-4 py-3 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {overrides.data.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No overrides found.</td></tr>
                        )}
                        {overrides.data.map((o) => (
                            <tr key={o.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{o.user?.name}</div>
                                    <div className="text-xs text-muted-foreground">{o.user?.email}</div>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">{o.permission?.slug}</td>
                                <td className="px-4 py-3 capitalize">
                                    {o.scope_type}{o.scope_id ? ` #${o.scope_id}` : ''}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={o.effect === 'allow' ? 'default' : 'destructive'} className="capitalize">{o.effect}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={o.is_active ? 'default' : 'secondary'}>{o.is_active ? 'Active' : 'Inactive'}</Badge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon"
                                            onClick={() => router.patch(`/access-control/user-permission-overrides/${o.id}`, { is_active: !o.is_active }, { preserveScroll: true })}>
                                            {o.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon"
                                            onClick={() => confirm('Remove this override?') && router.delete(`/access-control/user-permission-overrides/${o.id}`, { preserveScroll: true })}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {overrides.last_page > 1 && (
                <div className="mt-4 flex justify-center gap-1">
                    {overrides.links.map((link, i) => (
                        <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url}
                            onClick={() => link.url && router.get(link.url)} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}
        </>
    );
}
