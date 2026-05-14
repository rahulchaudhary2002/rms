import AppLayoutShell from '@/components/app-layout-shell';
import type { AppLayoutProps } from '@/types';

export default function AppLayout({ children }: AppLayoutProps) {
    return <AppLayoutShell>{children}</AppLayoutShell>;
}
