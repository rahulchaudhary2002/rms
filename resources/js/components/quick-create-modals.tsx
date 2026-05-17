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
import { store as addonGroupsStore } from '@/routes/addon-groups';
import { store as citiesStore } from '@/routes/cities';
import { store as countriesStore } from '@/routes/countries';
import { store as foodCategoriesStore } from '@/routes/food-categories';
import { store as categoriesStore } from '@/routes/ingredient-categories';
import { store as outletDepartmentsStore } from '@/routes/outlet-departments';
import { store as outletsStore } from '@/routes/outlets';
import { store as statesStore } from '@/routes/states';
import { store as unitsStore } from '@/routes/units';
import { store as usersStore } from '@/routes/users';
import { store as suppliersStore } from '@/routes/suppliers';
import { store as warehousesStore } from '@/routes/warehouses';
import type { Country } from '@/types';

type OutletOption = { id: number; name: string };
type StateOption = { id: number; name: string };

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
                                <option value="central_warehouse">Central Warehouse</option>
                                <option value="outlet">Outlet</option>
                                <option value="outlet_warehouse">Outlet Warehouse</option>
                                <option value="outlet_department">Outlet Department</option>
                                <option value="department_warehouse">Department Warehouse</option>
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
                            <option value="central_warehouse">Central Warehouse</option>
                            <option value="outlet">Outlet</option>
                            <option value="outlet_warehouse">Outlet Warehouse</option>
                            <option value="outlet_department">Outlet Department</option>
                            <option value="department_warehouse">Department Warehouse</option>
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

