import type { PropsWithChildren } from 'react';

import SettingsLayoutShell from '@/components/settings-layout-shell';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return <SettingsLayoutShell>{children}</SettingsLayoutShell>;
}
