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

export type ScopeType = 'global' | 'central_warehouse' | 'outlet' | 'outlet_warehouse' | 'outlet_department' | 'department_warehouse';

export type Role = {
    id: number;
    name: string;
    slug: string;
    level: ScopeType;
    rank: number;
    description: string | null;
    is_system: boolean;
    is_assignable: boolean;
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
    level: ScopeType;
    description: string | null;
    is_system: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type UserRoleAssignment = {
    id: number;
    user_id: number;
    role_id: number;
    scope_type: ScopeType;
    outlet_id: number | null;
    outlet_department_id: number | null;
    warehouse_id: number | null;
    is_active: boolean;
    assigned_by: number | null;
    starts_at: string | null;
    ends_at: string | null;
    user?: User;
    role?: Role;
    outlet?: Outlet | null;
    department?: OutletDepartment | null;
    warehouse?: Warehouse | null;
    created_at: string;
    updated_at: string;
};

export type UserPermissionOverride = {
    id: number;
    user_id: number;
    permission_id: number;
    scope_type: ScopeType;
    outlet_id: number | null;
    outlet_department_id: number | null;
    warehouse_id: number | null;
    effect: 'allow' | 'deny';
    reason: string | null;
    is_active: boolean;
    assigned_by: number | null;
    starts_at: string | null;
    ends_at: string | null;
    user?: User;
    permission?: Permission;
    created_at: string;
    updated_at: string;
};

export type Auth = {
    user: User;
    roles: Pick<Role, 'id' | 'name' | 'slug' | 'level'>[];
    permissions: string[];
    can: Record<string, boolean>;
};

export type Unit = {
    id: number;
    name: string;
    short_name: string;
    type: 'weight' | 'volume' | 'quantity' | 'custom';
    is_base: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type UnitConversion = {
    id: number;
    from_unit_id: number;
    to_unit_id: number;
    multiplier: string;
    is_active: boolean;
    from_unit?: Unit;
    to_unit?: Unit;
    created_at: string;
    updated_at: string;
};

export type IngredientCategory = {
    id: number;
    name: string;
    slug: string;
    code: string | null;
    parent_id: number | null;
    is_active: boolean;
    parent?: IngredientCategory | null;
    created_at: string;
    updated_at: string;
};

export type IngredientType = 'raw_material' | 'ready_product' | 'packaging' | 'consumable';

export type CostingMethod = 'fifo' | 'lifo' | 'weighted_average' | 'moving_average' | 'specific_identification';

export type Ingredient = {
    id: number;
    ingredient_category_id: number | null;
    name: string;
    slug: string;
    code: string;
    barcode: string | null;
    image: string | null;
    image_url: string | null;
    type: IngredientType;
    base_unit_id: number;
    default_purchase_unit_id: number | null;
    default_usage_unit_id: number | null;
    minimum_stock: string;
    reorder_level: string;
    reorder_quantity: string;
    costing_method: CostingMethod;
    is_perishable: boolean;
    track_expiry: boolean;
    description: string | null;
    is_active: boolean;
    ingredient_category?: IngredientCategory | null;
    base_unit?: Unit;
    default_purchase_unit?: Unit | null;
    default_usage_unit?: Unit | null;
    created_at: string;
    updated_at: string;
};

export type Country = {
    id: number;
    name: string;
    code: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type State = {
    id: number;
    country_id: number;
    name: string;
    code: string | null;
    is_active: boolean;
    country?: Country;
    created_at: string;
    updated_at: string;
};

export type City = {
    id: number;
    country_id: number;
    state_id: number | null;
    name: string;
    is_active: boolean;
    country?: Country;
    state?: State | null;
    created_at: string;
    updated_at: string;
};

export type Outlet = {
    id: number;
    name: string;
    departments_count?: number;
    created_at?: string;
    updated_at?: string;
};

export type DepartmentType = 'kitchen' | 'bar' | 'counter' | 'store' | 'bakery' | 'housekeeping' | 'other';

export type OutletDepartment = {
    id: number;
    outlet_id: number;
    name: string;
    code: string | null;
    type: DepartmentType;
    description: string | null;
    is_active: boolean;
    outlet?: Outlet;
    created_at: string;
    updated_at: string;
};

export type WarehouseType = 'central' | 'outlet' | 'department';

export type Warehouse = {
    id: number;
    outlet_id: number | null;
    outlet_department_id: number | null;
    name: string;
    code: string;
    type: WarehouseType;
    address: string | null;
    is_default: boolean;
    is_active: boolean;
    outlet?: Outlet;
    department?: OutletDepartment;
    created_at: string;
    updated_at: string;
};

export type CustomerOutlet = {
    id: number;
    customer_id: number;
    outlet_id: number;
    first_visited_at: string | null;
    last_visited_at: string | null;
    visit_count: number;
    is_favorite_outlet: boolean;
    outlet?: Outlet;
    created_at: string;
    updated_at: string;
};

export type Customer = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    is_active: boolean;
    customer_outlets_count?: number;
    customer_outlets?: CustomerOutlet[];
    created_at: string;
    updated_at: string;
};

export type LoyaltyPointRuleSlab = {
    id: number;
    loyalty_point_rule_id: number;
    min_amount: string;
    max_amount: string | null;
    points: number;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type LoyaltyPointRule = {
    id: number;
    outlet_id: number | null;
    name: string;
    type: 'global' | 'outlet' | 'campaign';
    earning_type: 'fixed_rate' | 'fixed_slab';
    earn_amount: string | null;
    earn_points: number | null;
    redeem_point_value: string;
    minimum_redeem_points: number;
    maximum_redeem_points: number | null;
    maximum_redeem_percent: string | null;
    points_expiry_days: number | null;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    priority: number;
    slabs_count?: number;
    outlet?: Outlet | null;
    slabs?: LoyaltyPointRuleSlab[];
    created_at: string;
    updated_at: string;
};

export type FoodCategory = {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    image_url?: string | null;
    is_active: boolean;
    sort_order: number;
    foods_count?: number;
    parent?: FoodCategory | null;
    children?: FoodCategory[];
    created_at: string;
    updated_at: string;
};

export type FoodOutlet = {
    id: number;
    food_id: number;
    outlet_id: number;
    price: string | null;
    is_available: boolean;
    is_active: boolean;
    outlet?: Outlet;
    created_at: string;
    updated_at: string;
};

export type FoodVariantOutlet = {
    id: number;
    food_variant_id: number;
    outlet_id: number;
    price: string | null;
    is_available: boolean;
    is_active: boolean;
    outlet?: Outlet;
    created_at: string;
    updated_at: string;
};

export type FoodVariant = {
    id: number;
    food_id: number;
    name: string;
    sku: string | null;
    price: string;
    is_default: boolean;
    is_active: boolean;
    sort_order: number;
    food?: { id: number; name: string };
    recipes_count?: number;
    outlet_settings_count?: number;
    outlet_settings?: FoodVariantOutlet[];
    recipes?: FoodRecipe[];
    created_at: string;
    updated_at: string;
};

export type AddonRecipe = {
    id: number;
    addon_id: number;
    ingredient_id: number;
    unit_id: number;
    quantity: string;
    wastage_quantity: string;
    is_active: boolean;
    addon?: (Addon & { group?: Pick<AddonGroup, 'id' | 'name'> | null });
    ingredient?: { id: number; name: string };
    unit?: { id: number; name: string; short_name: string };
    created_at: string;
    updated_at: string;
};

export type Addon = {
    id: number;
    addon_group_id: number | null;
    name: string;
    price: string;
    is_recipe_enabled: boolean;
    is_active: boolean;
    sort_order: number;
    recipes?: AddonRecipe[];
    created_at: string;
    updated_at: string;
};

export type AddonGroup = {
    id: number;
    name: string;
    is_required: boolean;
    min_select: number;
    max_select: number | null;
    is_active: boolean;
    sort_order: number;
    addons_count?: number;
    addons?: Addon[];
    created_at: string;
    updated_at: string;
};

export type FoodRecipe = {
    id: number;
    food_id: number;
    food_variant_id: number | null;
    ingredient_id: number;
    unit_id: number;
    quantity: string;
    wastage_quantity: string;
    is_active: boolean;
    food?: { id: number; name: string };
    ingredient?: { id: number; name: string };
    unit?: { id: number; name: string; short_name: string };
    variant?: { id: number; name: string } | null;
    created_at: string;
    updated_at: string;
};

export type FoodAvailabilitySchedule = {
    id: number;
    food_id: number;
    outlet_id: number | null;
    day_of_week: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
    start_time: string | null;
    end_time: string | null;
    is_available: boolean;
    outlet?: Outlet | null;
    created_at: string;
    updated_at: string;
};

export type FoodImage = {
    id: number;
    food_id: number;
    image: string;
    url?: string;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
};

export type FoodComboItem = {
    id: number;
    combo_food_id: number;
    combo_food_variant_id: number | null;
    food_id: number;
    food_variant_id: number | null;
    quantity: number;
    combo_food_variant?: FoodVariant | null;
    food?: { id: number; name: string; item_type: string };
    food_variant?: FoodVariant | null;
    created_at: string;
    updated_at: string;
};

export type Food = {
    id: number;
    food_category_id: number | null;
    name: string;
    slug: string;
    sku: string | null;
    short_description: string | null;
    description: string | null;
    image: string | null;
    food_type: 'veg' | 'non_veg' | 'egg' | 'vegan' | null;
    item_type: 'food' | 'beverage' | 'combo';
    base_price: string;
    has_variants: boolean;
    has_addons: boolean;
    is_recipe_enabled: boolean;
    is_taxable: boolean;
    is_discountable: boolean;
    is_featured: boolean;
    is_active: boolean;
    preparation_time: number | null;
    sort_order: number;
    variants_count?: number;
    recipes_count?: number;
    images_count?: number;
    category?: FoodCategory | null;
    outlets?: FoodOutlet[];
    variants?: FoodVariant[];
    addon_groups?: AddonGroup[];
    all_recipes?: FoodRecipe[];
    availability_schedules?: FoodAvailabilitySchedule[];
    images?: FoodImage[];
    combo_items?: FoodComboItem[];
    created_at: string;
    updated_at: string;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};

export type TransferStatus =
    | 'draft'
    | 'requested'
    | 'approved'
    | 'dispatched'
    | 'partially_received'
    | 'received'
    | 'cancelled';

export type IngredientStockTransferItem = {
    id: number;
    ingredient_stock_transfer_id: number;
    ingredient_id: number;
    ingredient_batch_id: number | null;
    requested_quantity: string;
    dispatched_quantity: string;
    received_quantity: string;
    unit_cost: string;
    total_cost: string;
    remarks: string | null;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> };
    batch?: { id: number; batch_no: string | null; expiry_date: string | null } | null;
    created_at: string;
    updated_at: string;
};

export type AdjustmentStatus = 'draft' | 'approved' | 'cancelled';

export type IngredientStockAdjustmentItem = {
    id: number;
    ingredient_stock_adjustment_id: number;
    ingredient_id: number;
    ingredient_batch_id: number | null;
    system_quantity: string;
    actual_quantity: string;
    difference_quantity: string;
    unit_cost: string;
    difference_value: string;
    remarks: string | null;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> };
    batch?: { id: number; batch_no: string | null; expiry_date: string | null } | null;
    created_at: string;
    updated_at: string;
};

export type IngredientStockAdjustment = {
    id: number;
    adjustment_no: string;
    warehouse_id: number;
    adjustment_date: string;
    status: AdjustmentStatus;
    reason: string | null;
    created_by: number | null;
    approved_by: number | null;
    approved_at: string | null;
    warehouse?: Pick<Warehouse, 'id' | 'name'>;
    items?: IngredientStockAdjustmentItem[];
    createdBy?: Pick<User, 'id' | 'name'> | null;
    approvedBy?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};

export type WastageReason = 'expired' | 'damaged' | 'spoiled' | 'over_preparation' | 'staff_error' | 'other';

export type WastageStatus = 'draft' | 'approved' | 'cancelled';

export type IngredientWastageItem = {
    id: number;
    ingredient_wastage_id: number;
    ingredient_id: number;
    ingredient_batch_id: number | null;
    quantity: string;
    unit_cost: string;
    total_cost: string;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> };
    batch?: { id: number; batch_no: string | null; expiry_date: string | null } | null;
    created_at: string;
    updated_at: string;
};

