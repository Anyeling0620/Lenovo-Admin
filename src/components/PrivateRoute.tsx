import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/auth';
// import { hasPermission } from '../utils/permission';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * 私有路由守卫：未登录时重定向到登录页, 无权限时重定向到无权限页
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {

  const isLogin = useAuthStore(state => state.isAuthenticated)
  // const userRole = 'admin' 

  const location = useLocation();

  if (!isLogin) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  // if(!hasPermission(location.pathname, userRole)){
  //   return <Navigate to="/not-permission" replace />;
  // }

  return <>{children}</>;
};

export default PrivateRoute;