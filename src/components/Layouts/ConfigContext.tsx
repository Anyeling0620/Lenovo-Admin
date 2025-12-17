import { createContext } from 'react';

// 定义上下文的类型（包含所有共享的属性和方法）
interface ConfigContextType {
  // 侧边栏折叠状态
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  // 搜索关键词
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  // 页面刷新：触发指定路径的刷新方法（核心）
  triggerRefresh: (path: string) => void;
  // 可选：存储所有路径的刷新key（如果子组件需要读取，可保留；否则可移除）
  refreshKeyMap: Record<string, number>;
}

// 创建上下文并设置默认值（默认值需符合类型定义，方法可设为空函数）
export const configContext = createContext<ConfigContextType>({
  collapsed: false,
  setCollapsed: () => {},
  searchKeyword: '',
  setSearchKeyword: () => {},
  // 刷新方法的默认空实现
  triggerRefresh: () => {},
  // 可选：默认空对象
  refreshKeyMap: {},
});