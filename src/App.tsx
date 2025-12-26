
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login.tsx";
import Index from "./pages/index.tsx";
import NotFound from "./pages/404.tsx";
import PrivateRoute from "./components/PrivateRoute.tsx";
import NotAuthorized from "./pages/403.tsx";

// 用户管理相关页面
import ClientUserManagement from "./pages/user/client/index.tsx";
import AdminListPage from "./pages/user/admin/list.tsx";
import PermissionManagement from "./pages/user/permission/index.tsx";
import OnlineManagement from "./pages/user/online/index.tsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/not-permission" element={<NotAuthorized />} />
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Index />} />
          <Route path="*" element={<NotFound />} />
          
          {/* 用户管理路由 */}
          <Route path="/user/client" element={<PrivateRoute><ClientUserManagement /></PrivateRoute>} />
          <Route path="/user/admin/list" element={<PrivateRoute><AdminListPage /></PrivateRoute>} />
          <Route path="/user/admin/permission" element={<PrivateRoute><PermissionManagement /></PrivateRoute>} />
          <Route path="/user/admin/online" element={<PrivateRoute><OnlineManagement /></PrivateRoute>} />

          {/* 其他路由可以在这里继续添加 */}

        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}


