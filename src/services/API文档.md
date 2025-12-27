# 联想商城管理后台 API 文档

## 目录
- [账号 / 权限](#账号--权限)
- [品牌 / 商品 / 标签 / 配置 / 库存](#品牌--商品--标签--配置--库存)
- [货架 / 上架](#货架--上架)
- [营销](#营销)
- [订单 / 售后](#订单--售后)
- [客服](#客服)

---

## 账号 / 权限

### 管理员登录
- **接口**: `POST /login`
- **参数**: `AdminLoginRequest`
- **响应**: `AdminLoginResponse`
- **说明**: 管理员登录接口，请求头会自动添加设备类型和设备名称

### 管理员登出
- **接口**: `POST /logout`
- **响应**: `null`
- **说明**: 管理员登出接口

### 获取账户资料
- **接口**: `GET /account/profile`
- **响应**: `AdminProfileResponse`
- **说明**: 获取当前登录管理员的个人资料

### 更新账户资料
- **接口**: `UPLOAD_PATCH /account/profile`
- **参数**: `UpdateAdminProfileRequest` (可包含头像文件)
- **响应**: 部分管理员资料
- **说明**: 更新当前登录管理员的个人资料，包括头像

### 获取账户权限
- **接口**: `GET /account/permissions`
- **响应**: `AdminPermissionResponse`
- **说明**: 获取当前登录管理员的权限信息

### 修改账户密码
- **接口**: `PATCH /account/password`
- **参数**: `{ old_password: string; new_password: string }`
- **响应**: `null`
- **说明**: 修改当前登录管理员的密码

### 获取所有权限
- **接口**: `GET /permissions`
- **响应**: `AdminPermissionResponse`
- **说明**: 获取系统中的所有权限信息

### 获取用户列表
- **接口**: `GET /system/users`
- **响应**: `UserListItem[]`
- **说明**: 获取系统中的用户列表

### 获取管理员列表
- **接口**: `GET /system/admins`
- **响应**: `AdminListItem[]`
- **说明**: 获取系统中的管理员列表

### 创建管理员
- **接口**: `POST /system/admins`
- **参数**: 管理员信息对象
- **响应**: 无特定响应
- **说明**: 创建新的管理员账号

### 获取身份及权限
- **接口**: `GET /system/identities`
- **响应**: `IdentityWithPermissions[]`
- **说明**: 获取系统中的身份及其关联的权限

### 获取权限菜单
- **接口**: `GET /system/permissions`
- **响应**: `PermissionMenuItem[]`
- **说明**: 获取权限菜单结构

### 绑定管理员身份
- **接口**: `POST /system/admins/{adminId}/identities`
- **参数**: `{ identity_id: string; expire_time?: string | null }`
- **响应**: 无特定响应
- **说明**: 为管理员绑定身份，可设置过期时间

### 解绑管理员身份
- **接口**: `DELETE /system/admins/{adminId}/identities/{identityId}`
- **响应**: `null`
- **说明**: 解除管理员与身份的绑定

### 获取在线管理员
- **接口**: `GET /system/admins/online`
- **响应**: `any[]`
- **说明**: 获取当前在线的管理员列表

### 强制管理员下线
- **接口**: `POST /system/admins/{adminId}/logout`
- **响应**: `null`
- **说明**: 强制指定管理员下线

### 禁用管理员
- **接口**: `POST /system/admins/{adminId}/disable`
- **响应**: `null`
- **说明**: 禁用指定的管理员账号

### 更新管理员身份过期时间
- **接口**: `PATCH /system/admins/{adminId}/identities/{identityId}/expire`
- **参数**: `{ expire_time: string | null }`
- **响应**: `null`
- **说明**: 更新管理员身份的过期时间

### 更新身份状态
- **接口**: `PATCH /system/identities/{identityId}/status`
- **参数**: `{ status: string }`
- **响应**: `null`
- **说明**: 更新身份的状态

### 重置管理员密码
- **接口**: `POST /system/admins/{adminId}/reset-password`
- **参数**: `ResetPasswordRequest`
- **响应**: `null`
- **说明**: 重置指定管理员的密码

---

## 品牌 / 商品 / 标签 / 配置 / 库存

### 获取品牌列表
- **接口**: `GET /brands`
- **参数**: `status?` (可选)
- **响应**: `BrandResponse[]`
- **说明**: 获取品牌列表，可按状态筛选

### 创建品牌
- **接口**: `UPLOAD /brands`
- **参数**: `CreateBrandRequest` (可包含Logo文件)
- **响应**: `{ brand_id: string }`
- **说明**: 创建新品牌，可上传Logo

### 更新品牌
- **接口**: `UPLOAD_PATCH /brands/{brandId}`
- **参数**: 部分品牌信息 (可包含Logo文件)
- **响应**: `null`
- **说明**: 更新品牌信息，可更新Logo

### 获取分类列表
- **接口**: `GET /categories`
- **参数**: `status?` (可选)
- **响应**: `CategoryResponse[]`
- **说明**: 获取商品分类列表，可按状态筛选

### 创建商品
- **接口**: `UPLOAD /products`
- **参数**: `ProductCreateRequest` (可包含主图文件)
- **响应**: `{ product_id: string }`
- **说明**: 创建新商品，可上传主图

### 更新商品
- **接口**: `UPLOAD_PATCH /products/{productId}`
- **参数**: `ProductUpdateRequest` (可包含主图文件)
- **响应**: `null`
- **说明**: 更新商品信息，可更新主图

### 获取商品列表
- **接口**: `GET /products`
- **参数**: `{ category_id?: string; brand_id?: string; status?: string }` (可选)
- **响应**: `ProductListItem[]`
- **说明**: 获取商品列表，可按分类、品牌、状态筛选

### 获取商品详情
- **接口**: `GET /products/{productId}`
- **响应**: `ProductDetailResponse`
- **说明**: 获取指定商品的详细信息

### 更新商品状态
- **接口**: `PATCH /products/{productId}/status`
- **参数**: `{ status: string }`
- **响应**: `null`
- **说明**: 更新商品状态

### 创建标签
- **接口**: `POST /tags`
- **参数**: `TagCreateRequest`
- **响应**: `{ tag_id: string }`
- **说明**: 创建新标签

### 更新标签
- **接口**: `PATCH /tags/{tagId}`
- **参数**: `TagUpdateRequest`
- **响应**: `null`
- **说明**: 更新标签信息

### 删除标签
- **接口**: `DELETE /tags/{tagId}`
- **响应**: `null`
- **说明**: 删除指定标签

### 获取标签列表
- **接口**: `GET /tags`
- **参数**: `status?` (可选)
- **响应**: `TagResponse[]`
- **说明**: 获取标签列表，可按状态筛选

### 绑定商品标签
- **接口**: `POST /product-tags`
- **参数**: `ProductTagBindRequest`
- **响应**: `{ product_tag_relation_id: string }`
- **说明**: 为商品绑定标签

### 解绑商品标签
- **接口**: `POST /product-tags/unbind`
- **参数**: `ProductTagBindRequest`
- **响应**: `null`
- **说明**: 解除商品与标签的绑定

### 添加商品配置
- **接口**: `UPLOAD /products/{productId}/configs`
- **参数**: `ProductConfigCreateRequest` (可包含配置图片文件)
- **响应**: `{ product_config_id: string }`
- **说明**: 为商品添加配置，可上传配置图片

### 更新商品配置
- **接口**: `UPLOAD_PATCH /configs/{configId}`
- **参数**: `ProductConfigUpdateRequest` (可包含配置图片文件)
- **响应**: `null`
- **说明**: 更新商品配置，可更新配置图片

### 获取商品配置列表
- **接口**: `GET /products/{productId}/configs`
- **响应**: `ProductConfigResponse[]`
- **说明**: 获取指定商品的所有配置

### 获取商品配置详情
- **接口**: `GET /configs/{configId}`
- **响应**: `ProductConfigResponse`
- **说明**: 获取指定配置的详细信息

### 获取商品统计
- **接口**: `GET /products/stats`
- **响应**: `ProductStatsResponse`
- **说明**: 获取商品统计数据

### 获取库存列表
- **接口**: `GET /stocks`
- **响应**: `StockResponse[]`
- **说明**: 获取所有商品的库存信息

### 更新库存
- **接口**: `PATCH /stocks/{configId}`
- **参数**: `StockUpdateRequest`
- **响应**: `null`
- **说明**: 更新指定配置的库存

### 更新商品配置状态
- **接口**: `PATCH /configs/{configId}/status`
- **参数**: `{ status: string }`
- **响应**: `null`
- **说明**: 更新商品配置的状态

### 添加商品外观
- **接口**: `UPLOAD /products/{productId}/appearances`
- **参数**: 外观图片文件
- **响应**: `{ product_appearance_id: string }`
- **说明**: 为商品添加外观图片

### 更新商品外观
- **接口**: `UPLOAD_PATCH /appearances/{appearanceId}`
- **参数**: 外观图片文件
- **响应**: `null`
- **说明**: 更新商品外观图片

### 添加商品横幅
- **接口**: `UPLOAD /products/{productId}/banners`
- **参数**: `{ imageFile: File; sort?: number }`
- **响应**: `{ product_banner_id: string }`
- **说明**: 为商品添加横幅图片，可设置排序

### 更新商品横幅
- **接口**: `UPLOAD_PATCH /banners/{bannerId}`
- **参数**: `{ imageFile?: File; sort?: number }`
- **响应**: `null`
- **说明**: 更新商品横幅图片和排序

---

## 货架 / 上架

### 获取货架商品列表
- **接口**: `GET /shelf/products`
- **参数**: `{ category_id?: string; status?: string }` (可选)
- **响应**: `ShelfProductResponse[]`
- **说明**: 获取货架上的商品列表，可按分类、状态筛选

### 创建货架商品
- **接口**: `POST /shelf/products`
- **参数**: `ShelfProductCreateRequest`
- **响应**: `{ shelf_product_id: string }`
- **说明**: 创建新的货架商品

### 更新货架标志
- **接口**: `PATCH /shelf/products/{shelfProductId}/flags`
- **参数**: `ShelfFlagsRequest`
- **响应**: `null`
- **说明**: 更新货架商品的标志信息

### 添加货架项
- **接口**: `POST /shelf/items`
- **参数**: `ShelfProductItemCreateRequest`
- **响应**: `{ shelf_product_item_id: string }`
- **说明**: 为货架商品添加项目

### 更新货架项数量
- **接口**: `PATCH /shelf/items/{itemId}`
- **参数**: `ShelfProductItemUpdateRequest`
- **响应**: `null`
- **说明**: 更新货架项的数量

### 删除货架项
- **接口**: `DELETE /shelf/items/{itemId}`
- **响应**: `null`
- **说明**: 删除指定的货架项

### 设置货架轮播
- **接口**: `UPLOAD_PATCH /shelf/products/{shelfProductId}/carousel`
- **参数**: `ShelfCarouselRequest` (可包含图片文件)
- **响应**: `null`
- **说明**: 设置货架商品是否为轮播图，可上传轮播图片

### 获取货架统计
- **接口**: `GET /shelf/stats`
- **响应**: `ShelfStatsResponse[]`
- **说明**: 获取货架统计数据

### 获取分类货架商品
- **接口**: `GET /shelf/categories/{categoryId}/products`
- **响应**: `ShelfProductResponse[]`
- **说明**: 获取指定分类下的货架商品

### 设置首页推送
- **接口**: `UPLOAD /shelf/home-push`
- **参数**: `HomePushRequest` (可包含图片文件)
- **响应**: `{ home_push_id: string }`
- **说明**: 设置首页推送商品，可上传推送图片

### 设置新品推送
- **接口**: `UPLOAD /shelf/new-push`
- **参数**: `HomePushRequest` (可包含图片文件)
- **响应**: `{ new_product_push_id: string }`
- **说明**: 设置新品推送商品，可上传推送图片

### 获取首页推送
- **接口**: `GET /shelf/home-push`
- **响应**: `HomePushResponse[]`
- **说明**: 获取首页推送商品列表

### 获取新品推送
- **接口**: `GET /shelf/new-push`
- **响应**: `NewPushResponse[]`
- **说明**: 获取新品推送商品列表

### 更新货架状态
- **接口**: `PATCH /shelf/products/{shelfProductId}/status`
- **参数**: `ShelfStatusRequest`
- **响应**: `null`
- **说明**: 更新货架商品的状态

---

## 营销

### 获取优惠券列表
- **接口**: `GET /marketing/coupons`
- **响应**: `CouponResponse[]`
- **说明**: 获取所有优惠券列表

### 获取优惠券中心
- **接口**: `GET /marketing/coupon-center`
- **响应**: `CouponCenterResponse[]`
- **说明**: 获取优惠券中心信息

### 获取优惠券详情
- **接口**: `GET /marketing/coupons/{couponId}`
- **响应**: `CouponResponse`
- **说明**: 获取指定优惠券的详细信息

### 创建优惠券
- **接口**: `POST /marketing/coupons`
- **参数**: `CouponCreateRequest`
- **响应**: `{ coupon_id: string }`
- **说明**: 创建新的优惠券

### 设置优惠券中心
- **接口**: `POST /marketing/coupon-center`
- **参数**: `CouponCenterRequest`
- **响应**: `{ coupon_center_id: string }`
- **说明**: 设置优惠券中心信息

### 获取优惠券用户
- **接口**: `GET /marketing/coupons/{couponId}/users`
- **响应**: `CouponUserResponse[]`
- **说明**: 获取领取指定优惠券的用户列表

### 获取优惠券统计
- **接口**: `GET /marketing/coupons/{couponId}/stats`
- **响应**: `CouponStatsResponse`
- **说明**: 获取指定优惠券的统计数据

### 获取代金券列表
- **接口**: `GET /marketing/vouchers`
- **响应**: `VoucherResponse[]`
- **说明**: 获取所有代金券列表

### 创建代金券
- **接口**: `POST /marketing/vouchers`
- **参数**: `VoucherCreateRequest`
- **响应**: `{ voucher_id: string }`
- **说明**: 创建新的代金券

### 获取代金券用户
- **接口**: `GET /marketing/vouchers/{voucherId}/users`
- **响应**: `VoucherUserResponse[]`
- **说明**: 获取领取指定代金券的用户列表

### 发放代金券
- **接口**: `POST /marketing/vouchers/{voucherId}/issue`
- **参数**: `IssueVoucherRequest`
- **响应**: `null`
- **说明**: 向用户发放代金券

### 获取秒杀轮次
- **接口**: `GET /marketing/seckill-rounds`
- **响应**: `SeckillRoundResponse[]`
- **说明**: 获取所有秒杀轮次

### 创建秒杀轮次
- **接口**: `POST /marketing/seckill-rounds`
- **参数**: `SeckillRoundCreateRequest`
- **响应**: `{ seckill_round_id: string }`
- **说明**: 创建新的秒杀轮次

### 添加秒杀商品
- **接口**: `POST /marketing/seckill-products`
- **参数**: `SeckillProductCreateRequest`
- **响应**: `{ seckill_product_id: string }`
- **说明**: 添加秒杀商品

### 添加秒杀配置
- **接口**: `POST /marketing/seckill-configs`
- **参数**: `SeckillConfigCreateRequest`
- **响应**: `{ seckill_product_config_id: string }`
- **说明**: 添加秒杀商品配置

---

## 订单 / 售后

### 获取订单列表
- **接口**: `GET /orders`
- **响应**: `OrderListItem[]`
- **说明**: 获取订单列表

### 获取订单详情
- **接口**: `GET /orders/{orderId}`
- **响应**: `OrderDetailResponse`
- **说明**: 获取指定订单的详细信息

### 取消订单
- **接口**: `POST /orders/{orderId}/cancel`
- **响应**: `null`
- **说明**: 取消指定订单

### 设置订单待发货
- **接口**: `POST /orders/{orderId}/pending-ship`
- **响应**: `null`
- **说明**: 将订单状态设置为待发货

### 发货订单
- **接口**: `POST /orders/{orderId}/ship`
- **参数**: `{ logistics_no: string }`
- **响应**: `null`
- **说明**: 为订单发货，需要提供物流单号

### 设置订单待收货
- **接口**: `POST /orders/{orderId}/pending-receive`
- **响应**: `null`
- **说明**: 将订单状态设置为待收货

### 获取售后列表
- **接口**: `GET /after-sales`
- **响应**: `AfterSaleResponse[]`
- **说明**: 获取售后申请列表

### 处理售后
- **接口**: `POST /after-sales/{afterSaleId}/handle`
- **参数**: `AfterSaleHandleRequest`
- **响应**: `null`
- **说明**: 处理售后申请

### 获取投诉列表
- **接口**: `GET /complaints`
- **响应**: `ComplaintResponse[]`
- **说明**: 获取投诉列表

### 处理投诉
- **接口**: `POST /complaints/{complaintId}/handle`
- **参数**: `ComplaintHandleRequest`
- **响应**: `null`
- **说明**: 处理投诉

---

## 客服

### 获取客服会话列表
- **接口**: `GET /service/sessions`
- **响应**: `ServiceSessionResponse[]`
- **说明**: 获取客服会话列表

### 获取客服消息
- **接口**: `GET /service/sessions/{roomId}/messages`
- **响应**: `ServiceMessageResponse[]`
- **说明**: 获取指定会话的消息列表

### 标记客服消息已读
- **接口**: `POST /service/messages/{messageId}/read`
- **响应**: `null`
- **说明**: 标记指定消息为已读

### 结束客服会话
- **接口**: `POST /service/sessions/{roomId}/end`
- **响应**: `null`
- **说明**: 结束指定的客服会话

### 撤回客服消息
- **接口**: `POST /service/messages/{messageId}/withdraw`
- **响应**: `null`
- **说明**: 撤回指定的客服消息
