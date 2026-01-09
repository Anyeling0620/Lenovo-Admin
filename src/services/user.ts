import request from "../utils/request";
import { API_PATHS } from "./api-paths";

// 后端(lenovo-shop-server)管理端用户列表返回结构
// 对应：GET /admin/clients
type BackendClientUser = {
  id: string;
  account: string;
  email: string | null;
  nickname: string | null;
  avatar: string | null;
  memberType: 'NORMAL' | 'VIP' | 'SVIP';
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthday: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  orderCount: number;
  totalSpent: number;
};

const mapBackendClientToUser = (u: BackendClientUser): User => {
  return {
    id: u.id,
    account: u.account,
    email: u.email ?? '',
    nickname: u.nickname ?? undefined,
    avatar: u.avatar ?? undefined,
    memberType: u.memberType,
    gender: u.gender,
    birthday: u.birthday ?? undefined,
    createdAt: typeof u.createdAt === 'string' ? u.createdAt : u.createdAt.toISOString(),
    updatedAt: typeof u.updatedAt === 'string' ? u.updatedAt : u.updatedAt.toISOString(),
    lastLoginTime: undefined,
    orderCount: u.orderCount,
    totalSpent: u.totalSpent,
  };
};

// ==================== 客户端用户管理 ====================

/**
 * 客户端用户实体接口
 * 包含用户的基本信息、会员类型等
 * 用于前端用户管理页面的数据展示和操作
 */
export interface User {
  id: string;
  email: string;
  account: string;
  memberType: 'NORMAL' | 'VIP' | 'SVIP';
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthday?: string;
  avatar?: string;
  nickname?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginTime?: string;
  orderCount: number;
  totalSpent: number;
}

/**
 * 客户端用户列表查询参数接口
 * 支持分页、关键词搜索、会员类型筛选、时间范围筛选
 * 用于用户管理页面的数据查询和过滤
 */
export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  memberType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 客户端用户列表响应接口
 * 包含用户列表数据、分页信息、总数统计
 * 用于前端用户管理页面的数据展示和操作
 */
