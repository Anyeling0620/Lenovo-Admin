/* eslint-disable @typescript-eslint/no-explicit-any */
export type AfterSaleStatus = "申请中" | "已退款" | "已同意" | "已拒绝" | "已寄回" | "已寄出" | "已完成"
export type BrandStatus = "启用" | "禁用" | "下架"
export type CategoryStatus = "启用" | "禁用"
export type ComplaintStatus = "正常" | "撤回" | "用户删除"
export type Gender = "man" | "woman" | "secret"
export type IdentityStatus = "启用" | "禁用"
export type PermissionStatus = "启用" | "禁用"
export type ProductStatus = "下架" | "正常" | "删除"
export type ProductConfigStatus = "下架" | "正常"
export type ShelfProductStatus = "下架" | "在售" | "售罄"
export type RelationStatus = "生效" | "失效"
export type TagStatus = "启用" | "禁用"
export type SeckillRoundStatus = "启用" | "禁用" | "已结束"
export type SeckillType = "立减" | "打折"

export interface AdminLoginRequest {
  account: string;
  password: string;
}

export interface AdminLoginResponse {
  admin_id: string;
  name: string;
  nickname: string;
  account: string;
  avatar: string | null;
  email: string | null;
  sessionId?: string;  // ⭐ 后端返回的会话ID，用于跨域认证
}

export interface AdminSessionData {
  admin_id: string;
  account: string;
  name: string;
  permissions: string[];  // 权限列表
  categories: string[]; //  专区ID列表
  identitys: string[]; // 身份ID列表
}

export interface PermissionInfo {
  id: string; // 权限ID
  name: string; // 权限名称
  code?: string; // 权限编码（若Permission表需要，可后续添加）
  type: string; // 权限类型
  module: string; // 所属模块
  parentId: string | null; // 父权限ID
  children?: PermissionInfo[]; // 子权限（可选，构建权限树）
}

// 新增：身份语义化信息
export interface IdentityInfo {
  id: string; // 身份ID
  name: string; // 身份名称
  code: string; // 身份编码
  description?: string; // 身份描述
  isSystem: boolean; // 是否系统预设
}

// 新增：专区语义化信息（关联Category表，假设Category有name字段）
export interface CategoryInfo {
  id: string; // 专区ID
  name: string; // 专区名称
  // 可根据Category表补充其他字段，如parentId、sort等
  code: string; // 专区编码
}

// 新增：权限信息API响应类型
export interface AdminPermissionResponse {
  permissions: PermissionInfo[]; // 权限列表（语义化）
  permissionsTree: PermissionInfo[]; // 权限树（可选，前端渲染菜单用）
  identities: IdentityInfo[]; // 身份列表（语义化）
  categories: CategoryInfo[]; // 专区列表（语义化）
}



// ===== 个人账号 =====
export interface AdminIdentityBinding {
  admin_identity_id: string;
  identity_id: string;
  identity_name: string;
  identity_code: string;
  expire_time: string | null;
  status: IdentityStatus;
}

export interface AdminCategoryBinding {
  admin_product_category_id: string;
  category_id: string;
  category_name: string;
  category_code: string;
  status: IdentityStatus;
}

export interface AdminPermissionItem {
  identity_permission_id: string;
  permission_id: string;
  permission_name: string;
  permission_type: string;
  module: string;
  parent_id: string | null;
}

export interface AdminProfileResponse {
  admin_id: string;
  account: string;
  name: string;
  nickname: string | null;
  gender: Gender;
  email: string | null;
  avatar: string | null;
  status: string;
  created_at: string;
  last_login_time: string | null;
  identities: AdminIdentityBinding[];
  permissions: AdminPermissionItem[];
  categories: AdminCategoryBinding[];
}

