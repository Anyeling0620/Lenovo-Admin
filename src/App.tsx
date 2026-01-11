import { Routes, Route ,Navigate} from "react-router-dom";

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




// 商品管理相关页面
import GoodsOverview from "./pages/goods/overview/overview.tsx";
import ProductListPage from './pages/goods/Productmanage/ProductListPage.tsx';
import ProductFormPage from './pages/goods/Productmanage/ProductFormPage.tsx';
import ProductSkuPage from './pages/goods/Productmanage/ProductSkuPage.tsx';
import ProductGalleryPage from './pages/goods/Productmanage/ProductGalleryPage.tsx';
import BrandZoneHome from './pages/goods/brand-zone/BrandZoneHome.tsx';
import ZoneListPage from "./pages/goods/brand-zone/zone/ZoneListPage.tsx";
import BrandListPage from './pages/goods/brand-zone/brand/brand.tsx';
import BrandFormPage from './pages/goods/brand-zone/brand/brandForm.tsx';
import StockCreatePage from "./pages/goods/stock/StockCreatePage.tsx";
import StockListPage from "./pages/goods/stock/StockListPage.tsx";
import StockEditPage from "./pages/goods/stock/StockEditPage.tsx";
import ZoneFormPage from "./pages/goods/brand-zone/zone/ZoneFormPage.tsx";
import ConfigListPage from "./pages/goods/Productmanage/configs.tsx";
import AnalyticsPage from "./pages/goods/overview/analytics.tsx";
import ProductDetailPage from "./pages/goods/Productmanage/ProductDetailPages.tsx";
import TagFormPage from "./pages/goods/Productmanage/tag/TagFormPage.tsx";
import TagListPage from "./pages/goods/Productmanage/tag/TagListPage.tsx";

//import ShelfListPage from './pages/goods/shelf/ShelfListPage';





export default function App() {
  useAuthLifecycle();
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/not-permission" element={<NotAuthorized />} />
        <Route path="/" element={<PrivateRoute> <MainLayout /> </PrivateRoute>}>
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

          {/* 商品管理路由 */}
          <Route path="/goods/overview" element={<GoodsOverview />} />
          <Route path="/goods/manage" element={<Navigate to="/goods/manage/list" replace />} />
          <Route path="/goods/manage/list" element={<ProductListPage />} />
          <Route path="/goods/manage/create" element={<ProductFormPage />} />
          <Route path="/goods/detail/:id" element={<ProductDetailPage />} />
          <Route path="/goods/manage/edit/:id" element={<ProductFormPage />} />
          <Route path="/goods/manage/sku/:id" element={<ProductSkuPage />} />
          <Route path="/goods/manage/gallery/:id" element={<ProductGalleryPage />} />
          <Route path="/goods/brand-zone" element={<BrandZoneHome />} />
          <Route path="/goods/zone" element={<ZoneListPage />} />
          <Route path="/goods/zone/create" element={<ZoneFormPage />} />
          <Route path="/goods/zone/edit/:id" element={<ZoneFormPage />} />
          <Route path="/goods/brand" element={<BrandListPage />} />
          <Route path="/goods/brand/create" element={<BrandFormPage />} />
          <Route path="/goods/brand/edit/:id" element={<BrandFormPage />} />
          <Route path="/goods/stock" element={<StockListPage />} />
          <Route path="/goods/stock/edit/:stockId" element={<StockEditPage />} />
          <Route path="/goods/stock/create" element={<StockCreatePage />} />
          {/* <Route path="/goods/tags" element={<TagListPage />} /> */}
          <Route path="/goods/configs" element={<ConfigListPage />} />
          {/* <Route path="/goods/shelf" element={<ShelfListPage />} />
          <Route path="/goods/shelf/detail/:shelfId" element={<ShelfListPage />} /> */}
          <Route path="/goods/analytics" element={<AnalyticsPage />} />
          <Route path="/goods/analytics/sales" element={<AnalyticsPage />} />
          <Route path="/goods/tag" element={<TagListPage />} />
          <Route path="/goods/tag/create" element={<TagFormPage />} />
          <Route path="/goods/tag/edit/:id" element={<TagFormPage />} />

          
          
      
          
          {/* 其他路由可以在这里继续添加 */}

        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}


