import request from "../utils/request";
import {
  bindAdminIdentity,
  getIdentitiesWithPermissions,
  getOnlineAdmins,
  getPermissionMenu,
  unbindAdminIdentity,
} from "./api";

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

/**
 * 客户端用户统计数据接口
 */
export interface ClientUserStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  vipUsers: number;
  svipUsers: number;
  averageOrderValue: number;
}

/**
 * 获取客户端用户统计数据
 * @returns 统计数据
 */
export const getClientUserStatistics = async (): Promise<ClientUserStatistics> => {
  const response = await request.get<ClientUserStatistics>(`/clients/statistics`);
  return response;
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
  // 后端 /system/admins 返回的是 AdminListItem[] 数组，不是分页结构
  // 需要手动处理分页逻辑
  type BackendAdminListItem = {
    admin_id: string;
    account: string;
    name: string;
    nickname?: string | null;
    email?: string | null;
    status: string;
    identities?: Array<{
      admin_identity_id: string;
      identity_id: string;
      identity_name: string;
      identity_code: string;
      status: string;
      expire_time?: string | null;
    }>;
    categories?: Array<{
      admin_product_category_id: string;
      category_id: string;
      category_name: string;
      category_code: string;
      status: string;
    }>;
  };
  
  // ⚠️ 定制修复（仅影响“用户列表”模块）：
  // 后端(lenovo-shop-server)真实路由为 GET /admin/system/admins
  // 旧 API_PATHS.USER.ADMIN_LIST = '/user/admin/list' 会被 request.ts 补成 '/admin/user/admin/list'，从而 404。
  const backendList = await request.get<BackendAdminListItem[]>('/system/admins');
  
  // 状态映射：后端中文 -> 前端英文
  const mapStatus = (status: string): 'ACTIVE' | 'INACTIVE' | 'BANNED' => {
    if (status === '启用') return 'ACTIVE';
    if (status === '禁用') return 'INACTIVE';
    return 'INACTIVE'; // 默认为停用
  };
  
  // 转换为前端格式
  let list: Admin[] = backendList.map(item => ({
    id: item.admin_id,
    account: item.account,
    name: item.name,
    email: item.email || undefined,
    avatar: undefined,
    nickname: item.nickname || undefined,
    status: mapStatus(item.status),
    createdAt: '', // 后端未返回创建时间，留空
    lastLoginTime: undefined,
    creatorId: undefined,
    creatorName: undefined,
    identities: (item.identities || []).map(i => ({
      id: i.identity_id,
      name: i.identity_name,
      code: i.identity_code,
      description: undefined,
      isSystem: false,
      status: i.status === '启用' ? 'ACTIVE' : 'INACTIVE',
      createdAt: '',
      permissions: []
    })),
    productCategories: (item.categories || []).map(c => ({
      id: c.category_id,
      name: c.category_name,
      code: c.category_code,
      parentId: undefined,
      status: c.status === '启用' ? 'ACTIVE' : 'INACTIVE'
    }))
  }));
  
  // 前端手动实现筛选逻辑
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    list = list.filter(admin => 
      admin.account.toLowerCase().includes(keyword) ||
      admin.name.toLowerCase().includes(keyword) ||
      (admin.email && admin.email.toLowerCase().includes(keyword))
    );
  }
  
  if (params.status) {
    list = list.filter(admin => admin.status === params.status);
  }
  
  if (params.identityId) {
    list = list.filter(admin => 
      admin.identities.some(identity => identity.id === params.identityId)
    );
  }
  
  // 前端手动实现分页逻辑
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const total = list.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedList = list.slice(startIndex, endIndex);
  
  return {
    list: paginatedList,
    total,
    page,
    pageSize
  };
};

/**
 * 获取管理员详情
 * @param adminId 管理员ID
 * @returns 管理员详情数据
 */
