import React, { useContext, useEffect, useState } from 'react';
import { Layout, Menu, type MenuProps } from 'antd';
import {
    DashboardOutlined,
    DesktopOutlined,
    ShoppingOutlined,
    // FileTextOutlined,
    UserOutlined,
    // CustomerServiceOutlined,
    PhoneOutlined,
    SettingOutlined,
    BellOutlined,
    GiftOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { configContext } from './ConfigContext';
// import { hasPermission, type UserRole } from '../../utils/permission';

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
    // {
    //     key: '2',
    //     label: '工作台',
    //     icon: <DesktopOutlined />,
    //     path: '/workbench',
    // },
    //     {
    //     key: '3',
    //     label: '广播通知',
    //     icon: <BellOutlined />,
    //     path: '/broadcast',
    // },
    {
        key: '4',
        label: '商品管理',
        icon: <ShoppingOutlined />,
        children: [
            { key: '4-1', label: '商品总览', path: '/goods/overview' },
            { key: '4-2', label: '品牌·专区', path: '/goods/brand-zone' },
            { key: '4-3', label: '商品管理', path: '/goods/manage' },
            { key: '4-4', label: '库存管理', path: '/goods/stock' }
        ],
    },
    {
        key: '5',
        label: '商城管理',
        icon: <ShoppingOutlined />,
        children: [
            { key: '5-1', label: '上架商品管理', path: '/mall/ai/shelf-product' },
            // { key: '5-2', label: '售货专区管理', path: '/mall/ai/sales-zone' },
            { key: '5-3', label: '首页展示管理', path: '/mall/ai/home-display' },
            { key: '5-4', label: '新品展示管理', path: '/mall/ai/new-product-display' },
        ]
    },
    {
        key: '6', label: '营销管理', icon: <GiftOutlined />,
        children: [
            {
                key: '6-1', label: '福利中心', children: [
                    { key: '6-1-1', label: '优惠券管理', path: '/coupon/manage' },
                    { key: '6-1-2', label: '代金券管理', path: '/coupon/cash' },
                ]
            },
            {
                key: '6-2', label: '秒杀活动', path: '/marketing/seckill'
            }
        ]
    },
    {
        key: '7',
        label: '售货管理',
        icon: <ShoppingOutlined />,
        children: [
            { key: '7-1', label: '订单管理', path: '/order/manage' },
            { key: '7-2', label: '售后管理', path: '/after-sale' },
            { key: '7-3', label: '投诉管理', path: '/complaint' },

        ]
    },

    {
        key: '8',
        label: '用户管理',
        icon: <UserOutlined />,
        children: [
            { key: '8-1', label: '客户端管理', path: '/user/client' },
            {
                key: '8-2',
                label: '后台管理',
                children: [
                    { key: '8-2-1', label: '用户列表', path: '/user/admin/list' },
                    { key: '8-2-2', label: '权限管理', path: '/user/admin/permission' },
                    { key: '8-2-3', label: '在线管理', path: '/user/admin/online' },
                ],
            },
        ],
    },
    // {
    //     key: '9',
    //     label: '客服中心',
    //     icon: <PhoneOutlined />,
    //     children: [
    //         { key: '9-1', label: '服务总览', path: '/customer-service/overview' },
    //         { key: '9-2', label: '会话中心', path: '/customer-service/session' },
    //         { key: '9-3', label: '评价管理', path: '/customer-service/evaluation' },
    //     ],
    // },
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


// 权限过滤函数：根据用户角色过滤菜单项
// const filterMenuItems = (items: MenuItem[], userRole: UserRole): MenuItem[] => {
//     return items.filter(item => {
//         // 1. 有路径的菜单项：检查权限
//         if (item.path) {
//             const hasPerm = hasPermission(item.path, userRole);
//             // 如果有子项，递归过滤子项
//             if (hasPerm && item.children) {
//                 item.children = filterMenuItems(item.children, userRole);
//             }
//             return hasPerm;
//         }
//         // 2. 无路径的父菜单项（仅包含子项）：递归过滤子项，若子项为空则隐藏
//         if (item.children) {
//             item.children = filterMenuItems(item.children, userRole);
//             return item.children.length > 0;
//         }
//         // 3. 无路径无子项的菜单项：默认隐藏
//         return false;
//     });
// };

const SideMenu: React.FC = () => {
    const { collapsed, triggerRefresh } = useContext(configContext);
    const location = useLocation();
    // 控制菜单展开的key（受控状态）
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    // 工具函数：获取key的一级父级（顶级）key，如5-2-1 → 5，5-2 → 5，3 → 3
    const getRootKey = (key: string): string => {
        return key.split('-')[0];
    };

    // 工具函数：获取key的所有父级key（包括自身），如5-2-1 → [5, 5-2, 5-2-1]
    const getKeyPath = (key: string): string[] => {
        return key.split('-').map((_, index) => key.split('-').slice(0, index + 1).join('-'));
    };

    // 根据当前路由寻找匹配的菜单 key（精确或前缀匹配）
    const findKeyByPath = (items: MenuItem[], targetPath: string): string | null => {
        for (const item of items) {
            if (item.path && (targetPath === item.path || targetPath.startsWith(`${item.path}/`))) {
                return item.key;
            }
            if (item.children) {
                const childKey = findKeyByPath(item.children, targetPath);
                if (childKey) return childKey;
            }
        }
        return null;
    };

    // 工具函数：判断key是否是目标key的子级（包括自身）
    const isChildKey = (key: string, parentKey: string): boolean => {
        return key.startsWith(`${parentKey}-`) || key === parentKey;
    };
    // 暂时不处理权限
    // const userRole = 'admin'
    // const menuItems = filterMenuItems([..._menuItems], userRole);

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

    // 路由变化时同步选中与展开项
    useEffect(() => {
        const matchedKey = findKeyByPath(_menuItems, location.pathname);
        if (matchedKey) {
            setSelectedKeys([matchedKey]);
            setOpenKeys(getKeyPath(matchedKey));
        } else {
            setSelectedKeys([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

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
                label: <Link onClick={() => item.path && triggerRefresh(item.path)} to={`${item.path}` || 'not-found'} className="ml-1">{item.label}</Link>,
            };
        });
    };

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            className="bg-white border-r border-gray-200 pl-1"
            style={{ transition: 'all 0.3s ease', height: 'calc(100vh - 64px)', position: 'sticky', top: 64, overflow: 'auto' }}
        >
            <Menu
                mode="inline"
                items={renderMenuItems(_menuItems)}  // 暂时关闭权限控制
                className="border-none pt-2! bg-[#fafafa]!"
                openKeys={openKeys}
                selectedKeys={selectedKeys}
                onOpenChange={handleOpenChange}
            />
        </Sider>
    );
};

export default SideMenu;