export type IngredientWastage = {
    id: number;
    wastage_no: string;
    warehouse_id: number;
    wastage_date: string;
    reason: WastageReason;
    status: WastageStatus;
    remarks: string | null;
    created_by: number | null;
    approved_by: number | null;
    approved_at: string | null;
    warehouse?: Pick<Warehouse, 'id' | 'name'>;
    items?: IngredientWastageItem[];
    createdBy?: Pick<User, 'id' | 'name'> | null;
    approvedBy?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};

export type StockOutPurpose = 'production_use' | 'kitchen_use' | 'sample' | 'distribution' | 'other';
export type StockOutStatus = 'draft' | 'approved' | 'cancelled';

export type IngredientStockOutItem = {
    id: number;
    ingredient_stock_out_id: number;
    ingredient_id: number;
    ingredient_batch_id: number | null;
    quantity: string;
    unit_cost: string;
    total_cost: string;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: { id: number; name: string; short_name: string } };
    batch?: { id: number; batch_no: string | null; expiry_date: string | null } | null;
    created_at: string;
    updated_at: string;
};

export type IngredientStockOut = {
    id: number;
    stock_out_no: string;
    warehouse_id: number;
    stock_out_date: string;
    purpose: StockOutPurpose;
    status: StockOutStatus;
    remarks: string | null;
    created_by: number | null;
    approved_by: number | null;
    approved_at: string | null;
    warehouse?: Pick<Warehouse, 'id' | 'name'>;
    items?: IngredientStockOutItem[];
    createdBy?: Pick<User, 'id' | 'name'> | null;
    approvedBy?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};

