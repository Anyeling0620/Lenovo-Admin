
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login.tsx";
import Index from "./pages/index.tsx";
import NotFound from "./pages/404.tsx";
import PrivateRoute from "./components/PrivateRoute.tsx";
import NotAuthorized from "./pages/403.tsx";
import DashboardPage from "./pages/Lei/Dashboard";
import WorkbenchPage from "./pages/Lei/Workbench";

// 用户管理相关页面
import ClientUserManagement from "./pages/user/client/index.tsx";
import AdminListPage from "./pages/user/admin/list.tsx";
import PermissionManagement from "./pages/user/permission/index.tsx";
import OnlineManagement from "./pages/user/online/index.tsx";
import CouponManage from "./pages/coupon/copilot/CouponManage.tsx";
import CouponCreate from "./pages/coupon/copilot/CouponCreate.tsx";
import VoucherManage from "./pages/coupon/copilot/VoucherManage.tsx";
import VoucherCreate from "./pages/coupon/copilot/VoucherCreate.tsx";
import Seckill from "./pages/marketing/Seckill.tsx";

// 账号管理相关页面
import AccountInfo from "./pages/account/info.tsx";
import AccountPermission from "./pages/account/permission.tsx";
import AccountSecurity from "./pages/account/security.tsx";
import AccountEdit from "./pages/account/edit.tsx";
import ChangePassword from "./pages/account/change-password.tsx";

// 售货管理相关页面
import OrderManagement from "./pages/sell/order/index.tsx";
import OrderDetail from "./pages/sell/order/detail.tsx";
import OrderShip from "./pages/sell/order/ship.tsx";
import AfterSaleManagement from "./pages/sell/afterSale/index.tsx";
import AfterSaleHandle from "./pages/sell/afterSale/handle.tsx";
import ComplaintManagement from "./pages/sell/complaint/index.tsx";
import ComplaintHandle from "./pages/sell/complaint/handle.tsx";
import useAuthLifecycle from "./hooks/useAuth";




export default function App() {
  useAuthLifecycle();
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/not-permission" element={<NotAuthorized />} />
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Index />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workbench" element={<WorkbenchPage />} />
          <Route path="*" element={<NotFound />} />
          
          {/* 用户管理路由 */}
          <Route path="/user/client" element={<ClientUserManagement />} />
          <Route path="/user/admin/list" element={<AdminListPage />} />
          <Route path="/user/admin/permission" element={<PermissionManagement />} />
          <Route path="/user/admin/online" element={<OnlineManagement />} />

          {/* 账号管理路由 */}
          <Route path="/account/info" element={<AccountInfo />} />
          <Route path="/account/permission" element={<AccountPermission />} />
          <Route path="/account/security" element={<AccountSecurity />} />
          <Route path="/account/edit" element={<AccountEdit />} />
          <Route path="/account/change-password" element={<ChangePassword />} />

          {/* 售货管理路由 */}
          <Route path="/order/manage" element={<OrderManagement />} />
          <Route path="/order/detail/:orderId" element={<OrderDetail />} />
          <Route path="/order/ship/:orderId" element={<OrderShip />} />
          <Route path="/after-sale" element={<AfterSaleManagement />} />
          <Route path="/after-sale/handle/:afterSaleId" element={<AfterSaleHandle />} />
          <Route path="/complaint" element={<ComplaintManagement />} />
          <Route path="/complaint/handle/:complaintId" element={<ComplaintHandle />} />
          {/* 营销管理 - 福利中心 */}
          <Route path="/coupon/manage" element={<CouponManage />} />
          <Route path="/coupon/manage/create" element={<CouponCreate />} />
          <Route path="/coupon/cash" element={<VoucherManage />} />
          <Route path="/coupon/cash/create" element={<VoucherCreate />} />
          <Route path="/marketing/seckill" element={<Seckill />} />

          {/* 其他路由可以在这里继续添加 */}

        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}


