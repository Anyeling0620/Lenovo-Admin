
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login.tsx";
import Index from "./pages/index.tsx";
import NotFound from "./pages/404.tsx";
import PrivateRoute from "./components/PrivateRoute.tsx";
import NotAuthorized from "./pages/403.tsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/not-permission" element={<NotAuthorized />} />
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Index />} />
          <Route path="*" element={<NotFound />} />
          {/* 请在这里注册路由 */}







        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}