export type IngredientStockTransfer = {
    id: number;
    transfer_no: string;
    from_warehouse_id: number;
    to_warehouse_id: number;
    transfer_date: string;
    status: TransferStatus;
    remarks: string | null;
    requested_by: number | null;
    approved_by: number | null;
    dispatched_by: number | null;
    received_by: number | null;
    approved_at: string | null;
    dispatched_at: string | null;
    received_at: string | null;
    from_warehouse?: Pick<Warehouse, 'id' | 'name'>;
    to_warehouse?: Pick<Warehouse, 'id' | 'name'>;
    items?: IngredientStockTransferItem[];
    requested_by_user?: Pick<User, 'id' | 'name'> | null;
    approved_by_user?: Pick<User, 'id' | 'name'> | null;
    dispatched_by_user?: Pick<User, 'id' | 'name'> | null;
    received_by_user?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};

export type StockCountStatus = 'draft' | 'counting' | 'completed' | 'adjusted' | 'cancelled';

export type IngredientStockCountItem = {
    id: number;
    ingredient_stock_count_id: number;
    ingredient_id: number;
    ingredient_batch_id: number | null;
    system_quantity: string;
    counted_quantity: string;
    difference_quantity: string;
    remarks: string | null;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: { id: number; name: string; short_name: string } };
    batch?: { id: number; batch_no: string | null; expiry_date: string | null } | null;
    created_at: string;
    updated_at: string;
};

