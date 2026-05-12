import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { PageHeader } from '@/components/page-header';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { dashboard } from '@/routes';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard().url },
                    { label: 'Settings', href: editProfile().url },
                    { label: 'Appearance' },
                ]}
                title="Appearance settings"
                description="Update your account's appearance settings"
            />
            <div className="space-y-6">
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
