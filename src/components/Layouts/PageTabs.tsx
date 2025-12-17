import React, { useState, useEffect, useCallback } from 'react';
import { Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  CloseOutlined,
  CloseCircleOutlined,
  EllipsisOutlined,
  MenuOutlined, // 拖拽图标（可选）
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { getRouteName, routeNameMap } from '../../utils/routeConfig';

// 定义标签项类型
interface TabItem {
  key: string; // 路由路径
  label: string; // 标签名称
}

// 定义下拉菜单的选项类型
type MenuItemType = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

const PageTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // 标签列表状态（初始化包含默认页面，如数据总览）
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: '/', label: getRouteName('/') },
  ]);
  // 当前激活的标签key
  const [activeKey, setActiveKey] = useState<string>(location.pathname || '/');

  // 优化：使用 useCallback 缓存函数，避免 useEffect 依赖频繁变化
  const handleRouteChange = useCallback((currentPath: string) => {
    // 排除空路径和不存在的路由
    if (!currentPath || !routeNameMap[currentPath]) return;

    // 异步更新：使用 setTimeout 脱离 effect 同步执行阶段，解决警告问题
    setTimeout(() => {
      // 函数式更新：避免依赖外部的 tabs 状态
      setTabs((prevTabs) => {
        const isTabExist = prevTabs.some((tab) => tab.key === currentPath);
        if (!isTabExist) {
          return [...prevTabs, { key: currentPath, label: getRouteName(currentPath) }];
        }
        return prevTabs; // 不存在则返回原数组，不更新
      });

      // 仅当 key 变化时更新激活状态
      setActiveKey((prevKey) => {
        if (prevKey !== currentPath) {
          return currentPath;
        }
        return prevKey;
      });
    }, 0);
  }, []);

  // 监听路由变化，添加新标签
  useEffect(() => {
    const currentPath = location.pathname;
    // 直接调用处理函数（内部已异步处理 setState）
    handleRouteChange(currentPath);

    // 清理函数：避免组件卸载后执行 setTimeout
    return () => { };
  }, [location.pathname, handleRouteChange]);

  // 处理标签切换
  const handleTabChange = (key: string) => {
    if (key !== activeKey) {
      setActiveKey(key);
      navigate(key); // 切换路由
    }
  };

  // 处理单个标签关闭（使用函数式更新）
  const handleTabClose = (key: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发标签切换

    setTabs((prevTabs) => {
      // 不能关闭最后一个标签
      if (prevTabs.length === 1) {
        message.warning('不能关闭最后一个标签页');
        return prevTabs;
      }

      // 过滤掉要关闭的标签
      const newTabs = prevTabs.filter((tab) => tab.key !== key);
      const tabIndex = prevTabs.findIndex((tab) => tab.key === key);

      // 如果关闭的是当前激活的标签，切换到前一个/后一个标签
      if (key === activeKey) {
        const newActiveKey = newTabs[tabIndex >= newTabs.length ? tabIndex - 1 : tabIndex].key;
        // 异步更新激活状态（可选，进一步避免同步更新）
        setTimeout(() => {
          setActiveKey(newActiveKey);
          navigate(newActiveKey);
        }, 0);
      }

      return newTabs;
    });
  };

  // 关闭除当前激活标签外的所有标签
  const closeOtherTabs = () => {
    if (tabs.length <= 1) {
      message.warning('没有可关闭的其他标签页');
      return;
    }
    setTimeout(() => {
      const newTabs = tabs.filter((tab) => tab.key === activeKey);
      setTabs(newTabs);
      navigate(activeKey);
    }, 0);
  };

  // 关闭所有标签（保留第一个默认标签：数据总览）
  const closeAllTabs = () => {
    setTimeout(() => {
      const defaultTab = [{ key: '/', label: getRouteName('/') }];
      setTabs(defaultTab);
      setActiveKey('/');
      navigate('/');
    }, 0);
  };

  // 生成全局下拉菜单的配置项
  const getGlobalMenuItems = (): MenuItemType[] => {
    return [
      {
        key: 'close-other',
        label: '关闭其他标签',
        icon: <CloseOutlined />,
        onClick: closeOtherTabs,
      },
      {
        key: 'close-all',
        label: '关闭所有标签',
        icon: <CloseCircleOutlined />,
        onClick: closeAllTabs,
      },
    ];
  };

  // 处理全局菜单点击事件
  const handleGlobalMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'close-other') {
      closeOtherTabs();
    } else if (key === 'close-all') {
      closeAllTabs();
    }
  };

  // 处理拖拽结束后的逻辑
  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    // 拖拽到无效区域或原地拖拽，不处理
    if (!destination || (destination.index === source.index && destination.droppableId === source.droppableId)) {
      return;
    }

    // 重新排序标签列表
    const newTabs = Array.from(tabs);
    const [removed] = newTabs.splice(source.index, 1);
    newTabs.splice(destination.index, 0, removed);
    setTabs(newTabs);
  };

  // 渲染单个标签（移除未使用的 index 参数）
  const renderTabLabel = (tab: TabItem) => { // 关键修改：删除 index 参数
    return (
      <div className="flex items-center justify-between w-full cursor-pointer">
        {/* 拖拽图标 */}
        <div className="flex items-center">
          <MenuOutlined className="mr-1 text-[10px] text-gray-400 cursor-move select-none" />
          <span>{tab.label}</span>
        </div>
        <CloseOutlined
          className="ml-1 text-[11px] cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
          onClick={(e) => handleTabClose(tab.key, e)}
        />
      </div>
    );
  };

  return (
    <div className=" border-b border-gray-200 text-[12px]">
      <div className="flex items-center justify-between">
        <div className="w-full overflow-hidden">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="tabs-droppable" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex items-center h-full"
                >
                  {tabs.map((tab, index) => (
                    <Draggable
                      key={tab.key}
                      draggableId={tab.key}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            px-3 py-2 border-b ${
                              activeKey === tab.key ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600'
                            } 
                            hover:bg-gray-200 transition-colors ${
                              snapshot.isDragging ? 'bg-gray-300 shadow-sm' : ''
                            }
                            whitespace-nowrap select-none
                          `}
                          onClick={() => handleTabChange(tab.key)}
                        >
                          {renderTabLabel(tab)} {/* 关键修改：删除 index 传参 */}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <div className="ml-2 pr-2">
          <Dropdown
            menu={{
              items: getGlobalMenuItems(),
              onClick: handleGlobalMenuClick,
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <EllipsisOutlined
              className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 transition-colors"
              style={{ fontSize: '14px' }}
            />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default PageTabs;