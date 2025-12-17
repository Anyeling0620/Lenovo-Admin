// 定义用户角色类型
export type UserRole = 'admin' | 'editor' | 'guest';

// 定义路由权限配置：键为路由路径，值为可访问的角色列表
export const routePermissions: Record<string, UserRole[]> = {
  // 公开路由：所有角色可访问（包括未登录，实际由登录守卫控制）
  '/login': ['admin', 'editor', 'guest'],
  '/not-found': ['admin', 'editor', 'guest'],
  // 需要登录的路由
  '/': ['admin', 'editor'], // 首页：管理员、编辑可访问
  '/dashboard': ['admin', 'editor'], // 数据总览：管理员、编辑可访问
  '/workbench': ['admin', 'editor'], // 工作台：管理员、编辑可访问
  '/goods/*': ['admin', 'editor'], // 商品管理所有子路由：管理员、编辑可访问
  '/coupon/*': ['admin'], // 福利中心所有子路由：仅管理员可访问
  '/broadcast': ['admin'], // 广播通知：仅管理员可访问
  '/bill': ['admin'], // 账单管理：仅管理员可访问
  '/user/*': ['admin'], // 用户管理所有子路由：仅管理员可访问
  '/after-sales': ['admin', 'editor'], // 售后中心：管理员、编辑可访问
  '/customer-service/*': ['admin', 'editor'], // 客服中心：管理员、编辑可访问
  '/account/*': ['admin', 'editor'], // 账号管理：仅当前用户自己（可扩展）
};

/**
 * 检查用户是否有权限访问指定路径
 * @param path 路由路径
 * @param userRole 用户角色
 * @returns 是否有权限
 */
export const hasPermission = (path: string, userRole: UserRole): boolean => {
  // 1. 精确匹配路径
  if (routePermissions[path]) {
    return routePermissions[path].includes(userRole);
  }
  // 2. 模糊匹配通配符路径（如 /goods/overview 匹配 /goods/*）
  const wildcardPath = Object.keys(routePermissions).find(key => {
    return key.endsWith('*') && path.startsWith(key.replace('*', ''));
  });
  if (wildcardPath) {
    return routePermissions[wildcardPath].includes(userRole);
  }
  // 3. 无配置的路径：默认无权限
  return false;
};