export const getAdminDetail = async (adminId: string): Promise<Admin> => {
  // 后端真实路由：GET /admin/system/admins/:admin_id
  const response = await request.get<Admin>(`/system/admins/${adminId}`);
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
  // 后端期望 snake_case 参数名
  const backendParams = {
    account: data.account,
    password: data.password,
    name: data.name,
    email: data.email,
    avatar: data.avatar,
    nickname: data.nickname,
    identity_ids: data.identityIds || [],
    category_ids: data.categoryIds || [],
  };
  // 后端真实路由：POST /admin/system/admins
  const response = await request.post<Admin>('/system/admins', backendParams);
  return response;
};

/**
 * 更新管理员信息
 * @param adminId 管理员ID
 * @param data 更新的管理员数据
 * @returns Promise<void>
 */
export const updateAdmin = async (adminId: string, data: Partial<CreateAdminParams>): Promise<void> => {
  // 后端真实路由当前未提供 PUT（admin.routes.ts 没有该接口）
  // 为保持页面可用，先沿用约定的 PATCH 路由（如后端补齐可再对齐）
  await request.patch(`/system/admins/${adminId}`, data);
};

/**
 * 删除管理员
 * @param adminId 管理员ID
 * @returns Promise<void>
 */
export const deleteAdmin = async (adminId: string): Promise<void> => {
  // 后端真实路由当前未提供 DELETE（admin.routes.ts 没有该接口）
  await request.delete(`/system/admins/${adminId}`);
};

/**
 * 重置管理员密码
 * @param adminId 管理员ID
 * @param newPassword 新密码
 * @returns Promise<void>
 */