export interface UpdateAdminProfileRequest {
  name?: string;
  nickname?: string;
  gender?: Gender;
  email?: string;
  avatar?: string | null;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// ===== 系统管理员 =====
export interface UserListItem {
  user_id: string;
  account: string;
  email: string | null;
  nickname: string | null;
  avatar: string | null;
  member_type: string;
  gender: Gender;
  created_at: string;
}

export interface AdminListItem {
  admin_id: string;
  account: string;
  name: string;
  nickname: string | null;
  email: string | null;
  status: string;
  identities: AdminIdentityBinding[];
  categories: AdminCategoryBinding[];
}

export interface CreateAdminRequest {
  account: string;
  password: string;
  name: string;
  nickname?: string;
  email?: string;
  gender?: Gender;
  identity_ids?: string[];
  category_ids?: string[];
}

export interface PermissionMenuItem {
  permission_id: string;
  permission_name: string;
  type: string;
  module: string;
  parent_id: string | null;
  status?: PermissionStatus;
}

export interface IdentityWithPermissions {
  identity_id: string;
  identity_name: string;
  identity_code: string;
  description?: string | null;
  status: IdentityStatus;
  permissions: PermissionMenuItem[];
}

export interface BindIdentityRequest {
  identity_id: string;
  expire_time?: string | null;
}

export interface UpdateIdentityExpireRequest {
  expire_time: string | null;
}

export interface UpdateIdentityStatusRequest {
  status: IdentityStatus;
}

export interface ResetPasswordRequest {
  new_password: string;
}

// ===== 品牌/商品/配置/库存 =====
export interface BrandResponse {
  brand_id: string;
  name: string;
  code: string;
  status: BrandStatus;
  logo: string | null;
  description?: string | null;
  created_at: string;
  // 添加缺失的字段
  creator_id?: string;           // 添加 creator_id
  updated_at?: string;           // 添加 updated_at
  remark?: string;               // 添加 remark
}

export interface CreateBrandRequest {
  name: string;
  code: string;
  description?: string;
  logo?: string | null;
  status?: BrandStatus;
}

export interface UpdateBrandRequest {
  name?: string;
  code?: string;
  description?: string | null;
  logo?: string | null;
  status?: BrandStatus;
  remark?: string | null;
}

export interface CategoryResponse {
  updated_at: boolean | CategoryResponse | null
  created_at: string
  category_id: string;
  name: string;
  code: string;
  parent_id: string | null;
  status: CategoryStatus;
}

export interface ProductListItem {
  sub_title: any
  updated_at(updated_at: any): unknown
  product_id: string;
  name: string;
  brand_id: string;
  brand_name: string;
  category_id: string;
  category_name: string;
  status: ProductStatus;
  main_image: string | null;
  created_at: string;
}

export interface ProductCreateRequest {
  brand_id: string;
  category_id: string;
  name: string;
  sub_title?: string;
  description?: string;
  main_image?: string | null;
}

export interface ProductUpdateRequest {
  brand_id?: string;
  category_id?: string;
  name?: string;
  sub_title?: string | null;
  description?: string | null;
  main_image?: string | null;
  status?: ProductStatus;
}

export interface TagResponse {
  remark: any
  tag_id: string;
  name: string;
  priority: number;
  status: TagStatus;
}

export interface TagCreateRequest {
  name: string;
  priority?: number;
  status?: TagStatus;
  remark?: string | null;
}

export interface TagUpdateRequest {
  name?: string;
  priority?: number;
  status?: TagStatus;
  remark?: string | null;
}

export interface ProductTagBindRequest {
  product_id: string;
  tag_id: string;
}

export interface ProductConfigResponse {
  product_config_id: string;
  product_id: string;
  config1: string;
  config2: string;
  config3: string | null;
  sale_price: number|string;
  original_price: number|string;
  status: ProductConfigStatus;
  image?: string | null;
  stock?: {
    stock_id: string;
    stock_num: number;
    warn_num: number;
    freeze_num: number;
  } | null;
}

export interface ProductConfigCreateRequest {
  product_id: string;
  config1: string;
  config2: string;
  config3: string;
  sale_price: number|string;
  original_price: number|string;
  config_image?: string | null;
}

export interface ProductConfigUpdateRequest {
  config1?: string;
  config2?: string;
  config3?: string | null;
  sale_price?: number|string;
  original_price?: number|string;
  config_image?: string | null;
  status?: ProductConfigStatus;
}

export interface ProductDetailResponse {
  product_id: string;
  name: string;
  sub_title: string | null;
  description: string | null;
  brand_id: string;
  brand_name: string;
  category_id: string;
  category_name: string;
  status: ProductStatus;
  main_image: string | null;
  tags: {
    product_tag_relation_id: string;
    tag_id: string;
    tag_name: string;
    status: RelationStatus;
  }[];
  configs: ProductConfigResponse[];
  banners: {
    product_banner_id: string;
    image: string;
    sort: number;
  }[];
  appearances: {
    product_appearance_id: string;
    image: string;
  }[];
}

export interface StockResponse {
  updated_at(updated_at: any): unknown
  last_in_time: any
  last_out_time: any
  stock_id: string;
  stock_num: number;
  warn_num: number;
  freeze_num: number;
  config_id: string;
  product_id: string;
  product_name: string;
  config1: string;
  config2: string;
  config3: string | null;
}

export interface StockUpdateRequest {
  stock_num?: number;
  warn_num?: number;
}

export interface ProductStatsResponse {
  total: number;
  normal: number;
  off: number;
  deleted: number;
}

export interface AddAppearanceRequest {
  image: string;
}

export interface AddBannerRequest {
  image: string;
  sort?: number;
}

// ===== 货架/上架 =====
export interface ShelfProductItemResponse {
  shelf_product_item_id: string;
  config_id: string;
  config1: string;
  config2: string;
  config3: string | null;
  shelf_num: number;
  lock_num: number;
}

export interface ShelfProductResponse {
  shelf_product_id: string;
  category_id: string;
  category_name: string;
  product_id: string;
  product_name: string;
  brand_name?: string;
  is_carousel: boolean;
  carousel_image: string | null;
  is_self_operated: boolean;
  is_customizable: boolean;
  installment: number;
  status: ShelfProductStatus;
  items: ShelfProductItemResponse[];
}

export interface ShelfProductCreateRequest {
  product_id: string;
  category_id: string;
}

export interface ShelfFlagsRequest {
  is_self_operated?: boolean;
  is_customizable?: boolean;
  installment?: number;
}

export interface ShelfProductItemCreateRequest {
  shelf_product_id: string;
  config_id: string;
  shelf_num: number;
}

export interface ShelfProductItemUpdateRequest {
  shelf_num: number;
  lock_num?: number;
}

export interface ShelfCarouselRequest {
  is_carousel: boolean;
  carousel_image?: string | null;
}

export interface ShelfStatsResponse {
  category_id: string;
  category_name: string;
  category_code: string;
  shelf_product_count: number;
}

export interface HomePushRequest {
  shelf_product_id: string;
  start_time: string;
  end_time: string;
  is_carousel?: boolean;
  carousel_image?: string | null;
}

export interface HomePushResponse {
  home_push_id: string;
  shelf_product_id: string;
  product_id: string;
  product_name: string;
  is_carousel: boolean;
  carousel_image: string | null;
  start_time: string;
  end_time: string;
  status: ShelfProductStatus;
}

export interface NewPushResponse {
  new_product_push_id: string;
  shelf_product_id: string;
  product_id: string;
  product_name: string;
  is_carousel: boolean;
  carousel_image: string | null;
  start_time: string;
  end_time: string;
  status: ShelfProductStatus;
}

export interface ShelfStatusRequest {
  status: ShelfProductStatus;
}

// ===== 营销 =====
export interface CouponResponse {
  coupon_id: string;
  name: string;
  type: string;
  amount: number|string;
  discount: number|string;
  threshold: number|string;
  start_time: string;
  expire_time: string;
  is_stackable: boolean;
  center: CouponCenterResponse | null;
  products?: {
    product_coupon_relation_id: string;
    product_id: string;
    status: RelationStatus;
  }[];
}

export interface CouponCenterResponse {
  coupon_center_id: string;
  coupon_id: string;
  coupon_name?: string;
  start_time: string;
  end_time: string;
  total_num: number;
  limit_num: number;
}

export interface CouponCreateRequest {
  name: string;
  type: string;
  amount?: number | string;
  discount?: any;
  threshold?: any;
  condition?: string;
  scope?: string;
  start_time: string;
  expire_time: string;
  is_stackable?: boolean;
}

export interface CouponCenterRequest {
  coupon_id: string;
  start_time: string;
  end_time: string;
  total_num: number;
  limit_num: number;
}

export interface CouponUserResponse {
  user_coupon_id: string;
  user_id: string;
  user_account: string;
  status: string;
  receive_time: string;
  use_time: string | null;
  order_id: string | null;
  actual_amount: number|string;
}

export interface CouponStatsResponse {
  total: number;
  used: number;
  unused: number;
}

export interface VoucherResponse {
  voucher_id: string;
  title: string;
  original_amount: number|string;
  start_time: string;
  end_time: string;
}

export interface VoucherCreateRequest {
  title: string;
  description?: string;
  original_amount: number|string;
  start_time: string;
  end_time: string;
  remark?: string;
}

export interface VoucherUserResponse {
  user_voucher_id: string;
  user_id: string;
  user_account: string;
  get_time: string;
  use_up_time: string | null;
  remain_amount: number|string;
}

export interface IssueVoucherRequest {
  user_ids: string[];
}

export interface SeckillRoundResponse {
  seckill_round_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: SeckillRoundStatus;
}

export interface SeckillRoundCreateRequest {
  title: string;
  start_time: string;
  end_time: string;
  status?: SeckillRoundStatus;
  remark?: string;
}

export interface SeckillProductCreateRequest {
  round_id: string;
  product_id: string;
  type: SeckillType;
  reduce_amount?: number|string;
  discount?: any;
}

export interface SeckillConfigCreateRequest {
  seckill_product_id: string;
  config_id: string;
  shelf_num: number;
  seckill_price: number|string;
}

// ===== 订单/售后 =====
export interface OrderItemResponse {
  order_item_id: string;
  product_id: string;
  config_id: string;
  quantity: number;
  pay_amount_snapshot: number|string;
  name: string;
}

export interface OrderListItem {
  order_id: string;
  order_no: string;
  user_id: string;
  user_account: string;
  status: string;
  pay_amount: number|string;
  actual_pay_amount: number|string;
  pay_time: string | null;
  created_at: string;
  items: OrderItemResponse[];
}

export interface OrderDetailResponse {
  order_id: string;
  order_no: string;
  status: string;
  pay_amount: number|string;
  actual_pay_amount: number|string;
  pay_type: string | null;
  receiver: string;
  phone: string;
  address: string;
  logistics_no: string | null;
  items: {
    order_item_id: string;
    product_id: string;
    product_name: string;
    config_id: string;
    quantity: number;
    config1: string;
    config2: string;
    config3: string | null;
  }[];
}

export interface ShipOrderRequest {
  logistics_no: string;
}

export interface AfterSaleResponse {
  after_sale_id: string;
  after_sale_no: string;
  order_id: string;
  order_item_id: string;
  type: string;
  status: AfterSaleStatus;
  user_id: string;
  apply_time: string;
  reason: string;
}

export interface AfterSaleHandleRequest {
  status: AfterSaleStatus;
  remark?: string;
}

export interface ComplaintResponse {
  after_sale_complaint_id: string;
  user_id: string;
  user_account: string;
  after_sale_id: string;
  content: string;
  is_handled: boolean;
  handle_result: string | null;
  status: ComplaintStatus;
}

export interface ComplaintHandleRequest {
  result: string;
}

// ===== 客服 =====
export interface ServiceSessionResponse {
  service_session_room_id: string;
  user_id: string;
  user_account: string;
  admin_id: string;
  admin_name: string;
  status: string;
  created_at: string;
  end_time: string | null;
}

export interface ServiceMessageResponse {
  service_message_id: string;
  room_id: string;
  sender_type: string;
  sender_id: string;
  receiver_type: string;
  receiver_id: string;
  content: string;
  status: string;
  send_time: string;
  is_read: boolean;
}
