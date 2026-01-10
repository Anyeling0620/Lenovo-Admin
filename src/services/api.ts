/* eslint-disable @typescript-eslint/no-explicit-any */

import request from '../utils/request';
import type { AdminLoginRequest, AdminProfileResponse, UpdateAdminProfileRequest, UserListItem, AdminListItem, IdentityWithPermissions, PermissionMenuItem, ResetPasswordRequest, BrandResponse, CreateBrandRequest, CategoryResponse, ProductCreateRequest, ProductUpdateRequest, ProductListItem, ProductDetailResponse, TagCreateRequest, TagUpdateRequest, TagResponse, ProductTagBindRequest, ProductConfigCreateRequest, ProductConfigUpdateRequest, ProductConfigResponse, ProductStatsResponse, StockResponse, StockUpdateRequest, ShelfProductResponse, ShelfProductCreateRequest, ShelfFlagsRequest, ShelfProductItemCreateRequest, ShelfProductItemUpdateRequest, ShelfCarouselRequest, ShelfStatsResponse, HomePushRequest, HomePushResponse, NewPushResponse, ShelfStatusRequest, CouponResponse, CouponCenterResponse, CouponCreateRequest, CouponCenterRequest, CouponUserResponse, CouponStatsResponse, VoucherResponse, VoucherCreateRequest, VoucherUserResponse, IssueVoucherRequest, SeckillRoundResponse, SeckillRoundCreateRequest, SeckillProductCreateRequest, SeckillConfigCreateRequest, OrderListItem, OrderDetailResponse, AfterSaleResponse, AfterSaleHandleRequest, ComplaintResponse, ComplaintHandleRequest, ServiceSessionResponse, ServiceMessageResponse, AdminLoginResponse, AdminPermissionResponse } from './api-type';


const toFormData = (
  payload: Record<string, any>,
  files?: Record<string, File | undefined>
): FormData => {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.set(k, typeof v === 'boolean' || typeof v === 'number' ? String(v) : v);
  });
  if (files) {
    Object.entries(files).forEach(([k, f]) => {
      if (f) fd.append(k, f);
    });
  }
  return fd;
};

// 账号 / 权限
export const adminLogin = (data: AdminLoginRequest) =>
  request.post<AdminLoginResponse>('/login', data, {
    headers: {
      'X-Device-Type': /Mobile/.test(navigator.userAgent) ? 'mobile' : 'pc',
      'X-Device-Name': navigator.userAgent.slice(0, 40),
    }
  });
export const adminLogout = () => request.post<null>('/logout');
export const getAccountProfile = () => request.get<AdminProfileResponse>('/account/profile');
export const updateAccountProfile = (data: UpdateAdminProfileRequest & { avatarFile?: File }) => {
  const fd = toFormData(
    {
      name: data.name,
      nickname: data.nickname,
      gender: data.gender,
      email: data.email,
    },
    { images: data.avatarFile }
  );
  return request.uploadPatch<
    Pick<AdminProfileResponse, 'admin_id' | 'name' | 'nickname' | 'gender' | 'email' | 'avatar'>
  >('/account/profile', fd);
};
export const getAccountPermissions = () =>
  request.get<AdminPermissionResponse>('/account/permissions');
export const changeAccountPassword = (data: { old_password: string; new_password: string }) =>
  request.patch<null>('/account/password', data);
export const getPermissions = () => request.get<AdminPermissionResponse>('/permissions');

export const getUsers = () => request.get<UserListItem[]>('/system/users');
export const getAdmins = () => request.get<AdminListItem[]>('/system/admins');
export const createAdmin = (data: {
  account: string;
  password: string;
  name: string;
  nickname?: string;
  email?: string;
  gender?: string;
  identity_ids?: string[];
  category_ids?: string[];
}) => request.post('/system/admins', data);
export const getIdentitiesWithPermissions = () =>
  request.get<IdentityWithPermissions[]>('/system/identities');
export const getPermissionMenu = () => request.get<PermissionMenuItem[]>('/system/permissions');
export const bindAdminIdentity = (adminId: string, data: { identity_id: string; expire_time?: string | null }) =>
  request.post(`/system/admins/${adminId}/identities`, data);
export const unbindAdminIdentity = (adminId: string, identityId: string) =>
  request.delete<null>(`/system/admins/${adminId}/identities/${identityId}`);