export const resetAdminPassword = async (adminId: string, newPassword: string): Promise<void> => {
  // 后端期望的字段名是 new_password (蛇形命名)
  await request.post(`/system/admins/${adminId}/reset-password`, { new_password: newPassword });
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
 * 后端返回的权限菜单项接口
 */
interface PermissionMenuItemResponse {
  permission_id: string;
  permission_name: string;
  code?: string;
  type: string;
  module: string;
  parent_id: string | null;
  status?: string;
}

/**
 * 获取权限列表
 * @param params 查询参数，包含类型、模块、状态等
 * @returns 权限列表数据
 */
export const getPermissionList = async (params?: PermissionListParams): Promise<Permission[]> => {
  // 使用后端真实接口 GET /admin/system/permissions
  const menu = await getPermissionMenu();
  
  console.log('🔍 后端返回的原始权限数据:', menu);
  
  // 转换字段名：permission_id -> id, permission_name -> name, parent_id -> parentId
  const permissions: Permission[] = (menu as PermissionMenuItemResponse[]).map((item) => {
    console.log('🔍 映射权限项:', {
      原始type: item.type,
      原始名称: item.permission_name,
      type类型: typeof item.type
    });
    
    return {
      id: item.permission_id,
      name: item.permission_name,
      code: item.code,
      type: item.type as 'MENU' | 'BUTTON' | 'API',
      module: item.module,
      parentId: item.parent_id,
      status: (item.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
      children: []
    };
  });
  
  console.log('🔍 映射后的权限数据:', permissions);
  
  if (!params) return permissions;
  
  // 前端做轻量过滤
  return permissions.filter(p => {
    if (params.type && p.type !== params.type) return false;
    if (params.module && p.module !== params.module) return false;
    if (params.status && p.status !== params.status) return false;
    return true;
  });
};

/**
 * 构建权限树结构
 * @param permissions 扁平的权限列表
 * @returns 树形结构的权限列表
 */
const buildPermissionTree = (permissions: Permission[]): Permission[] => {
  if (!permissions || permissions.length === 0) {
    return [];
  }
  
  const map = new Map<string, Permission>();
  const roots: Permission[] = [];
  
  // 第一遍：创建映射，确保每个权限都有独立的children数组
  permissions.forEach(permission => {
    map.set(permission.id, { 
      ...permission, 
      children: [] 
    });
  });
  
  // 第二遍：建立父子关系
  permissions.forEach(permission => {
    const node = map.get(permission.id);
    if (!node) return;
    
    // 如果有父级ID且父级存在
    if (permission.parentId && permission.parentId.trim() !== '') {
      const parent = map.get(permission.parentId);
      if (parent) {
        // 确保父级有children数组
        if (!parent.children) {
          parent.children = [];
        }
        // 添加到父级的children中
        parent.children.push(node);
      } else {
        // 父级不存在，作为根节点
        console.warn(`权限 "${permission.name}" (${permission.id}) 的父级 ${permission.parentId} 不存在，将作为根节点`);
        roots.push(node);
      }
    } else {
      // 没有父级，是根节点
      roots.push(node);
    }
  });
  
  // 按模块和名称排序根节点
  roots.sort((a, b) => {
    if (a.module !== b.module) {
      return a.module.localeCompare(b.module);
    }
    return a.name.localeCompare(b.name);
  });
  
  // 递归排序子节点
  const sortChildren = (node: Permission) => {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => {
        // 按类型排序：MENU > BUTTON > API
        const typeOrder = { MENU: 0, BUTTON: 1, API: 2 };
        const aOrder = typeOrder[a.type] ?? 3;
        const bOrder = typeOrder[b.type] ?? 3;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(child => sortChildren(child));
    }
  };
  
  roots.forEach(root => sortChildren(root));
  
  return roots;
};

/**
 * 获取权限树结构
 * @returns 权限树结构数据，包含父子关系
 */
export const getPermissionTree = async (): Promise<Permission[]> => {
  // 获取扁平列表
  const flatList = await getPermissionList();
  // 构建树形结构
  return buildPermissionTree(flatList);
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
  // 调用后端新增接口：POST /admin/system/permissions
  // 注意：后端Permission模型没有code字段，所以不要发送code
  const payload: Record<string, unknown> = {
    name: data.name,
    type: data.type,
    module: data.module,
    parentId: data.parentId ?? null,
  };
  
  console.log('创建权限请求数据:', payload);
  const res = await request.post<Record<string, unknown>>('/system/permissions', payload);
  console.log('创建权限响应:', res);
  return res as unknown as Permission;
};

/**
 * 更新权限信息
 * @param permissionId 权限ID
 * @param data 更新的权限数据
 * @returns Promise<void>
 */
export const updatePermission = async (permissionId: string, data: Partial<CreatePermissionParams>): Promise<void> => {
  // 注意：后端Permission模型没有code字段，所以不要发送code
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.type !== undefined) payload.type = data.type;
  if (data.module !== undefined) payload.module = data.module;
  if (data.parentId !== undefined) payload.parentId = data.parentId;
  
  console.log('更新权限请求数据:', { permissionId, payload });
  await request.patch(`/system/permissions/${permissionId}`, payload);
  console.log('更新权限成功');
};

/**
 * 删除权限
 * @param permissionId 权限ID
 * @returns Promise<void>
 */
export const deletePermission = async (permissionId: string): Promise<void> => {
  await request.delete(`/system/permissions/${permissionId}`);
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
  // 后端 /system/identities 返回的是 IdentityWithPermissions[] 数组，不是分页结构
  type BackendIdentity = {
    identity_id: string;
    identity_name: string;
    identity_code: string;
    description?: string | null;
    is_system: boolean;
    status: string;
  };
  
  // ⚠️ 定制修复（仅影响“身份/角色列表”模块）：
  // 后端(lenovo-shop-server)真实路由为 GET /admin/system/identities
  // 使用后端真实接口 GET /admin/system/identities
  const backendList = await request.get<BackendIdentity[]>('/system/identities');
  
  // 转换为前端格式
  let list: Identity[] = backendList.map(item => ({
    id: item.identity_id,
    name: item.identity_name,
    code: item.identity_code,
    description: item.description || undefined,
  // 后端 IdentityWithPermissions 当前不返回 is_system 字段（见 lenovo-shop-server/src/types/admin/api.type.ts）
  // 这里先按非系统角色处理（不影响管理员列表/绑定身份等核心功能）
  isSystem: false,
    status: item.status === '启用' ? 'ACTIVE' : 'INACTIVE',
    createdAt: '', // 后端未返回创建时间
    permissions: []
  }));
  
  // 前端手动实现筛选逻辑
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    list = list.filter(identity => 
      identity.name.toLowerCase().includes(keyword) ||
      identity.code.toLowerCase().includes(keyword)
    );
  }
  
  if (params.status) {
    list = list.filter(identity => identity.status === params.status);
  }
  
  if (params.isSystem !== undefined) {
    list = list.filter(identity => identity.isSystem === params.isSystem);
  }
  
  // 前端手动实现分页逻辑
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const total = list.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedList = list.slice(startIndex, endIndex);
  
  return {
    list: paginatedList,
    total,
    page,
    pageSize
  };
};

