import { usePage } from '@inertiajs/react';
import type { Auth } from '@/types';

export function useCan() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions: Record<string, boolean> = auth?.can ?? {};
    const isSuperAdmin: boolean = auth?.user?.is_superadmin === true;

    function can(permission: string): boolean {
        return isSuperAdmin || permissions[permission] === true;
    }

    function canAny(perms: string[]): boolean {
        return isSuperAdmin || perms.some((p) => permissions[p] === true);
    }

    function canAll(perms: string[]): boolean {
        return isSuperAdmin || perms.every((p) => permissions[p] === true);
    }

    return { can, canAny, canAll, permissions, isSuperAdmin };
}
