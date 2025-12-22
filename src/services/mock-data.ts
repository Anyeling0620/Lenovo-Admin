import type {
  User,
  UserListResponse,
  UserStatistics,
  Admin,
  AdminListResponse,
  Permission,
  Identity,
  IdentityListResponse,
  OnlineListResponse,
  OnlineUser,
  OnlineAdmin,
  LoginRecord,
  LoginRecordResponse
} from './user';

// 模拟客户端用户数据
export const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: `user_${i + 1}`,
  email: `user${i + 1}@example.com`,
  account: `user${i + 1}`,
  memberType: i < 10 ? 'SVIP' : i < 30 ? 'VIP' : 'NORMAL',
  gender: i % 3 === 0 ? 'MALE' : i % 3 === 1 ? 'FEMALE' : 'UNKNOWN',
  birthday: i % 2 === 0 ? `199${i % 10}-0${(i % 12) + 1}-${(i % 28) + 1}` : undefined,
  avatar: i % 3 === 0 ? `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${i % 50}.jpg` : undefined,
  nickname: i % 2 === 0 ? `用户${i + 1}` : undefined,
  createdAt: `2024-0${(i % 9) + 1}-${(i % 28) + 1}T${10 + (i % 8)}:${(i % 60).toString().padStart(2, '0')}:00Z`,
  updatedAt: `2024-0${(i % 9) + 1}-${(i % 28) + 1}T${10 + (i % 8)}:${(i % 60).toString().padStart(2, '0')}:00Z`,
  lastLoginTime: i % 3 === 0 ? `2024-12-${(i % 20) + 1}T${10 + (i % 8)}:${(i % 60).toString().padStart(2, '0')}:00Z` : undefined,
  status: i % 10 === 0 ? 'BANNED' : i % 5 === 0 ? 'INACTIVE' : 'ACTIVE',
  orderCount: Math.floor(Math.random() * 100),
  totalSpent: Math.floor(Math.random() * 10000) + 100,
}));

// 模拟管理员数据
export const mockAdmins: Admin[] = Array.from({ length: 20 }, (_, i) => ({
  id: `admin_${i + 1}`,
  account: `admin${i + 1}`,
  name: `管理员${i + 1}`,
  email: i % 2 === 0 ? `admin${i + 1}@lenovo.com` : undefined,
  avatar: i % 3 === 0 ? `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${i % 30}.jpg` : undefined,
  nickname: i % 2 === 0 ? `昵称${i + 1}` : undefined,
  status: i % 10 === 0 ? 'BANNED' : i % 5 === 0 ? 'INACTIVE' : 'ACTIVE',
  createdAt: `2024-0${(i % 9) + 1}-${(i % 28) + 1}T${10 + (i % 8)}:${(i % 60).toString().padStart(2, '0')}:00Z`,
  lastLoginTime: i % 3 === 0 ? `2024-12-${(i % 20) + 1}T${10 + (i % 8)}:${(i % 60).toString().padStart(2, '0')}:00Z` : undefined,
  creatorId: i > 0 ? 'admin_1' : undefined,
  creatorName: i > 0 ? '超级管理员' : undefined,
  identities: [
    { id: 'identity_1', name: '超级管理员', code: 'SUPER_ADMIN', isSystem: true, status: 'ACTIVE' },
    { id: 'identity_2', name: '商品管理员', code: 'PRODUCT_MANAGER', isSystem: true, status: 'ACTIVE' },
  ].slice(0, i % 3 + 1),
  productCategories: [
    { id: 'category_1', name: '笔记本电脑', code: 'LAPTOP', status: 'ACTIVE' },
    { id: 'category_2', name: '台式电脑', code: 'DESKTOP', status: 'ACTIVE' },
  ].slice(0, i % 2 + 1),
}));

