import type { ReactNode } from 'react';
import { useCan } from '@/hooks/use-can';

export function Can({ permission, children, fallback }: { permission: string; children: ReactNode; fallback?: ReactNode }) {
    const { can } = useCan();
    return can(permission) ? <>{children}</> : <>{fallback ?? null}</>;
}

export function CanAny({ permissions, children, fallback }: { permissions: string[]; children: ReactNode; fallback?: ReactNode }) {
    const { canAny } = useCan();
    return canAny(permissions) ? <>{children}</> : <>{fallback ?? null}</>;
}

export function CanAll({ permissions, children, fallback }: { permissions: string[]; children: ReactNode; fallback?: ReactNode }) {
    const { canAll } = useCan();
    return canAll(permissions) ? <>{children}</> : <>{fallback ?? null}</>;
}
