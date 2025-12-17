import { createContext } from 'react';

// 定义上下文类型和默认值
export const configContext = createContext<{
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}>({
  collapsed: false,
  setCollapsed: () => {},
});