export const getOnlineAdmins = () => request.get<any[]>('/system/admins/online');
export const kickAdminOffline = (adminId: string) =>
  request.post<null>(`/system/admins/${adminId}/logout`);
export const disableAdmin = (adminId: string) =>
  request.post<null>(`/system/admins/${adminId}/disable`);
export const updateAdminIdentityExpire = (adminId: string, identityId: string, data: { expire_time: string | null }) =>
  request.patch<null>(`/system/admins/${adminId}/identities/${identityId}/expire`, data);
export const updateIdentityStatus = (identityId: string, data: { status: string }) =>
  request.patch<null>(`/system/identities/${identityId}/status`, data);
export const resetAdminPassword = (adminId: string, data: ResetPasswordRequest) =>
  request.post<null>(`/system/admins/${adminId}/reset-password`, data);

// 品牌 / 商品 / 标签 / 配置 / 库存
export const getBrands = (status?: string) =>
  request.get<BrandResponse[]>('/brands', { params: { status } });
export const createBrand = (data: CreateBrandRequest & { logoFile?: File }) => {
  const fd = toFormData(
    {
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.status,
    },
    { images: data.logoFile }
  );
  return request.upload<{ brand_id: string }>('/brands', fd);
};
export const updateBrand = (brandId: string, data: Partial<CreateBrandRequest> & { logoFile?: File }) => {
  const fd = toFormData(
    {
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.status,
      remark: (data as any).remark,
    },
    { images: data.logoFile }
  );
  return request.uploadPatch<null>(`/brands/${brandId}`, fd);
};
export const getCategories = (status?: string) =>
  request.get<CategoryResponse[]>('/categories', { params: { status } });
export const createProduct = (data: ProductCreateRequest & { mainImageFile?: File }) => {
  const fd = toFormData(
    {
      brand_id: data.brand_id,
      category_id: data.category_id,
      name: data.name,
      sub_title: data.sub_title,
      description: data.description,
      status: (data as any).status,
    },
    { images: data.mainImageFile }
  );
  return request.upload<{ product_id: string }>('/products', fd);
};
export const updateProduct = (productId: string, data: ProductUpdateRequest & { mainImageFile?: File }) => {
  const fd = toFormData(
    {
      brand_id: data.brand_id,
      category_id: data.category_id,
      name: data.name,
      sub_title: data.sub_title,
      description: data.description,
      status: data.status,
    },
    { images: data.mainImageFile }
  );
  return request.uploadPatch<null>(`/products/${productId}`, fd);
};
export const getProducts = (params?: { category_id?: string; brand_id?: string; status?: string }) =>
  request.get<ProductListItem[]>('/products', { params });
export const getProductDetail = (productId: string) =>
  request.get<ProductDetailResponse>(`/products/${productId}`);
export const updateProductStatus = (productId: string, status: string) =>
  request.patch<null>(`/products/${productId}/status`, { status });

export const createTag = (data: TagCreateRequest) =>
  request.post<{ tag_id: string }>('/tags', data);
export const updateTag = (tagId: string, data: TagUpdateRequest) =>
  request.patch<null>(`/tags/${tagId}`, data);
export const deleteTag = (tagId: string) => request.delete<null>(`/tags/${tagId}`);
export const getTags = (status?: string) =>
  request.get<TagResponse[]>('/tags', { params: { status } });
export const bindProductTag = (data: ProductTagBindRequest) =>
  request.post<{ product_tag_relation_id: string }>('/product-tags', data);
export const unbindProductTag = (data: ProductTagBindRequest) =>
  request.post<null>('/product-tags/unbind', data);

export const addProductConfig = (productId: string, data: ProductConfigCreateRequest & { configImageFile?: File }) => {
  const fd = toFormData(
    {
      product_id: data.product_id,
      config1: data.config1,
      config2: data.config2,
      config3: data.config3,
      sale_price: data.sale_price,
      original_price: data.original_price,
    },
    { images: data.configImageFile }
  );
  return request.upload<{ product_config_id: string }>(`/products/${productId}/configs`, fd);
};
export const updateProductConfig = (configId: string, data: ProductConfigUpdateRequest & { configImageFile?: File }) => {
  const fd = toFormData(
    {
      config1: data.config1,
      config2: data.config2,
      config3: data.config3,
      sale_price: data.sale_price,
      original_price: data.original_price,
      status: data.status,
    },
    { images: data.configImageFile }
  );
  return request.uploadPatch<null>(`/configs/${configId}`, fd);
};
export const getProductConfigs = (productId: string) =>
  request.get<ProductConfigResponse[]>(`/products/${productId}/configs`);
