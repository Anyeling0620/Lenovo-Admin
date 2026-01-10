export const API_PATHS = {
    LOGIN: '/login',
    LOGOUT: '/logout',
    GET_PERMISSIONS: '/permissions',

    // 用户管理相关API
    USER: {
        // 客户端用户管理
        CLIENT_LIST: '/user/client/list',
        CLIENT_DETAIL: '/user/client/detail',
        CLIENT_UPDATE: '/user/client/update',
        CLIENT_DELETE: '/user/client/delete',
        CLIENT_STATISTICS: '/user/client/statistics',
        
        // 后台管理员管理
        ADMIN_LIST: '/user/admin/list',
        ADMIN_DETAIL: '/user/admin/detail',
        ADMIN_CREATE: '/user/admin/create',
        ADMIN_UPDATE: '/user/admin/update',
        ADMIN_DELETE: '/user/admin/delete',
        ADMIN_RESET_PASSWORD: '/user/admin/reset-password',
        
        // 权限管理
        PERMISSION_LIST: '/user/admin/permission/list',
        PERMISSION_TREE: '/user/admin/permission/tree',
        PERMISSION_CREATE: '/user/admin/permission/create',
        PERMISSION_UPDATE: '/user/admin/permission/update',
        PERMISSION_DELETE: '/user/admin/permission/delete',
        
        // 身份（角色）管理
        IDENTITY_LIST: '/user/admin/identity/list',
        IDENTITY_DETAIL: '/user/admin/identity/detail',
        IDENTITY_CREATE: '/user/admin/identity/create',
        IDENTITY_UPDATE: '/user/admin/identity/update',
        IDENTITY_DELETE: '/user/admin/identity/delete',
        
        // 身份-权限关联
        IDENTITY_PERMISSION_ASSIGN: '/user/admin/identity-permission/assign',
        IDENTITY_PERMISSION_REVOKE: '/user/admin/identity-permission/revoke',
        
        // 管理员-身份关联
        ADMIN_IDENTITY_ASSIGN: '/user/admin/admin-identity/assign',
        ADMIN_IDENTITY_REVOKE: '/user/admin/admin-identity/revoke',
        
        // 在线管理
        ONLINE_LIST: '/user/admin/online/list',
        ONLINE_FORCE_LOGOUT: '/user/admin/online/force-logout',
        
        // 登录记录
        LOGIN_RECORDS: '/user/admin/login-records',
    },

    
  




};