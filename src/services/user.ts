import request from "../utils/request";
import { API_PATHS } from "./api-paths";
import { mockApi, mockUsers, mockAdmins, mockPermissions, mockIdentities, mockOnlineUsers, mockOnlineAdmins, mockLoginRecords, mockUserStatistics } from "./mock-data";

// 检查是否使用模拟数据
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || import.meta.env.DEV;

// ==================== 客户端用户管理 ====================

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

export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  memberType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

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

// 获取客户端用户列表
export const getClientUsers = async (params: UserListParams): Promise<UserListResponse> => {
  if (USE_MOCK_DATA) {
    return mockApi.getClientUsers(params);
  }
  const response = await request.get<UserListResponse>(API_PATHS.USER.CLIENT_LIST, { params });
  return response;
};

// 获取客户端用户详情
export const getClientUserDetail = async (userId: string): Promise<User> => {
  if (USE_MOCK_DATA) {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return Promise.resolve(user);
  }
  const response = await request.get<User>(`${API_PATHS.USER.CLIENT_DETAIL}/${userId}`);
  return response;
};

// 更新客户端用户信息
export const updateClientUser = async (userId: string, data: Partial<User>): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock update user:', userId, data);
    return Promise.resolve();
  }
  await request.put(`${API_PATHS.USER.CLIENT_UPDATE}/${userId}`, data);
};

// 删除客户端用户
export const deleteClientUser = async (userId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock delete user:', userId);
    return Promise.resolve();
  }
  await request.delete(`${API_PATHS.USER.CLIENT_DELETE}/${userId}`);
};

// 获取客户端用户统计
export const getClientUserStatistics = async (): Promise<UserStatistics> => {
  if (USE_MOCK_DATA) {
    return Promise.resolve(mockUserStatistics);
  }
  const response = await request.get<UserStatistics>(API_PATHS.USER.CLIENT_STATISTICS);
  return response;
};

// ==================== 后台管理员管理 ====================

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

// 获取管理员列表
export const getAdminList = async (params: AdminListParams): Promise<AdminListResponse> => {
  if (USE_MOCK_DATA) {
    return mockApi.getAdminList(params);
  }
  const response = await request.get<AdminListResponse>(API_PATHS.USER.ADMIN_LIST, { params });
  return response;
};

// 获取管理员详情
export const getAdminDetail = async (adminId: string): Promise<Admin> => {
  if (USE_MOCK_DATA) {
    const admin = mockAdmins.find(a => a.id === adminId);
    if (!admin) throw new Error('Admin not found');
    return Promise.resolve(admin);
  }
  const response = await request.get<Admin>(`${API_PATHS.USER.ADMIN_DETAIL}/${adminId}`);
  return response;
};

// 创建管理员
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

// 更新管理员
export const updateAdmin = async (adminId: string, data: Partial<CreateAdminParams>): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock update admin:', adminId, data);
    return Promise.resolve();
  }
  await request.put(`${API_PATHS.USER.ADMIN_UPDATE}/${adminId}`, data);
};

// 删除管理员
export const deleteAdmin = async (adminId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock delete admin:', adminId);
    return Promise.resolve();
  }
  await request.delete(`${API_PATHS.USER.ADMIN_DELETE}/${adminId}`);
};

// 重置管理员密码
export const resetAdminPassword = async (adminId: string, newPassword: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock reset password:', adminId, newPassword);
    return Promise.resolve();
  }
  await request.post(`${API_PATHS.USER.ADMIN_RESET_PASSWORD}/${adminId}`, { newPassword });
};

// ==================== 权限管理 ====================

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

// 获取权限列表
export const getPermissionList = async (params?: PermissionListParams): Promise<Permission[]> => {
  if (USE_MOCK_DATA) {
    return mockApi.getPermissionList();
  }
  const response = await request.get<Permission[]>(API_PATHS.USER.PERMISSION_LIST, { params });
  return response;
};

// 获取权限树
export const getPermissionTree = async (): Promise<Permission[]> => {
  if (USE_MOCK_DATA) {
    return mockApi.getPermissionTree();
  }
  const response = await request.get<Permission[]>(API_PATHS.USER.PERMISSION_TREE);
  return response;
};

// 创建权限
export interface CreatePermissionParams {
  name: string;
  code?: string;
  type: 'MENU' | 'BUTTON' | 'API';
  module: string;
  parentId?: string;
}

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