export type IngredientStockCount = {
    id: number;
    count_no: string;
    warehouse_id: number;
    count_date: string;
    status: StockCountStatus;
    remarks: string | null;
    created_by: number | null;
    completed_by: number | null;
    completed_at: string | null;
    warehouse?: Pick<Warehouse, 'id' | 'name'>;
    items?: IngredientStockCountItem[];
    createdBy?: Pick<User, 'id' | 'name'> | null;
    completedBy?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};

export type WarehouseIngredientStock = {
    id: number;
    warehouse_id: number;
    ingredient_id: number;
    quantity: string;
    average_cost: string;
    warehouse?: Pick<Warehouse, 'id' | 'name'>;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: { id: number; name: string; short_name: string } };
    created_at: string;
    updated_at: string;
};

export type IngredientBatch = {
    id: number;
    batch_no: string | null;
    ingredient_id: number;
    warehouse_id: number;
    received_quantity: string;
    available_quantity: string;
    unit_cost: string;
    total_cost: string;
    expiry_date: string | null;
    is_closed: boolean;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: { id: number; name: string; short_name: string } };
    warehouse?: Pick<Warehouse, 'id' | 'name'>;
    created_at: string;
    updated_at: string;
};

export type Supplier = {
    id: number;
    name: string;
    code: string | null;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    pan_vat_no: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled' | 'closed';

export type PurchaseOrderItem = {
    id: number;
    purchase_order_id: number;
    ingredient_id: number;
    unit_id: number;
    quantity: string;
    received_quantity: string;
    unit_price: string;
    discount_amount: string;
    tax_amount: string;
    line_total: string;
    notes: string | null;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> };
    unit?: Pick<Unit, 'id' | 'name' | 'short_name'>;
    created_at: string;
    updated_at: string;
};