export interface UserListResponse {
  list: User[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取客户端用户列表
 * @param params 查询参数，包含分页、关键词、会员类型等
 * @returns 用户列表响应数据
 */
export const getClientUsers = async (params: UserListParams): Promise<UserListResponse> => {
  // 使用新的客户端用户管理API：GET /admin/clients
  const response = await request.get<{
    list: BackendClientUser[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/clients`, { params });
  
  return {
    list: response.list.map(mapBackendClientToUser),
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
  };
};

/**
 * 获取客户端用户详情
 * @param userId 用户ID
 * @returns 用户详情数据
 */
export const getClientUserDetail = async (userId: string): Promise<User> => {
  const response = await request.get<BackendClientUser>(`/clients/${userId}`);
  return mapBackendClientToUser(response);
};

/**
 * 更新客户端用户信息
 * @param userId 用户ID
 * @param data 更新的用户数据
 * @returns Promise<void>
 */
export const updateClientUser = async (userId: string, data: Partial<User>): Promise<void> => {
  // 使用新的客户端用户管理API：PATCH /admin/clients/:id
  await request.patch(`/clients/${userId}`, {
    nickname: data.nickname,
    memberType: data.memberType,
  });
};


// ==================== 后台管理员管理 ====================

/**
 * 后台管理员实体接口
 * 包含管理员的基本信息、身份信息、商品专区权限等
 * 用于后台管理员管理页面的数据展示和操作
 */
export interface Admin {
  id: string;
  account: string;
  name: string;
  email?: string;
  avatar?: string;
  nickname?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  createdAt: string;
  lastLoginTime?: string;
  creatorId?: string;
  creatorName?: string;
  identities: Identity[];
  productCategories: ProductCategory[];
}

export interface AdminListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  identityId?: string;
}

export interface AdminListResponse {
  list: Admin[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取管理员列表
 * @param params 查询参数，包含分页、关键词、状态、身份ID等
 * @returns 管理员列表响应数据
 */
export const getAdminList = async (params: AdminListParams): Promise<AdminListResponse> => {
  const response = await request.get<AdminListResponse>(API_PATHS.USER.ADMIN_LIST, { params });
  return response;
};

/**
 * 获取管理员详情
 * @param adminId 管理员ID
 * @returns 管理员详情数据
 */
export const getAdminDetail = async (adminId: string): Promise<Admin> => {
  const response = await request.get<Admin>(`${API_PATHS.USER.ADMIN_DETAIL}/${adminId}`);
  return response;
};

/**
 * 创建管理员参数接口
 * 包含管理员的基本信息、密码、身份ID列表、商品分类ID列表等
 * 用于创建管理员页面的数据提交和操作
 */
export interface CreateAdminParams {
  account: string;
  password: string;
  name: string;
  email?: string;
  avatar?: string;
  nickname?: string;
  identityIds?: string[];
  categoryIds?: string[];
}

/**
 * 创建管理员
 * @param data 创建管理员参数
 * @returns 新创建的管理员数据
 */
export const createAdmin = async (data: CreateAdminParams): Promise<Admin> => {
  const response = await request.post<Admin>(API_PATHS.USER.ADMIN_CREATE, data);
  return response;
};

/**
 * 更新管理员信息
 * @param adminId 管理员ID
 * @param data 更新的管理员数据
 * @returns Promise<void>
 */
export const updateAdmin = async (adminId: string, data: Partial<CreateAdminParams>): Promise<void> => {
  await request.put(`${API_PATHS.USER.ADMIN_UPDATE}/${adminId}`, data);
};

/**
 * 删除管理员
 * @param adminId 管理员ID
 * @returns Promise<void>
 */
export const deleteAdmin = async (adminId: string): Promise<void> => {
  await request.delete(`${API_PATHS.USER.ADMIN_DELETE}/${adminId}`);
};

/**
 * 重置管理员密码
 * @param adminId 管理员ID
 * @param newPassword 新密码
 * @returns Promise<void>
 */
export const resetAdminPassword = async (adminId: string, newPassword: string): Promise<void> => {
  // Use ADMIN_DETAIL path (which is /system/admins) to construct the URL
  await request.post(`${API_PATHS.USER.ADMIN_DETAIL}/${adminId}/reset-password`, { newPassword });
};

// ==================== 权限管理 ====================

/**
 * 权限实体接口
 * 包含权限的基本信息、类型、所属模块、父子关系等
 * 用于权限管理页面的数据展示和操作
 */
export interface Permission {
  id: string;
  name: string;
  code?: string;
  type: 'MENU' | 'BUTTON' | 'API';
  module: string;
  parentId: string | null;
  children?: Permission[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PermissionListParams {
  type?: string;
  module?: string;
  status?: string;
}

/**
 * 获取权限列表
 * @param params 查询参数，包含类型、模块、状态等
 * @returns 权限列表数据
 */
export const getPermissionList = async (params?: PermissionListParams): Promise<Permission[]> => {
  const response = await request.get<Permission[]>(API_PATHS.USER.PERMISSION_LIST, { params });
  return response;
};

/**
 * 获取权限树结构
 * @returns 权限树结构数据，包含父子关系
 */
export const getPermissionTree = async (): Promise<Permission[]> => {
  const response = await request.get<Permission[]>(API_PATHS.USER.PERMISSION_TREE);
  return response;
};

/**
 * 创建权限参数接口
 * 包含权限的基本信息、类型、所属模块、父级ID等
 * 用于创建权限页面的数据提交和操作
 */
export interface CreatePermissionParams {
  name: string;
  code?: string;
  type: 'MENU' | 'BUTTON' | 'API';
  module: string;
  parentId?: string;
}

/**
 * 创建权限
 * @param data 创建权限参数
 * @returns 新创建的权限数据
 */
export const createPermission = async (data: CreatePermissionParams): Promise<Permission> => {
  const response = await request.post<Permission>(API_PATHS.USER.PERMISSION_CREATE, data);
  return response;
};

/**
 * 更新权限信息
 * @param permissionId 权限ID
 * @param data 更新的权限数据
 * @returns Promise<void>
 */
export const updatePermission = async (permissionId: string, data: Partial<CreatePermissionParams>): Promise<void> => {
  await request.put(`${API_PATHS.USER.PERMISSION_UPDATE}/${permissionId}`, data);
};

/**
 * 删除权限
 * @param permissionId 权限ID
 * @returns Promise<void>
 */
export const deletePermission = async (permissionId: string): Promise<void> => {
  await request.delete(`${API_PATHS.USER.PERMISSION_DELETE}/${permissionId}`);
};

// ==================== 身份（角色）管理 ====================

/**
 * 身份（角色）实体接口
 * 包含身份的基本信息、权限列表、系统标识等
 * 用于身份管理页面的数据展示和操作
 */
export interface Identity {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  creatorId?: string;
  creatorName?: string;
  permissions: Permission[];
}

export interface IdentityListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  isSystem?: boolean;
}

export interface IdentityListResponse {
  list: Identity[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取身份列表
 * @param params 查询参数，包含分页、关键词、状态、系统标识等
 * @returns 身份列表响应数据
 */
export const getIdentityList = async (params: IdentityListParams): Promise<IdentityListResponse> => {
  const response = await request.get<IdentityListResponse>(API_PATHS.USER.IDENTITY_LIST, { params });
  return response;
};

/**
 * 获取身份详情
 * @param identityId 身份ID
 * @returns 身份详情数据
 */
export const getIdentityDetail = async (identityId: string): Promise<Identity> => {
  const response = await request.get<Identity>(`${API_PATHS.USER.IDENTITY_DETAIL}/${identityId}`);
  return response;
};

/**
 * 创建身份参数接口
 * 包含身份的基本信息、权限ID列表等
 * 用于创建身份页面的数据提交和操作
 */
export interface CreateIdentityParams {
  name: string;
  code: string;
  description?: string;
  permissionIds?: string[];
}

/**
 * 创建身份
 * @param data 创建身份参数
 * @returns 新创建的身份数据
 */
export const createIdentity = async (data: CreateIdentityParams): Promise<Identity> => {
  const response = await request.post<Identity>(API_PATHS.USER.IDENTITY_CREATE, data);
  return response;
};

/**
 * 更新身份信息
 * @param identityId 身份ID
 * @param data 更新的身份数据
 * @returns Promise<void>
 */
export const updateIdentity = async (identityId: string, data: Partial<CreateIdentityParams>): Promise<void> => {
  await request.put(`${API_PATHS.USER.IDENTITY_UPDATE}/${identityId}`, data);
};

/**
 * 删除身份
 * @param identityId 身份ID
 * @returns Promise<void>
 */
export const deleteIdentity = async (identityId: string): Promise<void> => {
  await request.delete(`${API_PATHS.USER.IDENTITY_DELETE}/${identityId}`);
};

/**
 * 为身份分配权限
 * @param identityId 身份ID
 * @param permissionIds 权限ID列表
 * @returns Promise<void>
 */
export const assignPermissionsToIdentity = async (identityId: string, permissionIds: string[]): Promise<void> => {
  await request.post(API_PATHS.USER.IDENTITY_PERMISSION_ASSIGN, { identityId, permissionIds });
};

/**
 * 从身份撤销权限
 * @param identityId 身份ID
 * @param permissionIds 权限ID列表
 * @returns Promise<void>
 */
export const revokePermissionsFromIdentity = async (identityId: string, permissionIds: string[]): Promise<void> => {
  await request.post(API_PATHS.USER.IDENTITY_PERMISSION_REVOKE, { identityId, permissionIds });
};

// ==================== 管理员-身份关联 ====================

/**
 * 为管理员分配身份
 * @param adminId 管理员ID
 * @param identityId 身份ID
 * @returns Promise<void>
 */
export const assignIdentityToAdmin = async (adminId: string, identityId: string): Promise<void> => {
  await request.post(API_PATHS.USER.ADMIN_IDENTITY_ASSIGN, { adminId, identityId });
};

/**
 * 从管理员撤销身份
 * @param adminId 管理员ID
 * @param identityId 身份ID
 * @returns Promise<void>
 */
export const revokeIdentityFromAdmin = async (adminId: string, identityId: string): Promise<void> => {
  await request.post(API_PATHS.USER.ADMIN_IDENTITY_REVOKE, { adminId, identityId });
};

// ==================== 在线管理 ====================

/**
 * 在线用户实体接口
 * 包含在线用户的基本信息、登录设备信息、会话信息等
 * 用于在线管理页面的数据展示和操作
 */
export interface OnlineUser {
  id: string;
  userId: string;
  account: string;
  name: string;
  loginTime: string;
  deviceType: string;
  deviceName: string;
  ipAddress: string;
  sessionId: string;
  lastActivityTime: string;
}

export interface OnlineAdmin {
  id: string;
  adminId: string;
  account: string;
  name: string;
  loginTime: string;
  deviceType: string;
  deviceName: string;
  ipAddress: string;
  sessionId: string;
  lastActivityTime: string;
}

export interface OnlineListResponse {
  users: OnlineUser[];
  admins: OnlineAdmin[];
  totalUsers: number;
  totalAdmins: number;
}

/**
 * 获取在线用户列表
 * @returns 在线用户列表响应数据
 */
export const getOnlineList = async (): Promise<OnlineListResponse> => {
  const response = await request.get<OnlineListResponse>(API_PATHS.USER.ONLINE_LIST);
  return response;
};

/**
 * 强制下线
 * @param sessionId 会话ID
 * @param userType 用户类型
 * @returns Promise<void>
 */
export const forceLogout = async (sessionId: string, userType: 'USER' | 'ADMIN'): Promise<void> => {
  await request.post(API_PATHS.USER.ONLINE_FORCE_LOGOUT, { sessionId, userType });
};

// ==================== 登录记录 ====================

/**
 * 登录记录实体接口
 * 包含用户登录的基本信息、设备信息、登录状态等
 * 用于登录记录管理页面的数据展示和操作
 */
export interface LoginRecord {
  id: string;
  userId: string;
  account: string;
  name: string;
  deviceType: string;
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
  loginTime: string;
  logoutTime?: string;
  status: 'ONLINE' | 'OFFLINE';
}

export interface LoginRecordParams {
  page?: number;
  pageSize?: number;
  account?: string;
  deviceType?: string;
  startDate?: string;
  endDate?: string;
  userType?: 'USER' | 'ADMIN';
}

export interface LoginRecordResponse {
  list: LoginRecord[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取登录记录
 * @param params 查询参数，包含分页、账号、设备类型、时间范围、用户类型等
 * @returns 登录记录响应数据
 */
export const getLoginRecords = async (params: LoginRecordParams): Promise<LoginRecordResponse> => {
  const response = await request.get<LoginRecordResponse>(API_PATHS.USER.LOGIN_RECORDS, { params });
  return response;
};

// ==================== 商品专区 ====================

/**
 * 商品分类实体接口
 * 包含商品分类的基本信息、父子关系、状态等
 * 用于商品分类管理页面的数据展示和操作
 */
export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  status: 'ACTIVE' | 'INACTIVE';
}
