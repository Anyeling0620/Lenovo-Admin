import React, { useContext, useState } from 'react';
import { Layout, Menu, type MenuProps } from 'antd';
import {
    DashboardOutlined,
    DesktopOutlined,
    ShoppingOutlined,
    FileTextOutlined,
    UserOutlined,
    CustomerServiceOutlined,
    PhoneOutlined,
    SettingOutlined,
    BellOutlined,
    GiftOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { configContext } from './ConfigContext';
import { hasPermission, type UserRole } from '../../utils/permission';

const { Sider } = Layout;

// 定义菜单类型（支持多级）
interface MenuItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    path?: string;
    children?: MenuItem[];
}

// 菜单数据（多级结构）
const _menuItems: MenuItem[] = [
    {
        key: '1',
        label: '数据总览',
        icon: <DashboardOutlined />,
        path: '/dashboard',
    },
    {
        key: '2',
        label: '工作台',
        icon: <DesktopOutlined />,
        path: '/workbench',
    },
    {
        key: '3',
        label: '商品管理',
        icon: <ShoppingOutlined />,
        children: [
            { key: '3-1', label: '商品总览', path: '/goods/overview' },
            { key: '3-2', label: '品牌管理', path: '/goods/brand' },
            { key: '3-3', label: '专区管理', path: '/goods/zone' },
            { key: '3-4', label: '商品管理', path: '/goods/manage' },
            { key: '3-5', label: '首页管理', path: '/goods/home' },
            { key: '3-6', label: '新品专区', path: '/goods/new' },
            { key: '3-7', label: '秒杀专场', path: '/goods/seckill' },
        ],
    },
    {
        key: '4',
        label: '福利中心',
        icon: <GiftOutlined />,
        children: [
            { key: '4-1', label: '优惠券管理', path: '/coupon/manage' },
            { key: '4-2', label: '代金券管理', path: '/coupon/cash' },
        ],
    },
    {
        key: '5',
        label: '广播通知',
        icon: <BellOutlined />,
        path: '/broadcast',
    },
    {
        key: '6',
        label: '账单管理',
        icon: <FileTextOutlined />,
        path: '/bill',
    },
    {
        key: '7',
        label: '用户管理',
        icon: <UserOutlined />,
        children: [
            { key: '7-1', label: '客户端管理', path: '/user/client' },
            {
                key: '7-2',
                label: '后台端管理',
                children: [
                    { key: '7-2-1', label: '用户列表', path: '/user/admin/list' },
                    { key: '7-2-2', label: '权限管理', path: '/user/admin/permission' },
                    { key: '7-2-3', label: '在线管理', path: '/user/admin/online' },
                ],
            },
        ],
    },
    {
        key: '8',
        label: '售后中心',
        icon: <CustomerServiceOutlined />,
        path: '/after-sales',
    },
    {
        key: '9',
        label: '客服中心',
        icon: <PhoneOutlined />,
        children: [
            { key: '7-1', label: '服务总览', path: '/customer-service/overview' },
            { key: '7-2', label: '会话中心', path: '/customer-service/session' },
        ],
    },
    {
        key: '10',
        label: '账号管理',
        icon: <SettingOutlined />,
        children: [
            { key: '10-1', label: '个人信息', path: '/account/info' },
            { key: '10-2', label: '权限详情', path: '/account/permission' },
            { key: '10-3', label: '账号安全', path: '/account/security' },
        ],
    },
];

const filterMenuItems = (items: MenuItem[], userRole: UserRole): MenuItem[] => {
    return items.filter(item => {
    // 1. 有路径的菜单项：检查权限
    if (item.path) {
      const hasPerm = hasPermission(item.path, userRole);
      // 如果有子项，递归过滤子项
      if (hasPerm && item.children) {
        item.children = filterMenuItems(item.children, userRole);
      }
      return hasPerm;
    }
    // 2. 无路径的父菜单项（仅包含子项）：递归过滤子项，若子项为空则隐藏
    if (item.children) {
      item.children = filterMenuItems(item.children, userRole);
      return item.children.length > 0;
    }
    // 3. 无路径无子项的菜单项：默认隐藏
    return false;
  });
};

const SideMenu: React.FC = () => {
    const { collapsed, triggerRefresh } = useContext(configContext);
    // 控制菜单展开的key（受控状态）
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    // 工具函数：获取key的一级父级（顶级）key，如5-2-1 → 5，5-2 → 5，3 → 3
    const getRootKey = (key: string): string => {
        return key.split('-')[0];
    };

    // 工具函数：获取key的所有父级key（包括自身），如5-2-1 → [5, 5-2, 5-2-1]
    const getKeyPath = (key: string): string[] => {
        return key.split('-').map((_, index) => key.split('-').slice(0, index + 1).join('-'));
    };

    // 工具函数：判断key是否是目标key的子级（包括自身）
    const isChildKey = (key: string, parentKey: string): boolean => {
        return key.startsWith(`${parentKey}-`) || key === parentKey;
    };
    const userRole = 'admin'
    const menuItems = filterMenuItems([..._menuItems], userRole);

    // 处理菜单展开/收起事件
    const handleOpenChange = (newOpenKeys: string[]) => {
        // 找到当前操作的key（对比新旧openKeys的差异）
        const addedKeys = newOpenKeys.filter(key => !openKeys.includes(key));
        const removedKeys = openKeys.filter(key => !newOpenKeys.includes(key));
        const operateKey = addedKeys[0] || removedKeys[0];

        if (!operateKey) {
            setOpenKeys([]);
            return;
        }

        // 步骤1：获取当前操作key的根key（一级菜单key）
        const rootKey = getRootKey(operateKey);

        if (addedKeys.length > 0) {
            // 展开操作：
            // 1. 移除所有非当前根key的展开项（同层级互斥）
            // 2. 添加当前操作key的完整路径
            const filteredKeys = openKeys.filter(key => getRootKey(key) === rootKey);
            const keyPath = getKeyPath(operateKey);
            const newKeys = Array.from(new Set([...filteredKeys, ...keyPath]));
            // 按层级排序（保证父级在前）
            newKeys.sort((a, b) => a.split('-').length - b.split('-').length);
            setOpenKeys(newKeys);
        } else {
            // 收起操作：移除当前操作key及其所有子级
            const newKeys = openKeys.filter(key => !isChildKey(key, operateKey));
            setOpenKeys(newKeys);
        }
    };

    // 递归渲染菜单（支持多级）
    const renderMenuItems = (items: MenuItem[]): MenuProps['items'] => {
        return items.map((item) => {
            if (item.children) {
                return {
                    key: item.key,
                    icon: item.icon,
                    label: item.label,
                    children: renderMenuItems(item.children),
                };
            }
            return {
                key: item.key,
                icon: item.icon,
                label: <Link onClick={() => item.path&&triggerRefresh(item.path)} to={`${item.path}` || 'not-found'} className="ml-1">{item.label}</Link>,
            };
        });
    };

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            className="bg-white border-r border-gray-200 pl-1"
            style={{ transition: 'all 0.3s ease' }}
        >
            <Menu
                mode="inline"
                items={renderMenuItems(menuItems)}
                className="border-none pt-2! bg-[#fafafa]!"
                openKeys={openKeys}
                onOpenChange={handleOpenChange}
            />
        </Sider>
    );
};

export default SideMenu;