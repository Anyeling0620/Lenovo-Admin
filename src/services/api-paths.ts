export const API_PATHS = {
  USER: {
    // Client Users
    CLIENT_DETAIL: '/system/users',

    // Admins
    ADMIN_LIST: '/system/admins',
    ADMIN_DETAIL: '/system/admins',
    ADMIN_CREATE: '/system/admins',
    ADMIN_UPDATE: '/system/admins',
    ADMIN_DELETE: '/system/admins',
    ADMIN_RESET_PASSWORD: '/system/admins/reset-password', // usage: path + '/' + id

    // Permissions
    PERMISSION_LIST: '/system/permissions',
    PERMISSION_TREE: '/system/permissions/tree',
    PERMISSION_CREATE: '/system/permissions',
    PERMISSION_UPDATE: '/system/permissions',
    PERMISSION_DELETE: '/system/permissions',

    // Identities
    IDENTITY_LIST: '/system/identities',
    IDENTITY_DETAIL: '/system/identities',
    IDENTITY_CREATE: '/system/identities',
    IDENTITY_UPDATE: '/system/identities',
    IDENTITY_DELETE: '/system/identities',
    IDENTITY_PERMISSION_ASSIGN: '/system/identities/permissions/assign',
    IDENTITY_PERMISSION_REVOKE: '/system/identities/permissions/revoke',

    // Admin-Identity
    ADMIN_IDENTITY_ASSIGN: '/system/admins/identities/assign',
    ADMIN_IDENTITY_REVOKE: '/system/admins/identities/revoke',

    // Online
    ONLINE_LIST: '/system/online/list',
    ONLINE_FORCE_LOGOUT: '/system/online/logout',

    // Login Records
    LOGIN_RECORDS: '/system/login-records',
  }
};