// 模拟权限数据
export const mockPermissions: Permission[] = [
  {
    id: 'perm_1',
    name: '系统管理',
    code: 'SYSTEM_MANAGE',
    type: 'MENU',
    module: 'system',
    parentId: null,
    status: 'ACTIVE',
    children: [
      { id: 'perm_2', name: '用户管理', code: 'USER_MANAGE', type: 'MENU', module: 'system', parentId: 'perm_1', status: 'ACTIVE' },
      { id: 'perm_3', name: '角色管理', code: 'ROLE_MANAGE', type: 'MENU', module: 'system', parentId: 'perm_1', status: 'ACTIVE' },
      { id: 'perm_4', name: '权限管理', code: 'PERMISSION_MANAGE', type: 'MENU', module: 'system', parentId: 'perm_1', status: 'ACTIVE' },
    ],
  },
  {
    id: 'perm_5',
    name: '商品管理',
    code: 'PRODUCT_MANAGE',
    type: 'MENU',
    module: 'product',
    parentId: null,
    status: 'ACTIVE',
    children: [
      { id: 'perm_6', name: '商品列表', code: 'PRODUCT_LIST', type: 'MENU', module: 'product', parentId: 'perm_5', status: 'ACTIVE' },
      { id: 'perm_7', name: '商品添加', code: 'PRODUCT_ADD', type: 'BUTTON', module: 'product', parentId: 'perm_5', status: 'ACTIVE' },
      { id: 'perm_8', name: '商品编辑', code: 'PRODUCT_EDIT', type: 'BUTTON', module: 'product', parentId: 'perm_5', status: 'ACTIVE' },
    ],
  },
  {
    id: 'perm_9',
    name: '订单管理',
    code: 'ORDER_MANAGE',
    type: 'MENU',
    module: 'order',
    parentId: null,
    status: 'ACTIVE',
    children: [
      { id: 'perm_10', name: '订单列表', code: 'ORDER_LIST', type: 'MENU', module: 'order', parentId: 'perm_9', status: 'ACTIVE' },
      { id: 'perm_11', name: '订单详情', code: 'ORDER_DETAIL', type: 'API', module: 'order', parentId: 'perm_9', status: 'ACTIVE' },
    ],
  },
];

// 模拟身份数据
export const mockIdentities: Identity[] = [
  {
    id: 'identity_1',
    name: '超级管理员',
    code: 'SUPER_ADMIN',
    description: '拥有系统所有权限',
    isSystem: true,
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    creatorId: 'system',
    creatorName: '系统',
    permissions: mockPermissions.slice(0, 3),
  },
  {
    id: 'identity_2',
    name: '商品管理员',
    code: 'PRODUCT_MANAGER',
    description: '负责商品管理相关权限',
    isSystem: true,
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    creatorId: 'admin_1',
    creatorName: '超级管理员',
    permissions: mockPermissions.filter(p => p.module === 'product'),
  },
  {
    id: 'identity_3',
    name: '订单管理员',
    code: 'ORDER_MANAGER',
    description: '负责订单管理相关权限',
    isSystem: false,
    status: 'ACTIVE',
    createdAt: '2024-02-01T00:00:00Z',
    creatorId: 'admin_1',
    creatorName: '超级管理员',
    permissions: mockPermissions.filter(p => p.module === 'order'),
  },
];

// 模拟在线用户数据
export const mockOnlineUsers: OnlineUser[] = Array.from({ length: 15 }, (_, i) => ({
  id: `online_user_${i + 1}`,
  userId: `user_${i + 1}`,
  account: `user${i + 1}`,
  name: `用户${i + 1}`,
  loginTime: `2024-12-21T${10 + (i % 8)}:${(i % 60).toString().padStart(2, '0')}:00Z`,
  deviceType: i % 3 === 0 ? 'mobile' : 'pc',
  deviceName: i % 3 === 0 ? 'iPhone 15 Pro' : 'Windows 11 Chrome',
  ipAddress: `192.168.1.${i + 100}`,
  sessionId: `session_user_${i + 1}`,
  lastActivityTime: `2024-12-21T${10 + (i % 8)}:${((i + 5) % 60).toString().padStart(2, '0')}:00Z`,
}));

// 模拟在线管理员数据
export const mockOnlineAdmins: OnlineAdmin[] = Array.from({ length: 5 }, (_, i) => ({
  id: `online_admin_${i + 1}`,
  adminId: `admin_${i + 1}`,
  account: `admin${i + 1}`,
  name: `管理员${i + 1}`,
  loginTime: `2024-12-21T${9 + (i % 8)}:${(i % 60).toString().padStart(2, '0')}:00Z`,
  deviceType: i % 2 === 0 ? 'pc' : 'mobile',
  deviceName: i % 2 === 0 ? 'MacBook Pro' : 'Android Chrome',
  ipAddress: `10.0.0.${i + 10}`,
  sessionId: `session_admin_${i + 1}`,
  lastActivityTime: `2024-12-21T${9 + (i % 8)}:${((i + 10) % 60).toString().padStart(2, '0')}:00Z`,
}));