/**
 * 获取身份详情
 * @param identityId 身份ID
 * @returns 身份详情数据
 */
export const getIdentityDetail = async (identityId: string): Promise<Identity> => {
  // 使用后端 GET /admin/system/identities 并从中查找详情
  const list = await getIdentitiesWithPermissions();
  const hit = list.find(i => i.identity_id === identityId);
  if (!hit) throw new Error(`Identity not found: ${identityId}`);

  return {
    id: hit.identity_id,
    name: hit.identity_name,
    code: hit.identity_code,
    description: hit.description || undefined,
  // getIdentitiesWithPermissions() 的返回结构中该字段为 snake_case
  isSystem: (hit as unknown as { is_system: boolean }).is_system,
    status: hit.status === '启用' ? 'ACTIVE' : 'INACTIVE',
    createdAt: '',
    permissions: [],
  };
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
  const payload = {
    name: data.name,
    code: data.code,
    description: data.description,
    permission_ids: data.permissionIds || [],
  };
  type TemporaryIdentityResponse = Partial<{
    id: string;
    identity_id: string;
    name: string;
    identity_name: string;
    code: string;
    identity_code: string;
    description: string;
    is_system: boolean;
    status: string;
    createdAt: string;
  }>;
  const resRaw = await request.post<Record<string, unknown>>('/system/identities', payload);
  const res = resRaw as unknown as TemporaryIdentityResponse;
  // 返回最小可用 Identity 结构（后端可能只返回基础字段）
  return {
    id: (res.id || res.identity_id) as string,
    name: (res.name || res.identity_name) as string,
    code: (res.code || res.identity_code) as string,
    description: (res.description as string) || undefined,
    isSystem: !!res.is_system,
    status: res.status === '启用' ? 'ACTIVE' : 'INACTIVE',
    createdAt: (res.createdAt as string) || '',
    permissions: [],
  };
};

/**
 * 更新身份信息
 * @param identityId 身份ID
 * @param data 更新的身份数据
 * @returns Promise<void>
 */
export const updateIdentity = async (identityId: string, data: Partial<CreateIdentityParams>): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.code !== undefined) payload.code = data.code;
  if (data.description !== undefined) payload.description = data.description;
  if (data.permissionIds !== undefined) payload.permission_ids = data.permissionIds;
  await request.patch(`/system/identities/${identityId}`, payload);
};

/**
 * 删除身份
 * @param identityId 身份ID
 * @returns Promise<void>
 */
export const deleteIdentity = async (identityId: string): Promise<void> => {
  await request.delete(`/system/identities/${identityId}`);
};

/**
 * 为身份分配权限
 * @param identityId 身份ID
 * @param permissionIds 权限ID列表
 * @returns Promise<void>
 */
export const assignPermissionsToIdentity = async (identityId: string, permissionIds: string[]): Promise<void> => {
  await request.post(`/system/identities/${identityId}/permissions`, { permissionIds });
};

/**
 * 从身份撤销权限
 * @param identityId 身份ID
 * @param permissionIds 权限ID列表
 * @returns Promise<void>
 */
