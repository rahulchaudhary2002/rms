import { Head, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import type { Role } from '@/types';

type Props = { role: Role };

export default function RolesEdit({ role }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        slug: role.slug,
        level: role.level,
        description: role.description ?? '',
        is_active: role.is_active,
    });

    function slugify(value: string) {
        return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/access-control/roles/${role.id}`);
    }

    return (
        <>
            <Head title={`Edit Role: ${role.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Roles', href: '/access-control/roles' },
                    { label: role.name },
                ]}
                title={`Edit Role: ${role.name}`}
            />

            <div className="max-w-lg">
                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            disabled={role.is_system}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            disabled={role.is_system}
                            onChange={(e) => setData('slug', slugify(e.target.value))}
                        />
                        <InputError message={errors.slug} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Level</Label>
                        <Select value={data.level} onValueChange={(v) => setData('level', v)} disabled={role.is_system}>
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
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Status</Label>
                        <Select value={data.is_active ? 'true' : 'false'} onValueChange={(v) => setData('is_active', v === 'true')}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.is_active} />
                    </div>

                    {role.is_system && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            System roles have limited editing. Slug and level are locked.
                        </p>
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