// 模拟登录记录数据
export const mockLoginRecords: LoginRecord[] = Array.from({ length: 100 }, (_, i) => ({
  id: `login_record_${i + 1}`,
  userId: i % 5 === 0 ? `admin_${(i % 5) + 1}` : `user_${i + 1}`,
  account: i % 5 === 0 ? `admin${(i % 5) + 1}` : `user${i + 1}`,
  name: i % 5 === 0 ? `管理员${(i % 5) + 1}` : `用户${i + 1}`,
  deviceType: i % 3 === 0 ? 'mobile' : 'pc',
  deviceName: i % 3 === 0 ? 'iPhone' : 'Windows PC',
  ipAddress: i % 5 === 0 ? `10.0.0.${i % 100}` : `192.168.1.${i % 100}`,
  userAgent: i % 2 === 0 ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  loginTime: `2024-12-${(i % 20) + 1}T${(i % 24).toString().padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}:00Z`,
  logoutTime: i % 3 === 0 ? `2024-12-${(i % 20) + 1}T${((i + 1) % 24).toString().padStart(2, '0')}:${((i + 30) % 60).toString().padStart(2, '0')}:00Z` : undefined,
  status: i % 3 === 0 ? 'OFFLINE' : 'ONLINE',
}));

// 模拟用户统计
export const mockUserStatistics: UserStatistics = {
  totalUsers: 1568,
  activeUsers: 1243,
  newUsersToday: 42,
  vipUsers: 356,
  svipUsers: 89,
  averageOrderValue: 2456.78,
};

// 模拟API响应函数
export const mockApi = {
  // 客户端用户列表
  getClientUsers: (params: any): Promise<UserListResponse> => {
    const { page = 1, pageSize = 10, keyword, memberType, status } = params;
    
    let filtered = [...mockUsers];
    
    if (keyword) {
      filtered = filtered.filter(u => 
        u.account.includes(keyword) || 
        u.nickname?.includes(keyword) || 
        u.email.includes(keyword)
      );
    }
    
    if (memberType) {
      filtered = filtered.filter(u => u.memberType === memberType);
    }
    
    if (status) {
      filtered = filtered.filter(u => u.status === status);
    }
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filtered.slice(start, end);
    
    return Promise.resolve({
      list: paginated,
      total: filtered.length,
      page,
      pageSize,
    });
  },
  
  // 客户端用户统计
  getClientUserStatistics: (): Promise<UserStatistics> => {
    return Promise.resolve(mockUserStatistics);
  },
  
  // 管理员列表
  getAdminList: (params: any): Promise<AdminListResponse> => {
    const { page = 1, pageSize = 10, keyword, status } = params;
    
    let filtered = [...mockAdmins];
    
    if (keyword) {
      filtered = filtered.filter(a => 
        a.account.includes(keyword) || 
        a.name.includes(keyword) || 
        a.email?.includes(keyword)
      );
    }
    
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filtered.slice(start, end);
    
    return Promise.resolve({
      list: paginated,
      total: filtered.length,
      page,
      pageSize,
    });
  },
  
  // 权限列表
  getPermissionList: (): Promise<Permission[]> => {
    // 扁平化权限树
    const flattenPermissions = (permissions: Permission[]): Permission[] => {
      let result: Permission[] = [];
      permissions.forEach(perm => {
        result.push({ ...perm, children: undefined });
        if (perm.children) {
          result = result.concat(flattenPermissions(perm.children));
        }
      });
      return result;
    };
    
    return Promise.resolve(flattenPermissions(mockPermissions));
  },
  
  // 权限树
  getPermissionTree: (): Promise<Permission[]> => {
    return Promise.resolve(mockPermissions);
  },
  
  // 身份列表
  getIdentityList: (params: any): Promise<IdentityListResponse> => {
    const { page = 1, pageSize = 10, keyword } = params;
    
    let filtered = [...mockIdentities];
    
    if (keyword) {
      filtered = filtered.filter(i => 
        i.name.includes(keyword) || 
        i.code.includes(keyword) ||
        i.description?.includes(keyword)
      );
    }
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filtered.slice(start, end);
    
    return Promise.resolve({
      list: paginated,
      total: filtered.length,
      page,
      pageSize,
    });
  },
  
  // 在线列表
  getOnlineList: (): Promise<OnlineListResponse> => {
    return Promise.resolve({
      users: mockOnlineUsers,
      admins: mockOnlineAdmins,
      totalUsers: mockOnlineUsers.length,
      totalAdmins: mockOnlineAdmins.length,
    });
  },
  
  // 登录记录
  getLoginRecords: (params: any): Promise<LoginRecordResponse> => {
    const { page = 1, pageSize = 10, account, deviceType } = params;
    
    let filtered = [...mockLoginRecords];
    
    if (account) {
      filtered = filtered.filter(r => r.account.includes(account));
    }
    
    if (deviceType) {
      filtered = filtered.filter(r => r.deviceType === deviceType);
    }
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filtered.slice(start, end);
    
    return Promise.resolve({
      list: paginated,
      total: filtered.length,
      page,
      pageSize,
    });
  },

};