import request from "../utils/request";
import { API_PATHS } from "./api-paths";
import { mockApi, mockUsers, mockAdmins, mockPermissions, mockIdentities, mockUserStatistics } from "./mock-data";

/**
 * 检查是否使用模拟数据
 * 优先级：
 * 1. 环境变量 VITE_USE_MOCK_DATA 为 'true'
 * 2. 开发环境 (import.meta.env.DEV)
 * 用途：在开发阶段使用模拟数据，避免依赖真实后端服务
 */
// 不使用严格/强制的 mock 逻辑：仅当显式声明 VITE_USE_MOCK_DATA=true 才启用 mock。
// 这样管理面板默认会从后端 lenovo-shop-server 的 /admin/system/users 拉取数据。
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// 后端(lenovo-shop-server)管理端用户列表返回结构
// 对应：GET /admin/system/users
type BackendUserListItem = {
  user_id: string;
  account: string;
  email: string | null;
  nickname: string | null;
  avatar: string | null;
  member_type: string;
  gender: string;
  created_at: string | Date;
  status?: string; // 添加 status 字段
};

const mapBackendUserToUser = (u: BackendUserListItem): User => {
  const memberType = ((): User['memberType'] => {
    if (u.member_type === 'SVIP') return 'SVIP';
    if (u.member_type === 'VIP') return 'VIP';
    return 'NORMAL';
  })();

  const gender = ((): User['gender'] => {
    if (u.gender === 'MALE') return 'MALE';
    if (u.gender === 'FEMALE') return 'FEMALE';
    return 'UNKNOWN';
  })();

  return {
    id: u.user_id,
    account: u.account,
    email: u.email ?? '',
    nickname: u.nickname ?? undefined,
    avatar: u.avatar ?? undefined,
    memberType,
    gender,
    birthday: undefined,
    createdAt: typeof u.created_at === 'string' ? u.created_at : u.created_at.toISOString(),
    updatedAt: typeof u.created_at === 'string' ? u.created_at : u.created_at.toISOString(),
    lastLoginTime: undefined,
    status: (u.status as User['status']) || 'ACTIVE',
    orderCount: 0,
    totalSpent: 0,
  };
};

// ==================== 客户端用户管理 ====================

/**
 * 客户端用户实体接口
 * 包含用户的基本信息、会员类型、状态等
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
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  orderCount: number;
  totalSpent: number;
}

/**
 * 客户端用户列表查询参数接口
 * 支持分页、关键词搜索、会员类型筛选、状态筛选、时间范围筛选
 * 用于用户管理页面的数据查询和过滤
 */
export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  memberType?: string;
  status?: string;
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

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  vipUsers: number;
  svipUsers: number;
  averageOrderValue: number;
}

/**
 * 获取客户端用户列表
 * @param params 查询参数，包含分页、关键词、会员类型、状态等
 * @returns 用户列表响应数据
 */
export const getClientUsers = async (params: UserListParams): Promise<UserListResponse> => {
  if (USE_MOCK_DATA) {
    return mockApi.getClientUsers(params);
  }
  // 后端目前提供的是系统用户全量列表：GET /admin/system/users
  // 管理端 request.ts 会自动补 /admin 前缀，因此这里写 /system/users 即可。
  const list = await request.get<BackendUserListItem[]>(`/system/users`, { params });
  const mapped = Array.isArray(list) ? list.map(mapBackendUserToUser) : [];
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  // 后端当前接口不分页：前端做一次本地分页，保证 UI 行为不变。
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paged = mapped.slice(start, end);
  return {
    list: paged,
    total: mapped.length,
    page,
    pageSize,
  };
};

/**
 * 获取客户端用户详情
 * @param userId 用户ID
 * @returns 用户详情数据
 */
export const getClientUserDetail = async (userId: string): Promise<User> => {
  if (USE_MOCK_DATA) {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return Promise.resolve(user);
  }
  const response = await request.get<User>(`${API_PATHS.USER.CLIENT_DETAIL}/${userId}`);
  return response;
};

/**
 * 创建客户端用户（后端接口：POST /admin/system/users）
 */
export const createClientUser = async (data: {
  account: string;
  password: string;
  email: string;
  nickname?: string;
  memberType?: User['memberType'];
  status?: User['status'];
}): Promise<User> => {
  if (USE_MOCK_DATA) {
    // mock：返回一个临时对象
    return {
      id: `mock_${Date.now()}`,
      email: data.email,
      account: data.account,
      memberType: data.memberType ?? 'NORMAL',
      gender: 'UNKNOWN',
      nickname: data.nickname,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: data.status ?? 'ACTIVE',
      orderCount: 0,
      totalSpent: 0,
    };
  }

  const created = await request.post<BackendUserListItem>(`/system/users`, {
    account: data.account,
    password: data.password,
    email: data.email,
    nickname: data.nickname,
    member_type: data.memberType,
    status: data.status,
  });
  return mapBackendUserToUser(created);
};

