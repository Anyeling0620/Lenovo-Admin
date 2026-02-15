import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { routeNameMap } from '../utils/routeConfig';


const getTitleByPathname = (pathname: string): string => {
  // 先精确命中
  if (routeNameMap[pathname]) return routeNameMap[pathname];

  // 再尝试用 react-router 的 matchPath 命中带参数的模式
  for (const pattern of Object.keys(routeNameMap)) {
    if (pattern.includes(':') && matchPath({ path: pattern, end: true }, pathname)) {
      return routeNameMap[pattern];
    }
  }

  return '未知页面';
};

/**
 * 根据当前路由自动更新浏览器标签页标题。
 * - 标题格式：`${当前页}`
 * - 未命中路由时，使用“未知页面”。
 */
export default function useRouteTitle() {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = getTitleByPathname(location.pathname);
    document.title = `${pageTitle}`;
  }, [location.pathname]);
}
