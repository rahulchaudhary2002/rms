import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as usersIndex, store as usersStore } from '@/routes/users';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

export default function UsersCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(usersStore.url());
    }

    return (
        <>
            <Head title="Create User" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'Users', href: usersIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create User"
                description="Add a new system account."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Account Details"
                    description="Set the user's name, email address and initial password."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Full Name" error={errors.name} className="md:col-span-2">
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Jane Smith"
                                autoComplete="off"
                            />
                        </FormField>

                        <FormField label="Email Address" error={errors.email} className="md:col-span-2">
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="jane@example.com"
                                autoComplete="off"
                            />
                        </FormField>

                        <FormField label="Password" error={errors.password}>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Min. 8 characters"
                                autoComplete="new-password"
                            />
                        </FormField>

                        <FormField label="Confirm Password" error={errors.password_confirmation}>
                            <Input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Repeat password"
                                autoComplete="new-password"
                            />
                        </FormField>

                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link href={usersIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create User
                    </button>
                </div>
            </form>
        </>
    );
}
