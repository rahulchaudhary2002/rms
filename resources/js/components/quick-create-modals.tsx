import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { store as permissionsStore } from '@/routes/access-control/permissions';
import { store as rolesStore } from '@/routes/access-control/roles';
import { store as countriesStore } from '@/routes/countries';
import { store as categoriesStore } from '@/routes/ingredient-categories';
import { store as statesStore } from '@/routes/states';
import { store as unitsStore } from '@/routes/units';
import { store as usersStore } from '@/routes/users';
import type { Country } from '@/types';

type CountryOption = Pick<Country, 'id' | 'name'>;

function currentUrl() {
    if (typeof window === 'undefined') {
        return '';
    }

    return `${window.location.pathname}${window.location.search}`;
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-.]/g, '');
}

function ModalActions({
    processing,
    submitLabel,
    onCancel,
}: {
    processing: boolean;
    submitLabel: string;
    onCancel: () => void;
}) {
    return (
        <DialogFooter>
            <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={processing}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {submitLabel}
            </button>
        </DialogFooter>
    );
}

export function QuickCreateUserModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        _redirect: currentUrl(),
    });

    function close() {
        reset();
        onClose();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(usersStore.url(), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: close,
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    close();
                }
            }}
        >
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Add User</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Full Name" error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Jane Smith"
                            autoComplete="off"
                        />
                    </FormField>
                    <FormField label="Email Address" error={errors.email}>
                        <Input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="jane@example.com"
                            autoComplete="off"
                        />
                    </FormField>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Password" error={errors.password}>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                autoComplete="new-password"
                            />
                        </FormField>
                        <FormField
                            label="Confirm"
                            error={errors.password_confirmation}
                        >
                            <Input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                autoComplete="new-password"
                            />
                        </FormField>
                    </div>
                    <ModalActions
                        processing={processing}
                        submitLabel="Create User"
                        onCancel={close}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateRoleModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        slug: '',
        level: 'global',
        rank: 100,
        is_assignable: true,
        description: '',
        is_active: true,
        _redirect: currentUrl(),
    });

    function close() {
        reset();
        onClose();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(rolesStore.url(), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: close,
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    close();
                }
            }}
        >
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Add Role</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Name" error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={(e) => {
                                setData('name', e.target.value);
                                setData('slug', slugify(e.target.value));
                            }}
                            placeholder="e.g. Store Manager"
                        />
                    </FormField>
                    <FormField label="Slug" error={errors.slug}>
                        <Input
                            value={data.slug}
                            onChange={(e) =>
                                setData('slug', slugify(e.target.value))
                            }
                        />
                    </FormField>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Level" error={errors.level}>
                            <SearchableSelect
                                value={data.level}
                                onChange={(e) =>
                                    setData('level', e.target.value)
                                }
                            >
                                <option value="global">Global</option>
                                <option value="outlet">Outlet</option>
                                <option value="warehouse">Warehouse</option>
                            </SearchableSelect>
                        </FormField>
                        <FormField label="Rank" error={errors.rank}>
                            <Input
                                type="number"
                                min={1}
                                max={999}
                                value={data.rank}
                                onChange={(e) =>
                                    setData(
                                        'rank',
                                        parseInt(e.target.value, 10) || 100,
                                    )
                                }
                            />
                        </FormField>
                    </div>
                    <ModalActions
                        processing={processing}
                        submitLabel="Create Role"
                        onCancel={close}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreatePermissionModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        slug: '',
        module: '',
        action: '',
        level: 'global',
        description: '',
        is_active: true,
        _redirect: currentUrl(),
    });

    function close() {
        reset();
        onClose();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(permissionsStore.url(), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: close,
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    close();
                }
            }}
        >
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Add Permission</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Name" error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={(e) => {
                                setData('name', e.target.value);
                                setData('slug', slugify(e.target.value));
                            }}
                            placeholder="e.g. View Reports"
                        />
                    </FormField>
                    <FormField label="Slug" error={errors.slug}>
                        <Input
                            value={data.slug}
                            onChange={(e) =>
                                setData('slug', slugify(e.target.value))
                            }
                            placeholder="e.g. reports-view"
                        />
                    </FormField>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Module" error={errors.module}>
                            <Input
                                value={data.module}
                                onChange={(e) =>
                                    setData('module', e.target.value)
                                }
                                placeholder="reports"
                            />
                        </FormField>
                        <FormField label="Action" error={errors.action}>
                            <Input
                                value={data.action}
                                onChange={(e) =>
                                    setData('action', e.target.value)
                                }
                                placeholder="view"
                            />
                        </FormField>
                    </div>
                    <FormField label="Level" error={errors.level}>
                        <SearchableSelect
                            value={data.level}
                            onChange={(e) => setData('level', e.target.value)}
                        >
                            <option value="global">Global</option>
                            <option value="outlet">Outlet</option>
                            <option value="warehouse">Warehouse</option>
                        </SearchableSelect>
                    </FormField>
                    <ModalActions
                        processing={processing}
                        submitLabel="Create Permission"
                        onCancel={close}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateCountryModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        is_active: true,
        _redirect: currentUrl(),
    });

    function close() {
        reset();
        onClose();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(countriesStore.url(), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: close,
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    close();
                }
            }}
        >
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Add Country</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Name" error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Nepal"
                        />
                    </FormField>
                    <FormField label="Code" error={errors.code}>
                        <Input
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder="e.g. NP"
                        />
                    </FormField>
                    <ModalActions
                        processing={processing}
                        submitLabel="Create Country"
                        onCancel={close}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateStateModal({
    open,
    onClose,
    countries,
    defaultCountryId = '',
}: {
    open: boolean;
    onClose: () => void;
    countries: CountryOption[];
    defaultCountryId?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        country_id: defaultCountryId,
        name: '',
        code: '',
        is_active: true,
        _redirect: currentUrl(),
    });

    useEffect(() => {
        if (open) {
            setData('country_id', defaultCountryId);
        }
    }, [defaultCountryId, open, setData]);

    function close() {
        reset();
        onClose();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(statesStore.url(), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: close,
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    close();
                }
            }}
        >
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Add State</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Country" error={errors.country_id}>
                        <SearchableSelect
                            value={data.country_id}
                            onChange={(e) =>
                                setData('country_id', e.target.value)
                            }
                        >
                            <option value="">Select Country</option>
                            {countries.map((country) => (
                                <option key={country.id} value={country.id}>
                                    {country.name}
                                </option>
                            ))}
                        </SearchableSelect>
                    </FormField>
                    <FormField label="Name" error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Sudurpaschim"
                        />
                    </FormField>
                    <FormField label="Code" error={errors.code}>
                        <Input
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder="e.g. SP"
                        />
                    </FormField>
                    <ModalActions
                        processing={processing}
                        submitLabel="Create State"
                        onCancel={close}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateUnitModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        short_name: '',
        type: 'quantity',
        is_base: false,
        is_active: true,
        _redirect: currentUrl(),
    });

    function close() {
        reset();
        onClose();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(unitsStore.url(), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: close,
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    close();
                }
            }}
        >
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Add Unit</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Name" error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Kilogram"
                        />
                    </FormField>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Short Name" error={errors.short_name}>
                            <Input
                                value={data.short_name}
                                onChange={(e) =>
                                    setData('short_name', e.target.value)
                                }
                                placeholder="kg"
                            />
                        </FormField>
                        <FormField label="Type" error={errors.type}>
                            <SearchableSelect
                                value={data.type}
                                onChange={(e) =>
                                    setData('type', e.target.value)
                                }
                            >
                                <option value="weight">Weight</option>
                                <option value="volume">Volume</option>
                                <option value="quantity">Quantity</option>
                                <option value="custom">Custom</option>
                            </SearchableSelect>
                        </FormField>
                    </div>
                    <FormField label="Base Unit" error={errors.is_base}>
                        <SearchableSelect
                            value={data.is_base ? 'true' : 'false'}
                            onChange={(e) =>
                                setData('is_base', e.target.value === 'true')
                            }
                        >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                        </SearchableSelect>
                    </FormField>
                    <ModalActions
                        processing={processing}
                        submitLabel="Create Unit"
                        onCancel={close}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateIngredientCategoryModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        slug: '',
        code: '',
        parent_id: '',
        is_active: true,
        _redirect: currentUrl(),
    });

    function close() {
        reset();
        onClose();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(categoriesStore.url(), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: close,
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    close();
                }
            }}
        >
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Add Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Name" error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={(e) => {
                                setData('name', e.target.value);
                                setData('slug', slugify(e.target.value));
                            }}
                            placeholder="e.g. Vegetables"
                        />
                    </FormField>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Slug" error={errors.slug}>
                            <Input
                                value={data.slug}
                                onChange={(e) =>
                                    setData('slug', slugify(e.target.value))
                                }
                            />
                        </FormField>
                        <FormField label="Code" error={errors.code}>
                            <Input
                                value={data.code}
                                onChange={(e) =>
                                    setData('code', e.target.value)
                                }
                                placeholder="Optional"
                            />
                        </FormField>
                    </div>
                    <ModalActions
                        processing={processing}
                        submitLabel="Create Category"
                        onCancel={close}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}
