import AppLayoutShell from '@/components/app-layout-shell';
import type { AppLayoutProps } from '@/types';

export default function AppLayout({ children, breadcrumbs }: AppLayoutProps) {
    return (
        <AppLayoutShell breadcrumbs={breadcrumbs}>{children}</AppLayoutShell>
    );
}