export type PurchaseOrder = {
    id: number;
    supplier_id: number;
    warehouse_id: number;
    purchase_order_no: string;
    order_date: string;
    expected_delivery_date: string | null;
    status: PurchaseOrderStatus;
    subtotal: string;
    discount_amount: string;
    tax_amount: string;
    shipping_amount: string;
    grand_total: string;
    notes: string | null;
    created_by: number | null;
    approved_by: number | null;
    approved_at: string | null;
    supplier?: Pick<Supplier, 'id' | 'name'>;
    warehouse?: Pick<Warehouse, 'id' | 'name'>;
    items?: PurchaseOrderItem[];
    createdBy?: Pick<User, 'id' | 'name'> | null;
    approvedBy?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};

export type PurchaseReceiveStatus = 'draft' | 'posted' | 'cancelled';

export type PurchaseReceiveItem = {
    id: number;
    purchase_receive_id: number;
    purchase_order_item_id: number | null;
    ingredient_id: number;
    unit_id: number;
    ordered_quantity: string;
    received_quantity: string;
    rejected_quantity: string;
    accepted_quantity: string;
    unit_price: string;
    line_total: string;
    batch_no: string | null;
    manufactured_date: string | null;
    expiry_date: string | null;
    remarks: string | null;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> };
    unit?: Pick<Unit, 'id' | 'name' | 'short_name'>;
    created_at: string;
    updated_at: string;
};

export type PurchaseReceive = {
    id: number;
    purchase_order_id: number | null;
    supplier_id: number;
    warehouse_id: number;
    receive_no: string;
    received_date: string;
    status: PurchaseReceiveStatus;
    notes: string | null;
    received_by: number | null;
    posted_by: number | null;
    posted_at: string | null;
    supplier?: Pick<Supplier, 'id' | 'name'>;
    warehouse?: Pick<Warehouse, 'id' | 'name'>;
    purchaseOrder?: Pick<PurchaseOrder, 'id' | 'purchase_order_no'> | null;
    items?: PurchaseReceiveItem[];
    receivedBy?: Pick<User, 'id' | 'name'> | null;
    postedBy?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};

export type PurchaseInvoiceStatus = 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'cancelled';

export type PurchaseInvoiceItem = {
    id: number;
    purchase_invoice_id: number;
    ingredient_id: number;
    unit_id: number;
    quantity: string;
    unit_price: string;
    discount_amount: string;
    tax_amount: string;
    line_total: string;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> };
    unit?: Pick<Unit, 'id' | 'name' | 'short_name'>;
    created_at: string;
    updated_at: string;
};