export const revokePermissionsFromIdentity = async (identityId: string, permissionIds: string[]): Promise<void> => {
  // axios delete with body: pass in config.data
  await request.delete(`/system/identities/${identityId}/permissions`, { data: { permissionIds } });
};

// ==================== 管理员-身份关联 ====================

/**
 * 为管理员分配身份
 * @param adminId 管理员ID
 * @param identityId 身份ID
 * @returns Promise<void>
 */
export const assignIdentityToAdmin = async (adminId: string, identityId: string): Promise<void> => {
  // admin.routes.ts: POST /system/admins/:admin_id/identities
  await bindAdminIdentity(adminId, { identity_id: identityId });
};

/**
 * 从管理员撤销身份
 * @param adminId 管理员ID
 * @param identityId 身份ID
 * @returns Promise<void>
 */
export const revokeIdentityFromAdmin = async (adminId: string, identityId: string): Promise<void> => {
  // admin.routes.ts: DELETE /system/admins/:admin_id/identities/:identity_id
  await unbindAdminIdentity(adminId, identityId);
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
  // admin.routes.ts: GET /system/admins/online
  const admins = await getOnlineAdmins();
  
  // 定义后端返回数据的类型
  interface AdminSessionResponse {
    admin_session_id?: string;
    id: string;
    admin_id: string;
    account: string;
    name: string;
    session_id: string;
    expire_time?: string;
    login_time?: string;
    login_ip?: string;
    device_name?: string;
    device_type?: string;
  }
  
  // 转换后端返回的数据格式
  const adminList: OnlineAdmin[] = (admins as AdminSessionResponse[]).map((item) => ({
    id: item.admin_session_id || item.id,
    adminId: item.admin_id,
    account: item.account,
    name: item.name,
    loginTime: item.login_time || new Date().toISOString(),
    deviceType: item.device_type || 'pc',
    deviceName: item.device_name || '未知设备',
    ipAddress: item.login_ip || '',
    sessionId: item.session_id,
    lastActivityTime: item.expire_time ? new Date(item.expire_time).toISOString() : new Date().toISOString(),
  }));
  
  return {
    users: [],
    admins: adminList,
    totalUsers: 0,
    totalAdmins: adminList.length,
  };
};

/**
 * 强制下线
 * @param sessionId 会话ID
 * @param userType 用户类型
 * @returns Promise<void>
 */
export const forceLogout = async (sessionId: string, userType: 'USER' | 'ADMIN'): Promise<void> => {
  if (userType === 'ADMIN') {
    // admin.routes.ts: POST /system/sessions/:session_id/force-logout
    await request.post(`/system/sessions/${sessionId}/force-logout`);
  } else {
    // 用户强制下线接口（如果后端有的话）
    throw new Error('Backend route not implemented: force logout for users');
  }
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
  if (params.userType === 'ADMIN' || !params.userType) {
    // 定义后端返回数据的类型
    interface AdminLoginRecordResponse {
      id: string;
      adminId: string;
      account: string;
      name: string;
      deviceType: string;
      deviceName: string;
      ipAddress: string;
      loginTime: string;
      logoutTime?: string;
      status: string;
    }
    
    // admin.routes.ts: GET /system/admins/login-records
    const response = await request.get<{
      list: AdminLoginRecordResponse[];
      total: number;
      page: number;
      pageSize: number;
    }>('/system/admins/login-records', { params });
    
    return {
      list: response.list.map((item) => ({
        id: item.id,
        userId: item.adminId,
        account: item.account,
        name: item.name,
        deviceType: item.deviceType,
        deviceName: item.deviceName,
        ipAddress: item.ipAddress,
        userAgent: '',
        loginTime: item.loginTime,
        logoutTime: item.logoutTime,
        status: item.status as 'ONLINE' | 'OFFLINE',
      })),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
    };
  } else {
    // 用户登录记录接口（如果后端有的话）
    throw new Error('Backend route not implemented: login records for users');
  }
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
