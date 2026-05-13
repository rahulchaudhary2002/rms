export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    is_superadmin: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Role = {
    id: number;
    name: string;
    slug: string;
    level: 'global' | 'outlet' | 'warehouse';
    description: string | null;
    is_system: boolean;
    is_active: boolean;
    permissions_count?: number;
    created_at: string;
    updated_at: string;
};

export type Permission = {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    level: 'global' | 'outlet' | 'warehouse';
    description: string | null;
    is_system: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type Auth = {
    user: User;
    roles: Pick<Role, 'id' | 'name' | 'slug' | 'level'>[];
    permissions: string[];
    can: Record<string, boolean>;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
