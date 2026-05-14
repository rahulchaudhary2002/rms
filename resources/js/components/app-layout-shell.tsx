import type { ReactNode } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';

type Props = {
    children: ReactNode;
};

export default function AppLayoutShell({ children }: Props) {
    return (
        <div
            id="app-shell"
            className="relative flex h-screen overflow-hidden bg-background font-sans text-foreground transition-colors duration-200 dark:bg-background dark:text-foreground"
        >
            <AppSidebar />

            <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background dark:bg-background">
                <AppHeader />

                <div
                    id="app-content"
                    className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-12"
                >
                    {children}
                </div>

                <div className="signature-gradient h-1 w-full shrink-0" />
            </main>
        </div>
    );
}