/**
 * 更新客户端用户信息
 * @param userId 用户ID
 * @param data 更新的用户数据
 * @returns Promise<void>
 */
export const updateClientUser = async (userId: string, data: Partial<User>): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock update user:', userId, data);
    return Promise.resolve();
  }

  // 后端接口：PATCH /admin/system/users/:user_id
  await request.patch(`/system/users/${userId}`, {
    email: data.email,
    nickname: data.nickname,
    member_type: data.memberType,
    status: data.status,
  });
};

/**
 * 删除客户端用户
 * @param userId 用户ID
 * @returns Promise<void>
 */
export const deleteClientUser = async (userId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock delete user:', userId);
    return Promise.resolve();
  }
  // 后端(lenovo-shop-server)当前未提供对应的“删除客户端用户”管理端接口。
  // 为避免误调用不存在的接口，这里先降级为前端提示/空操作。
  console.warn('[ClientUser] deleteClientUser is not implemented on server yet:', userId);
  return Promise.resolve();
};

/**
 * 获取客户端用户统计信息
 * @returns 用户统计数据，包括总用户数、活跃用户数、今日新增用户数、VIP用户数、SVIP用户数、平均订单价值等
 */
export const getClientUserStatistics = async (): Promise<UserStatistics> => {
  if (USE_MOCK_DATA) {
    return Promise.resolve(mockUserStatistics);
  }
  // 后端当前未提供 /admin/user/client/statistics 之类的统计接口。
  // 这里改为基于 /admin/system/users 的结果做本地统计，确保管理后台可用。
  const list = await request.get<BackendUserListItem[]>(`/system/users`);
  const mapped = Array.isArray(list) ? list.map(mapBackendUserToUser) : [];

  const totalUsers = mapped.length;
  const vipUsers = mapped.filter((u) => u.memberType === 'VIP').length;
  const svipUsers = mapped.filter((u) => u.memberType === 'SVIP').length;
  // 后端当前未返回 status，这里按现有数据能力做“近似统计”
  const activeUsers = totalUsers;

  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  const startOfToday = new Date(y, m, d, 0, 0, 0, 0).getTime();
  const newUsersToday = mapped.filter((u) => {
    const t = Date.parse(u.createdAt);
    return Number.isFinite(t) && t >= startOfToday;
  }).length;

  return {
    totalUsers,
    activeUsers,
    newUsersToday,
    vipUsers,
    svipUsers,
    // 后端当前未返回消费相关字段，保持 0，避免误导。
    averageOrderValue: 0,
  };
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
  if (USE_MOCK_DATA) {
    return mockApi.getAdminList(params);
  }
  const response = await request.get<AdminListResponse>(API_PATHS.USER.ADMIN_LIST, { params });
  return response;
};

/**
 * 获取管理员详情
 * @param adminId 管理员ID
 * @returns 管理员详情数据
 */
export const getAdminDetail = async (adminId: string): Promise<Admin> => {
  if (USE_MOCK_DATA) {
    const admin = mockAdmins.find(a => a.id === adminId);
    if (!admin) throw new Error('Admin not found');
    return Promise.resolve(admin);
  }
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
  if (USE_MOCK_DATA) {
    console.log('Mock create admin:', data);
    const newAdmin: Admin = {
      id: `admin_${mockAdmins.length + 1}`,
      account: data.account,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      nickname: data.nickname,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      identities: [],
      productCategories: [],
    };
    return Promise.resolve(newAdmin);
  }
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
  if (USE_MOCK_DATA) {
    console.log('Mock update admin:', adminId, data);
    return Promise.resolve();
  }
  await request.put(`${API_PATHS.USER.ADMIN_UPDATE}/${adminId}`, data);
};

/**
 * 删除管理员
 * @param adminId 管理员ID
 * @returns Promise<void>
 */
export const deleteAdmin = async (adminId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock delete admin:', adminId);
    return Promise.resolve();
  }
  await request.delete(`${API_PATHS.USER.ADMIN_DELETE}/${adminId}`);
};

/**
 * 重置管理员密码
 * @param adminId 管理员ID
 * @param newPassword 新密码
 * @returns Promise<void>
 */
