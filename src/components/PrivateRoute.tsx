import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasPermission } from '../utils/permission';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * 私有路由守卫：未登录时重定向到登录页
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // 1. 判断用户是否登录
  const isLogin = true
  const userRole = 'admin' 

  // 2. 获取当前路由位置（用于登录后跳转回原页面）
  const location = useLocation();

  if (!isLogin) {
    // 未登录：重定向到登录页，并携带原页面的路径（方便登录后返回）
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if(!hasPermission(location.pathname, userRole)){
    return <Navigate to="/not-permission" replace />;
  }

  // 已登录：渲染受保护的组件
  return <>{children}</>;
};

export default PrivateRoute;