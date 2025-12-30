// 路由路径与标签名称的映射配置
export const routeNameMap: Record<string, string> = {
  '/': '首页',
  '/dashboard': '数据总览',
  '/workbench': '工作台',
  '/goods/overview': '商品总览',
  '/goods/brand': '品牌管理',
  '/goods/zone': '专区管理',
  '/goods/manage': '商品管理',
  '/goods/home': '首页管理',
  '/goods/new': '新品专区',
  '/goods/seckill': '商品秒杀专场',
  '/coupon/manage': '优惠券管理',
  '/coupon/manage/create': '新建优惠券',
  '/coupon/cash': '代金券管理',
  '/broadcast': '广播通知',
  '/bill': '账单管理',
  '/user/client': '客户端用户管理',
  '/user/admin/list': '用户列表',
  '/user/admin/permission': '权限管理',
  '/user/admin/online': '在线管理',
  '/after-sales': '售后管理',
  '/customer-service/overview': '服务总览',
  '/customer-service/session': '会话中心',
  '/account/info': '个人信息',
  '/account/permission': '个人权限详情',
  '/account/security': '账号安全',
};

// 获取路由对应的标签名称
export const getRouteName = (path: string): string => {
  return routeNameMap[path] || '未知页面';
};