export const resetAdminPassword = async (adminId: string, newPassword: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock reset password:', adminId, newPassword);
    return Promise.resolve();
  }
  await request.post(`${API_PATHS.USER.ADMIN_RESET_PASSWORD}/${adminId}`, { newPassword });
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
  if (USE_MOCK_DATA) {
    return mockApi.getPermissionList();
  }
  const response = await request.get<Permission[]>(API_PATHS.USER.PERMISSION_LIST, { params });
  return response;
};

/**
 * 获取权限树结构
 * @returns 权限树结构数据，包含父子关系
 */
export const getPermissionTree = async (): Promise<Permission[]> => {
  if (USE_MOCK_DATA) {
    return mockApi.getPermissionTree();
  }
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
  if (USE_MOCK_DATA) {
    console.log('Mock create permission:', data);
    const newPermission: Permission = {
      id: `perm_${mockPermissions.length + 1}`,
      name: data.name,
      code: data.code,
      type: data.type,
      module: data.module,
      parentId: data.parentId || null,
      status: 'ACTIVE',
    };
    return Promise.resolve(newPermission);
  }
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
  if (USE_MOCK_DATA) {
    console.log('Mock update permission:', permissionId, data);
    return Promise.resolve();
  }
  await request.put(`${API_PATHS.USER.PERMISSION_UPDATE}/${permissionId}`, data);
};

/**
 * 删除权限
 * @param permissionId 权限ID
 * @returns Promise<void>
 */
export const deletePermission = async (permissionId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock delete permission:', permissionId);
    return Promise.resolve();
  }
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
  if (USE_MOCK_DATA) {
    return mockApi.getIdentityList(params);
  }
  const response = await request.get<IdentityListResponse>(API_PATHS.USER.IDENTITY_LIST, { params });
  return response;
};

/**
 * 获取身份详情
 * @param identityId 身份ID
 * @returns 身份详情数据
 */
export const getIdentityDetail = async (identityId: string): Promise<Identity> => {
  if (USE_MOCK_DATA) {
    const identity = mockIdentities.find(i => i.id === identityId);
    if (!identity) throw new Error('Identity not found');
    return Promise.resolve(identity);
  }
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
  if (USE_MOCK_DATA) {
    console.log('Mock create identity:', data);
    const newIdentity: Identity = {
      id: `identity_${mockIdentities.length + 1}`,
      name: data.name,
      code: data.code,
      description: data.description,
      isSystem: false,
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  creatorId: 'admin_1',
  creatorName: '超级管理员',
  permissions: [],
};
return Promise.resolve(newIdentity);
}
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
  if (USE_MOCK_DATA) {
    console.log('Mock update identity:', identityId, data);
    return Promise.resolve();
  }
  await request.put(`${API_PATHS.USER.IDENTITY_UPDATE}/${identityId}`, data);
};

/**
 * 删除身份
 * @param identityId 身份ID
 * @returns Promise<void>
 */
export const deleteIdentity = async (identityId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock delete identity:', identityId);
    return Promise.resolve();
  }
  await request.delete(`${API_PATHS.USER.IDENTITY_DELETE}/${identityId}`);
};

/**
 * 为身份分配权限
 * @param identityId 身份ID
 * @param permissionIds 权限ID列表
 * @returns Promise<void>
 */
export const assignPermissionsToIdentity = async (identityId: string, permissionIds: string[]): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock assign permissions:', identityId, permissionIds);
    return Promise.resolve();
  }
  await request.post(API_PATHS.USER.IDENTITY_PERMISSION_ASSIGN, { identityId, permissionIds });
};

/**
 * 从身份撤销权限
 * @param identityId 身份ID
 * @param permissionIds 权限ID列表
 * @returns Promise<void>
 */
export const revokePermissionsFromIdentity = async (identityId: string, permissionIds: string[]): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock revoke permissions:', identityId, permissionIds);
    return Promise.resolve();
  }
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
  if (USE_MOCK_DATA) {
    console.log('Mock assign identity to admin:', adminId, identityId);
    return Promise.resolve();
  }
  await request.post(API_PATHS.USER.ADMIN_IDENTITY_ASSIGN, { adminId, identityId });
};

/**
 * 从管理员撤销身份
 * @param adminId 管理员ID
 * @param identityId 身份ID
 * @returns Promise<void>
 */
export const revokeIdentityFromAdmin = async (adminId: string, identityId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock revoke identity from admin:', adminId, identityId);
    return Promise.resolve();
  }
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
  if (USE_MOCK_DATA) {
    return mockApi.getOnlineList();
  }
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
  if (USE_MOCK_DATA) {
    console.log('Mock force logout:', sessionId, userType);
    return Promise.resolve();
  }
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
  if (USE_MOCK_DATA) {
    return mockApi.getLoginRecords(params);
  }
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