// 更新权限
export const updatePermission = async (permissionId: string, data: Partial<CreatePermissionParams>): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock update permission:', permissionId, data);
    return Promise.resolve();
  }
  await request.put(`${API_PATHS.USER.PERMISSION_UPDATE}/${permissionId}`, data);
};

// 删除权限
export const deletePermission = async (permissionId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock delete permission:', permissionId);
    return Promise.resolve();
  }
  await request.delete(`${API_PATHS.USER.PERMISSION_DELETE}/${permissionId}`);
};

// ==================== 身份（角色）管理 ====================

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

// 获取身份列表
export const getIdentityList = async (params: IdentityListParams): Promise<IdentityListResponse> => {
  if (USE_MOCK_DATA) {
    return mockApi.getIdentityList(params);
  }
  const response = await request.get<IdentityListResponse>(API_PATHS.USER.IDENTITY_LIST, { params });
  return response;
};

// 获取身份详情
export const getIdentityDetail = async (identityId: string): Promise<Identity> => {
  if (USE_MOCK_DATA) {
    const identity = mockIdentities.find(i => i.id === identityId);
    if (!identity) throw new Error('Identity not found');
    return Promise.resolve(identity);
  }
  const response = await request.get<Identity>(`${API_PATHS.USER.IDENTITY_DETAIL}/${identityId}`);
  return response;
};

// 创建身份
export interface CreateIdentityParams {
  name: string;
  code: string;
  description?: string;
  permissionIds?: string[];
}

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

// 更新身份
export const updateIdentity = async (identityId: string, data: Partial<CreateIdentityParams>): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock update identity:', identityId, data);
    return Promise.resolve();
  }
  await request.put(`${API_PATHS.USER.IDENTITY_UPDATE}/${identityId}`, data);
};

// 删除身份
export const deleteIdentity = async (identityId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock delete identity:', identityId);
    return Promise.resolve();
  }
  await request.delete(`${API_PATHS.USER.IDENTITY_DELETE}/${identityId}`);
};

// 为身份分配权限
export const assignPermissionsToIdentity = async (identityId: string, permissionIds: string[]): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock assign permissions:', identityId, permissionIds);
    return Promise.resolve();
  }
  await request.post(API_PATHS.USER.IDENTITY_PERMISSION_ASSIGN, { identityId, permissionIds });
};

// 从身份撤销权限
export const revokePermissionsFromIdentity = async (identityId: string, permissionIds: string[]): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock revoke permissions:', identityId, permissionIds);
    return Promise.resolve();
  }
  await request.post(API_PATHS.USER.IDENTITY_PERMISSION_REVOKE, { identityId, permissionIds });
};

// ==================== 管理员-身份关联 ====================

// 为管理员分配身份
export const assignIdentityToAdmin = async (adminId: string, identityId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock assign identity to admin:', adminId, identityId);
    return Promise.resolve();
  }
  await request.post(API_PATHS.USER.ADMIN_IDENTITY_ASSIGN, { adminId, identityId });
};

// 从管理员撤销身份
export const revokeIdentityFromAdmin = async (adminId: string, identityId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock revoke identity from admin:', adminId, identityId);
    return Promise.resolve();
  }
  await request.post(API_PATHS.USER.ADMIN_IDENTITY_REVOKE, { adminId, identityId });
};

// ==================== 在线管理 ====================

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

// 获取在线用户列表
export const getOnlineList = async (): Promise<OnlineListResponse> => {
  if (USE_MOCK_DATA) {
    return mockApi.getOnlineList();
  }
  const response = await request.get<OnlineListResponse>(API_PATHS.USER.ONLINE_LIST);
  return response;
};

// 强制下线
export const forceLogout = async (sessionId: string, userType: 'USER' | 'ADMIN'): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock force logout:', sessionId, userType);
    return Promise.resolve();
  }
  await request.post(API_PATHS.USER.ONLINE_FORCE_LOGOUT, { sessionId, userType });
};

// ==================== 登录记录 ====================

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

// 获取登录记录
export const getLoginRecords = async (params: LoginRecordParams): Promise<LoginRecordResponse> => {
  if (USE_MOCK_DATA) {
    return mockApi.getLoginRecords(params);
  }
  const response = await request.get<LoginRecordResponse>(API_PATHS.USER.LOGIN_RECORDS, { params });
  return response;
};

// ==================== 商品专区 ====================

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  status: 'ACTIVE' | 'INACTIVE';
}