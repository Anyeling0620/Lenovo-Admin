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



export enum AdminRole {
  /** 超级管理员（最高权限） */
  SUPER_ADMIN = "SUPER_ADMIN",
  /** 系统管理员（系统配置管理） */
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  /** 产品经理（商品/品类管理） */
  PRODUCT_MANAGER = "PRODUCT_MANAGER",
  /** 订单管理员（订单处理/管理） */
  ORDER_MANAGER = "ORDER_MANAGER",
  /** 客服人员（客户咨询/回复） */
  CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
  /** 售后人员（售后处理/维权） */
  AFTER_SALES = "AFTER_SALES",
  /** 财务人员（财务结算/对账） */
  FINANCE = "FINANCE",
  /** 仓库管理员（库存/发货管理） */
  WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER",
  /** 营销人员（营销活动/推广） */
  MARKETING = "MARKETING",
}

export enum CSTEGORY {
  /** 笔记本电脑 */
  LAPTOP = "LAPTOP",
  /** 台式电脑 */
  DESKTOP = "DESKTOP",
  /** 显示器 */
  MONITOR = "MONITOR",
  /** 平板电脑 */
  TABLET = "TABLET",
  /** 手机 */
  PHONE = "PHONE",
  /** 服务类（如售后、技术支持等） */
  SERVICE = "SERVICE",
}