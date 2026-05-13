import { Head, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import type { Permission } from '@/types';

const COMMON_ACTIONS = ['view', 'create', 'update', 'delete', 'approve', 'export', 'manage'];

type Props = { permission: Permission };

export default function PermissionsEdit({ permission }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name,
        slug: permission.slug,
        module: permission.module,
        action: permission.action,
        level: permission.level,
        description: permission.description ?? '',
        is_active: permission.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/access-control/permissions/${permission.id}`);
    }

    return (
        <>
            <Head title={`Edit Permission: ${permission.slug}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Permissions', href: '/access-control/permissions' },
                    { label: permission.slug },
                ]}
                title={`Edit Permission: ${permission.slug}`}
            />

            <div className="max-w-lg">
                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Display Name</Label>
                        <Input id="name" value={data.name} disabled={permission.is_system} onChange={(e) => setData('name', e.target.value)} />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="module">Module</Label>
                            <Input id="module" value={data.module} disabled={permission.is_system} onChange={(e) => setData('module', e.target.value)} />
                            <InputError message={errors.module} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Action</Label>
                            <Select value={data.action} onValueChange={(v) => setData('action', v)} disabled={permission.is_system}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {COMMON_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.action} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" value={data.slug} disabled={permission.is_system} onChange={(e) => setData('slug', e.target.value)} />
                        <InputError message={errors.slug} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Level</Label>
                        <Select value={data.level} onValueChange={(v) => setData('level', v)} disabled={permission.is_system}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Global</SelectItem>
                                <SelectItem value="outlet">Outlet</SelectItem>
                                <SelectItem value="warehouse">Warehouse</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Status</Label>
                        <Select value={data.is_active ? 'true' : 'false'} onValueChange={(v) => setData('is_active', v === 'true')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                    </div>

                    {permission.is_system && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">System permissions have limited editing.</p>
                    )}

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>Save Changes</Button>
                        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
                    </div>
                </form>
            </div>
        </>
    );
}
