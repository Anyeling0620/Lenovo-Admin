# Lei 数据总览/工作台设计说明

本文描述在管理员后台根据不同身份展示的数据总览与工作台功能，并说明前端如何按身份动态控制展示和操作。

## 身份能力矩阵（基于后端 `/admin` 访问控制）
- `SUPER_ADMIN`：全量放行，数据总览可包含系统/商品/货架/订单/售后/营销/客服的核心指标；工作台可操作全部后台 API。
- `SYSTEM_ADMIN`：系统管理 + 订单/售后/投诉 + 营销 + 客服  
  数据：管理员/身份/权限统计、在线管理员、订单/售后/投诉概览、券/秒杀关键指标。  
  操作：管理员 CRUD、绑定/解绑身份、禁用/踢下线、重置密码，处理订单/售后/投诉，配置优惠券/代金券/秒杀，查看客服会话与消息。
- `PRODUCT_MANAGER`、`WAREHOUSE_MANAGER`：商品/库存 + 货架/陈列（受类目限制）  
  数据：商品统计 `/products/stats`，货架统计 `/shelf/stats`，库存/类目维度摘要。  
  操作：品牌/商品/标签 CRUD，商品配置与上下架、库存调整，货架商品/条目增删改、轮播/首页/新品推送配置。
- `ORDER_MANAGER`：订单/售后/投诉  
  数据：订单状态分布、售后/投诉量。  
  操作：订单流转（取消/待发货/发货/待收），处理售后与投诉。
- `AFTER_SALES`：售后/投诉  
  数据：售后/投诉量与处理状态。  
  操作：售后/投诉处理。
- `MARKETING`：营销  
  数据：优惠券/代金券/秒杀的发行与使用统计。  
  操作：优惠券/券中心/代金券/秒杀的创建与配置、查看使用明细。
- `CUSTOMER_SERVICE`：客服  
  数据：会话数量、未读消息、处理时长等（基于 `/service/sessions` & `/service/sessions/:room_id/messages` 统计）。  
  操作：查看会话、拉取消息、标记已读、结束会话、撤回消息。

## 数据总览 & 工作台展示策略
- 数据卡片/图表按身份白名单渲染：例如商品/货架指标仅对 `PRODUCT_MANAGER`/`WAREHOUSE_MANAGER`/`SUPER_ADMIN` 显示；订单指标对 `ORDER_MANAGER`/`SYSTEM_ADMIN`/`AFTER_SALES`/`SUPER_ADMIN` 显示；营销指标对 `MARKETING`/`SYSTEM_ADMIN`/`SUPER_ADMIN` 显示；客服指标对 `CUSTOMER_SERVICE`/`SYSTEM_ADMIN`/`SUPER_ADMIN` 显示。
- 工作台入口与操作按钮同样按身份白名单控制；涉及类目时在请求参数中携带类目并尊重后端的 `assertCategoryAccess`。
- 通用接口（个人信息/权限查看、修改密码、退出登录）在任何登录态均可使用。

## 前端获取身份与权限的方式
- 登录成功：`adminLogin`（`src/services/api.ts`）成功后后端下发 `admin_session` Cookie（`request` 默认 `withCredentials`）。
- 拉取当前身份/权限：  
  - `/account/profile` → `getAccountProfile()`，返回 `identities`（含身份 code）、`categories`、`permissions`。  
  - `/account/permissions` → `getAccountPermissions()`，返回 `permissionsTree`/`identities`/`categories` 语义化结构。
- 触发时机：`hooks/useAuth.ts` 的 `handleLoginUserInfo` 预留了登录后拉取并写入自定义 store 的位置；`request` 在 401 时派发 `SESSION_EXPIRED` 事件（需监听并引导重新登录）。

## 动态展示/功能控制方案
- 菜单与路由：按 `permissionsTree`/身份 code 过滤侧边菜单与可访问路由；必要时在 `PrivateRoute` 或页面层做身份校验，未命中跳转 403。
- 页面组件：数据卡片、表格操作列、按钮等按身份白名单/权限码显隐；对类目相关操作要结合 `categories` 限定请求。
- 接口调用：统一走 `src/utils/request.ts`，会自动补全 `/admin` 前缀与带上会话 Cookie。
- 错误处理：所有接口调用的 `catch` 使用 `globalErrorHandler.handle(error, globalMessage.error)`，401 会触发 session 过期事件，403/业务码会生成友好提示。

## 后续实现指引
- 在 `src/pages/Lei/Dashboard` 放数据总览页面，`src/pages/Lei/Workbench` 放工作台页面，路由注册在 `App.tsx`，菜单在 `SideMenu.tsx`。  
- 建议建立一个身份上下文/Store（含身份 codes、类目、权限树），供菜单过滤、页面显隐与接口参数复用。
