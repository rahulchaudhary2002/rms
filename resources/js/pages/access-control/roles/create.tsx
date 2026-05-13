import { Head, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';

export default function RolesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        level: 'global',
        description: '',
        is_active: true,
    });

    function slugify(value: string) {
        return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/access-control/roles');
    }

    return (
        <>
            <Head title="Create Role" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Roles', href: '/access-control/roles' },
                    { label: 'Create' },
                ]}
                title="Create Role"
            />

            <div className="max-w-lg">
                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => {
                                setData('name', e.target.value);
                                setData('slug', slugify(e.target.value));
                            }}
                            placeholder="e.g. Store Manager"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', slugify(e.target.value))}
                            placeholder="e.g. store-manager"
                        />
                        <InputError message={errors.slug} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Level</Label>
                        <Select value={data.level} onValueChange={(v) => setData('level', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
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
                            placeholder="Optional description"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>Create Role</Button>
                        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
                    </div>
                </form>
            </div>
        </>
    );
}