export const getProductConfigDetail = (configId: string) =>
  request.get<ProductConfigResponse>(`/configs/${configId}`);
export const deleteProductConfig = (configId: string) =>
  request.delete<null>(`/configs/${configId}`);
export const getProductStats = () => request.get<ProductStatsResponse>('/products/stats');

export const getStocks = () => request.get<StockResponse[]>('/stocks');
export const updateStock = (configId: string, data: StockUpdateRequest) =>
  request.patch<null>(`/stocks/${configId}`, data);
export const updateProductConfigStatus = (configId: string, status: string) =>
  request.patch<null>(`/configs/${configId}/status`, { status });

export const addProductAppearance = (productId: string, imageFile: File) => {
  const fd = toFormData({}, { images: imageFile });
  return request.upload<{ product_appearance_id: string }>(`/products/${productId}/appearances`, fd);
};
export const updateProductAppearance = (appearanceId: string, imageFile: File) => {
  const fd = toFormData({}, { images: imageFile });
  return request.uploadPatch<null>(`/appearances/${appearanceId}`, fd);
};
export const addProductBanner = (productId: string, data: { imageFile: File; sort?: number }) => {
  const fd = toFormData({ sort: data.sort }, { images: data.imageFile });
  return request.upload<{ product_banner_id: string }>(`/products/${productId}/banners`, fd);
};
export const updateProductBanner = (bannerId: string, data: { imageFile?: File; sort?: number }) => {
  const fd = toFormData({ sort: data.sort }, { images: data.imageFile });
  return request.uploadPatch<null>(`/banners/${bannerId}`, fd);
};

// 货架 / 上架
export const getShelfProducts = (params?: { category_id?: string; status?: string }) =>
  request.get<ShelfProductResponse[]>('/shelf/products', { params });
export const createShelfProduct = (data: ShelfProductCreateRequest) =>
  request.post<{ shelf_product_id: string }>('/shelf/products', data);
export const updateShelfFlags = (
  shelfProductId: string,
  data: ShelfFlagsRequest
) => request.patch<null>(`/shelf/products/${shelfProductId}/flags`, data);
export const addShelfItem = (data: ShelfProductItemCreateRequest) =>
  request.post<{ shelf_product_item_id: string }>('/shelf/items', data);
export const updateShelfItemQuantity = (itemId: string, data: ShelfProductItemUpdateRequest) =>
  request.patch<null>(`/shelf/items/${itemId}`, data);
export const deleteShelfItem = (itemId: string) => request.delete<null>(`/shelf/items/${itemId}`);
export const setShelfCarousel = (shelfProductId: string, data: ShelfCarouselRequest & { imageFile?: File }) => {
  const fd = toFormData(
    { is_carousel: data.is_carousel },
    { images: data.imageFile }
  );
  return request.uploadPatch<null>(`/shelf/products/${shelfProductId}/carousel`, fd);
};
export const getShelfStats = () => request.get<ShelfStatsResponse[]>('/shelf/stats');
export const getCategoryShelfProducts = (categoryId: string) =>
  request.get<ShelfProductResponse[]>(`/shelf/categories/${categoryId}/products`);
export const setHomePush = (data: HomePushRequest & { imageFile?: File }) => {
  const fd = toFormData(
    {
      shelf_product_id: data.shelf_product_id,
      start_time: data.start_time,
      end_time: data.end_time,
      is_carousel: data.is_carousel,
    },
    { images: data.imageFile }
  );
  return request.upload<{ home_push_id: string }>('/shelf/home-push', fd);
};
export const setNewPush = (data: HomePushRequest & { imageFile?: File }) => {
  const fd = toFormData(
    {
      shelf_product_id: data.shelf_product_id,
      start_time: data.start_time,
      end_time: data.end_time,
      is_carousel: data.is_carousel,
    },
    { images: data.imageFile }
  );
  return request.upload<{ new_product_push_id: string }>('/shelf/new-push', fd);
};
export const getHomePush = () => request.get<HomePushResponse[]>('/shelf/home-push');
export const getNewPush = () => request.get<NewPushResponse[]>('/shelf/new-push');
export const updateShelfStatus = (shelfProductId: string, data: ShelfStatusRequest) =>
  request.patch<null>(`/shelf/products/${shelfProductId}/status`, data);