export type PurchaseInvoice = {
    id: number;
    supplier_id: number;
    purchase_order_id: number | null;
    purchase_receive_id: number | null;
    invoice_no: string;
    supplier_invoice_no: string | null;
    invoice_date: string;
    due_date: string | null;
    status: PurchaseInvoiceStatus;
    subtotal: string;
    discount_amount: string;
    tax_amount: string;
    shipping_amount: string;
    grand_total: string;
    paid_amount: string;
    due_amount: string;
    notes: string | null;
    created_by: number | null;
    supplier?: Pick<Supplier, 'id' | 'name'>;
    purchaseOrder?: Pick<PurchaseOrder, 'id' | 'purchase_order_no'> | null;
    purchaseReceive?: Pick<PurchaseReceive, 'id' | 'receive_no'> | null;
    items?: PurchaseInvoiceItem[];
    paymentAllocations?: SupplierPaymentAllocation[];
    createdBy?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};

export type PaymentMethod = 'cash' | 'bank' | 'cheque' | 'online' | 'credit' | 'other';

export type SupplierPaymentAllocation = {
    id: number;
    supplier_payment_id: number;
    purchase_invoice_id: number;
    allocated_amount: string;
    invoice?: Pick<PurchaseInvoice, 'id' | 'invoice_no' | 'invoice_date' | 'grand_total' | 'due_amount'>;
    payment?: Pick<SupplierPayment, 'id' | 'payment_no' | 'payment_date' | 'payment_method'>;
    created_at: string;
    updated_at: string;
};

export type SupplierPayment = {
    id: number;
    supplier_id: number;
    payment_no: string;
    payment_date: string;
    payment_method: PaymentMethod;
    reference_no: string | null;
    amount: string;
    notes: string | null;
    created_by: number | null;
    supplier?: Pick<Supplier, 'id' | 'name'>;
    allocations?: SupplierPaymentAllocation[];
    createdBy?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};

export type PurchaseReturnStatus = 'draft' | 'posted' | 'cancelled';

export type PurchaseReturnItem = {
    id: number;
    purchase_return_id: number;
    ingredient_id: number;
    ingredient_batch_id: number | null;
    unit_id: number;
    quantity: string;
    unit_price: string;
    line_total: string;
    reason: string | null;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> };
    unit?: Pick<Unit, 'id' | 'name' | 'short_name'>;
    batch?: Pick<IngredientBatch, 'id' | 'batch_no'> | null;
    created_at: string;
    updated_at: string;
};

export type PurchaseReturn = {
    id: number;
    supplier_id: number;
    warehouse_id: number;
    purchase_receive_id: number | null;
    purchase_invoice_id: number | null;
    return_no: string;
    return_date: string;
    status: PurchaseReturnStatus;
    subtotal: string;
    tax_amount: string;
    grand_total: string;
    reason: string | null;
    created_by: number | null;
    posted_by: number | null;
    posted_at: string | null;
    supplier?: Pick<Supplier, 'id' | 'name'>;
    warehouse?: Pick<Warehouse, 'id' | 'name'>;
    purchaseReceive?: Pick<PurchaseReceive, 'id' | 'receive_no'> | null;
    purchaseInvoice?: Pick<PurchaseInvoice, 'id' | 'invoice_no'> | null;
    items?: PurchaseReturnItem[];
    createdBy?: Pick<User, 'id' | 'name'> | null;
    postedBy?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};

export type TransactionType =
    | 'opening_stock'
    | 'purchase_receive'
    | 'purchase_return'
    | 'transfer_in'
    | 'transfer_out'
    | 'sale_consume'
    | 'production_consume'
    | 'wastage'
    | 'adjustment_in'
    | 'adjustment_out'
    | 'stock_count_gain'
    | 'stock_count_loss';

export type IngredientInventoryTransaction = {
    id: number;
    ingredient_id: number;
    warehouse_id: number;
    ingredient_batch_id: number | null;
    transaction_type: TransactionType;
    quantity_in: string;
    quantity_out: string;
    balance_after: string;
    unit_cost: string;
    total_cost: string;
    reference_type: string | null;
    reference_id: number | null;
    remarks: string | null;
    created_by: number | null;
    ingredient?: Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: { id: number; name: string; short_name: string } };
    warehouse?: Pick<Warehouse, 'id' | 'name'>;
    batch?: Pick<IngredientBatch, 'id' | 'batch_no'> | null;
    createdBy?: Pick<User, 'id' | 'name'> | null;
    created_at: string;
    updated_at: string;
};
