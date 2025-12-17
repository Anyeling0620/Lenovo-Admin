// src/layouts/MainLayout.tsx
import React, { useState} from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import HeaderBar from '../components/Layouts/HeaderBar';
import SideMenu from '../components/Layouts/SideMenu';
import PageTabs from '../components/Layouts/PageTabs';
import { configContext } from '../components/Layouts/ConfigContext';




const { Content } = Layout;

const MainLayout: React.FC = () => {
  // 头组件侧边按钮控制侧边菜单展开收起的状态
  const [collapsed, setCollapsed] = useState(false);
  // 搜索关键字状态
  const [searchKeyword, setSearchKeyword] = useState('');
  // 页面刷新
  const [refreshKeyMap, setRefreshKeyMap] = useState<Record<string, number>>({});
  const location = useLocation(); // 获取当前路由路径
   // 新增：触发指定页面刷新的方法（接收路由路径）
  const triggerRefresh = (path: string) => {
    setRefreshKeyMap(prev => ({
      ...prev,
      [path]: (prev[path] || 0) + 1, // 对应路径的key自增
    }));
  };

  // 当前页面的刷新key（取对应路径的key，无则为0）
  const currentRefreshKey = refreshKeyMap[location.pathname] || 0;

  return (
    <configContext.Provider value={{ collapsed, setCollapsed, searchKeyword, setSearchKeyword, triggerRefresh, refreshKeyMap }}>
      <Layout style={{ minHeight: '100vh' }}>
        <HeaderBar />  {/* 头部组件 */}
        <Layout style={{ paddingTop: "64px" }}>
          <SideMenu />
          <Content style={{ marginLeft: "8px", marginTop: '4px', marginRight: "8px" }}>  {/* 内容区域 */}
            <PageTabs />
            <Outlet key={currentRefreshKey}/>  {/* 渲染子路由组件 */}
          </Content>
        </Layout>
      </Layout>
    </configContext.Provider>
  );
};

export default MainLayout;