// 营销
export const getCoupons = () => request.get<CouponResponse[]>('/marketing/coupons');
export const getCouponCenter = () => request.get<CouponCenterResponse[]>('/marketing/coupon-center');
export const getCouponDetailApi = (couponId: string) =>
  request.get<CouponResponse>(`/marketing/coupons/${couponId}`);
export const createCouponApi = (data: CouponCreateRequest) =>
  request.post<{ coupon_id: string }>('/marketing/coupons', data);
export const setCouponCenter = (data: CouponCenterRequest) =>
  request.post<{ coupon_center_id: string }>('/marketing/coupon-center', data);
export const getCouponUsers = (couponId: string) =>
  request.get<CouponUserResponse[]>(`/marketing/coupons/${couponId}/users`);
export const getCouponStats = (couponId: string) =>
  request.get<CouponStatsResponse>(`/marketing/coupons/${couponId}/stats`);
export const getVouchers = () => request.get<VoucherResponse[]>('/marketing/vouchers');
export const createVoucherApi = (data: VoucherCreateRequest) =>
  request.post<{ voucher_id: string }>('/marketing/vouchers', data);
export const getVoucherUsers = (voucherId: string) =>
  request.get<VoucherUserResponse[]>(`/marketing/vouchers/${voucherId}/users`);
export const issueVoucherApi = (voucherId: string, data: IssueVoucherRequest) =>
  request.post<null>(`/marketing/vouchers/${voucherId}/issue`, data);
export const getSeckillRounds = () => request.get<SeckillRoundResponse[]>('/marketing/seckill-rounds');
export const createSeckillRoundApi = (data: SeckillRoundCreateRequest) =>
  request.post<{ seckill_round_id: string }>('/marketing/seckill-rounds', data);
export const addSeckillProductApi = (data: SeckillProductCreateRequest) =>
  request.post<{ seckill_product_id: string }>('/marketing/seckill-products', data);
export const addSeckillConfigApi = (data: SeckillConfigCreateRequest) =>
  request.post<{ seckill_product_config_id: string }>('/marketing/seckill-configs', data);

// 订单 / 售后
export const getOrders = () => request.get<OrderListItem[]>('/orders');
export const getOrderDetailApi = (orderId: string) =>
  request.get<OrderDetailResponse>(`/orders/${orderId}`);
export const cancelOrder = (orderId: string) =>
  request.post<null>(`/orders/${orderId}/cancel`);
export const setOrderPendingShip = (orderId: string) =>
  request.post<null>(`/orders/${orderId}/pending-ship`);
export const shipOrder = (orderId: string, logisticsNo: string) =>
  request.post<null>(`/orders/${orderId}/ship`, { logistics_no: logisticsNo });
export const setOrderPendingReceive = (orderId: string) =>
  request.post<null>(`/orders/${orderId}/pending-receive`);
export const getAfterSales = () => request.get<AfterSaleResponse[]>('/after-sales');
export const handleAfterSale = (afterSaleId: string, data: AfterSaleHandleRequest) =>
  request.post<null>(`/after-sales/${afterSaleId}/handle`, data);
export const getComplaints = () => request.get<ComplaintResponse[]>('/complaints');
export const handleComplaint = (complaintId: string, data: ComplaintHandleRequest) =>
  request.post<null>(`/complaints/${complaintId}/handle`, data);

// 客服
export const getServiceSessions = () => request.get<ServiceSessionResponse[]>('/service/sessions');
export const getServiceMessages = (roomId: string) =>
  request.get<ServiceMessageResponse[]>(`/service/sessions/${roomId}/messages`);
export const markServiceMessageRead = (messageId: string) =>
  request.post<null>(`/service/messages/${messageId}/read`);
export const endServiceSession = (roomId: string) =>
  request.post<null>(`/service/sessions/${roomId}/end`);
export const withdrawServiceMessage = (messageId: string) =>
  request.post<null>(`/service/messages/${messageId}/withdraw`);
