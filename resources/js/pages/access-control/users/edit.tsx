import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as usersIndex, update as usersUpdate } from '@/routes/users';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

type User = {
    id: number;
    name: string;
    email: string;
    is_superadmin: boolean;
    email_verified_at: string | null;
    created_at: string;
};

export default function UsersEdit({ user }: { user: User }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(usersUpdate.url(user.id));
    }

    return (
        <>
            <Head title={`Edit ${user.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'Users', href: usersIndex.url() },
                    { label: user.name },
                ]}
                title={`Edit ${user.name}`}
                description={`Account created ${new Date(user.created_at).toLocaleDateString()}`}
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Account Details"
                    description="Update the user's name and email address."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Full Name" error={errors.name} className="md:col-span-2">
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Email Address" error={errors.email} className="md:col-span-2">
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Email Status">
                            <div className="flex h-11 items-center">
                                <span className={
                                    user.email_verified_at
                                        ? 'rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-700 uppercase dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold tracking-wider text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-400'
                                }>
                                    {user.email_verified_at
                                        ? `Verified ${new Date(user.email_verified_at).toLocaleDateString()}`
                                        : 'Not verified'}
                                </span>
                            </div>
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Change Password"
                    description="Leave blank to keep the current password."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="New Password" error={errors.password}>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Min. 8 characters"
                                autoComplete="new-password"
                            />
                        </FormField>

                        <FormField label="Confirm New Password" error={errors.password_confirmation}>
                            <Input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Repeat new password"
                                autoComplete="new-password"
                            />
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link href={usersIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    );
}
