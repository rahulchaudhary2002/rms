import { Head, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';

const COMMON_ACTIONS = ['view', 'create', 'update', 'delete', 'approve', 'export', 'manage'];

export default function PermissionsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        module: '',
        action: '',
        level: 'global',
        description: '',
        is_active: true,
    });

    function syncSlug(module: string, action: string) {
        if (module && action) {
            setData('slug', `${module}.${action}`);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/access-control/permissions');
    }

    return (
        <>
            <Head title="Create Permission" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Permissions', href: '/access-control/permissions' },
                    { label: 'Create' },
                ]}
                title="Create Permission"
            />

            <div className="max-w-lg">
                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. View Inventory"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="module">Module</Label>
                            <Input
                                id="module"
                                value={data.module}
                                onChange={(e) => {
                                    setData('module', e.target.value);
                                    syncSlug(e.target.value, data.action);
                                }}
                                placeholder="e.g. inventory"
                            />
                            <InputError message={errors.module} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Action</Label>
                            <Select value={data.action} onValueChange={(v) => {
                                setData('action', v);
                                syncSlug(data.module, v);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMMON_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.action} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            placeholder="module.action"
                        />
                        <InputError message={errors.slug} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Level</Label>
                        <Select value={data.level} onValueChange={(v) => setData('level', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Global</SelectItem>
                                <SelectItem value="outlet">Outlet</SelectItem>
                                <SelectItem value="warehouse">Warehouse</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.level} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>Create Permission</Button>
                        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
                    </div>
                </form>
            </div>
        </>
    );
}
