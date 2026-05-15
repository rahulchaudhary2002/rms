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

export type Ingredient = {
    id: number;
    ingredient_category_id: number | null;
    name: string;
    slug: string;
    code: string;
    barcode: string | null;
    base_unit_id: number;
    default_purchase_unit_id: number | null;
    default_usage_unit_id: number | null;
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