export function QuickCreateOutletModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        address: '',
        is_active: true,
        _redirect: currentUrl(),
    });

    function close() { reset(); onClose(); }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(outletsStore.url(), { preserveScroll: true, preserveState: true, onSuccess: close });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader><DialogTitle>Add Outlet</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Name" error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Main Branch" />
                    </FormField>
                    <FormField label="Code" error={errors.code}>
                        <Input value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="e.g. MB" />
                    </FormField>
                    <FormField label="Address" error={errors.address}>
                        <Input value={data.address} onChange={(e) => setData('address', e.target.value)} placeholder="e.g. 123 Main St" />
                    </FormField>
                    <ModalActions processing={processing} submitLabel="Create Outlet" onCancel={close} />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateOutletDepartmentModal({
    open,
    onClose,
    outlets,
    defaultOutletId = '',
}: {
    open: boolean;
    onClose: () => void;
    outlets: OutletOption[];
    defaultOutletId?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        outlet_id: defaultOutletId,
        name: '',
        code: '',
        type: 'other',
        is_active: true,
        _redirect: currentUrl(),
    });

    useEffect(() => { if (open) setData('outlet_id', defaultOutletId); }, [defaultOutletId, open, setData]);

    function close() { reset(); onClose(); }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(outletDepartmentsStore.url(), { preserveScroll: true, preserveState: true, onSuccess: close });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Outlet" error={errors.outlet_id}>
                        <SearchableSelect value={data.outlet_id} onChange={(e) => setData('outlet_id', e.target.value)}>
                            <option value="">Select outlet...</option>
                            {outlets.map((o) => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
                        </SearchableSelect>
                    </FormField>
                    <FormField label="Name" error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Kitchen" />
                    </FormField>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Code" error={errors.code}>
                            <Input value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="e.g. KIT" />
                        </FormField>
                        <FormField label="Type" error={errors.type}>
                            <SearchableSelect value={data.type} onChange={(e) => setData('type', e.target.value)}>
                                <option value="kitchen">Kitchen</option>
                                <option value="bar">Bar</option>
                                <option value="store">Store</option>
                                <option value="prep">Prep</option>
                                <option value="other">Other</option>
                            </SearchableSelect>
                        </FormField>
                    </div>
                    <ModalActions processing={processing} submitLabel="Create Department" onCancel={close} />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateWarehouseModal({
    open,
    onClose,
    outlets = [],
    defaultOutletId = '',
}: {
    open: boolean;
    onClose: () => void;
    outlets?: OutletOption[];
    defaultOutletId?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        outlet_id: defaultOutletId,
        name: '',
        code: '',
        type: 'outlet',
        address: '',
        is_active: true,
        _redirect: currentUrl(),
    });

    useEffect(() => { if (open) setData('outlet_id', defaultOutletId); }, [defaultOutletId, open, setData]);

    function close() { reset(); onClose(); }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(warehousesStore.url(), { preserveScroll: true, preserveState: true, onSuccess: close });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader><DialogTitle>Add Warehouse</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Type" error={errors.type}>
                        <SearchableSelect value={data.type} onChange={(e) => setData('type', e.target.value)}>
                            <option value="central">Central</option>
                            <option value="outlet">Outlet</option>
                            <option value="department">Department</option>
                        </SearchableSelect>
                    </FormField>
                    {data.type !== 'central' && (
                        <FormField label="Outlet" error={errors.outlet_id}>
                            <SearchableSelect value={data.outlet_id} onChange={(e) => setData('outlet_id', e.target.value)}>
                                <option value="">Select outlet...</option>
                                {outlets.map((o) => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
                            </SearchableSelect>
                        </FormField>
                    )}
                    <FormField label="Name" error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Main Store" />
                    </FormField>
                    <FormField label="Code" error={errors.code}>
                        <Input value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="e.g. WH-01" />
                    </FormField>
                    <ModalActions processing={processing} submitLabel="Create Warehouse" onCancel={close} />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateFoodCategoryModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        is_active: true,
        _redirect: currentUrl(),
    });

    function close() { reset(); onClose(); }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(foodCategoriesStore.url(), { preserveScroll: true, preserveState: true, onSuccess: close });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader><DialogTitle>Add Food Category</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Name" error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Beverages" />
                    </FormField>
                    <FormField label="Description" error={errors.description}>
                        <Input value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Optional" />
                    </FormField>
                    <ModalActions processing={processing} submitLabel="Create Category" onCancel={close} />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateAddonGroupModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        is_required: false,
        min_select: '1',
        max_select: '',
        sort_order: '0',
        is_active: true,
        _redirect: currentUrl(),
    });

    function close() { reset(); onClose(); }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(addonGroupsStore.url(), { preserveScroll: true, preserveState: true, onSuccess: close });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader><DialogTitle>Add Add-on Group</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Name" error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Toppings" />
                    </FormField>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Min Select" error={errors.min_select}>
                            <Input type="number" min={0} value={data.min_select} onChange={(e) => setData('min_select', e.target.value)} />
                        </FormField>
                        <FormField label="Max Select" error={errors.max_select}>
                            <Input type="number" min={0} value={data.max_select} onChange={(e) => setData('max_select', e.target.value)} placeholder="Unlimited" />
                        </FormField>
                    </div>
                    <FormField label="Required" error={errors.is_required}>
                        <SearchableSelect value={data.is_required ? 'true' : 'false'} onChange={(e) => setData('is_required', e.target.value === 'true')}>
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                        </SearchableSelect>
                    </FormField>
                    <ModalActions processing={processing} submitLabel="Create Group" onCancel={close} />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateSupplierModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        contact_person: '',
        phone: '',
        email: '',
        pan_vat_no: '',
        address: '',
        is_active: true,
        _redirect: currentUrl(),
    });

    function close() { reset(); onClose(); }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(suppliersStore.url(), { preserveScroll: true, preserveState: true, onSuccess: close });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Name" error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. ABC Traders" />
                    </FormField>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Code" error={errors.code}>
                            <Input value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="Optional" />
                        </FormField>
                        <FormField label="Phone" error={errors.phone}>
                            <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="Phone number" />
                        </FormField>
                    </div>
                    <FormField label="Contact Person" error={errors.contact_person}>
                        <Input value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} placeholder="Contact person name" />
                    </FormField>
                    <ModalActions processing={processing} submitLabel="Create Supplier" onCancel={close} />
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function QuickCreateCityModal({
    open,
    onClose,
    states,
    defaultStateId = '',
}: {
    open: boolean;
    onClose: () => void;
    states: StateOption[];
    defaultStateId?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        state_id: defaultStateId,
        name: '',
        code: '',
        is_active: true,
        _redirect: currentUrl(),
    });

    useEffect(() => { if (open) setData('state_id', defaultStateId); }, [defaultStateId, open, setData]);

    function close() { reset(); onClose(); }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(citiesStore.url(), { preserveScroll: true, preserveState: true, onSuccess: close });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader><DialogTitle>Add City</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="State" error={errors.state_id}>
                        <SearchableSelect value={data.state_id} onChange={(e) => setData('state_id', e.target.value)}>
                            <option value="">Select state...</option>
                            {states.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                        </SearchableSelect>
                    </FormField>
                    <FormField label="Name" error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Kathmandu" />
                    </FormField>
                    <FormField label="Code" error={errors.code}>
                        <Input value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="e.g. KTM" />
                    </FormField>
                    <ModalActions processing={processing} submitLabel="Create City" onCancel={close} />
                </form>
            </DialogContent>
        </Dialog>
    );
}
