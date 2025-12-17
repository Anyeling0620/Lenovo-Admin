
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login.tsx";
import Index from "./pages/index.tsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={ <Login />} />
        <Route path="/" element={<MainLayout />}>
        <Route index element={<Index/>}/>

        <Route path="*" element={<div>Not Found</div>} />
        </Route>

      </Routes>
    </>
  );
}


