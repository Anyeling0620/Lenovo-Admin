// src/layouts/MainLayout.tsx
import React, { useState} from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import HeaderBar from '../components/Layouts/HeaderBar';
import SideMenu from '../components/Layouts/SideMenu';
import PageTabs from '../components/Layouts/PageTabs';
import { configContext } from '../components/Layouts/ConfigContext';




const { Content } = Layout;

const MainLayout: React.FC = () => {
  // 头组件侧边按钮控制侧边菜单展开收起的状态
  const [collapsed, setCollapsed] = useState(false);

  return (
    <configContext.Provider value={{ collapsed, setCollapsed }}>
      <Layout style={{ minHeight: '100vh' }}>
        <HeaderBar />  {/* 头部组件 */}
        <Layout style={{ paddingTop: "64px" }}>
          <SideMenu />
          <Content style={{ marginLeft: "8px", marginTop: '4px', marginRight: "8px" }}>  {/* 内容区域 */}
            <PageTabs />
            <Outlet />  {/* 渲染子路由组件 */}
          </Content>
        </Layout>
      </Layout>
    </configContext.Provider>
  );
};

export default MainLayout;
