// src/components/HeaderBar.tsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { Layout, Button, Typography, Avatar, Dropdown, Input, Badge, Popover, Space, Tag } from 'antd';
import {
    MenuFoldOutlined, // 收起图标
    MenuUnfoldOutlined, // 展开图标
    BellOutlined, // 消息图标
    SearchOutlined, // 搜索图标
    UserOutlined, // 默认用户头像
    LogoutOutlined,
    SettingOutlined, // 退出登录图标
    ShopOutlined, // 订单图标
    UserAddOutlined, // 新用户图标
    WarningOutlined, // 预警图标
    InfoCircleOutlined, // 系统图标
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { MenuItemType } from 'antd/es/menu/interface';
import { configContext } from './ConfigContext';
import { useNavigate } from 'react-router-dom';
import globalErrorHandler from '../../utils/globalAxiosErrorHandler';
import { globalMessage } from '../../utils/globalMessage';
import { adminLogout } from '../../services/api';
import useAdminProfileStore from '../../store/adminInfo';

const { Header } = Layout;
const { Text, Title } = Typography;
const { Search } = Input;

// 定义用户信息类型
// interface UserInfo {
//     name: string;
//     email: string;
//     avatar: string;
// }

// // 通知类型（区分系统通知/用户通知/订单通知等）
// type NotificationType = 'system' | 'order' | 'user' | 'warning';

// // 通知消息类型（包含类型、来源、图标、内容、时间等）
// interface NotificationItem {
//     id: number;
//     type: NotificationType; // 通知类型
//     title: string; // 通知标题（来源/摘要）
//     content: string; // 通知详情
//     time: string; // 通知时间
//     read: boolean; // 是否已读（用于样式区分）
//     sender?: { // 可选：用户通知的发送者（系统通知可无）
//         name: string;
//         avatar: string;
//     };
// }

// 定义用户菜单项的类型（结合 antd Menu 的类型）
type UserMenuItem = MenuItemType;

const HeaderBar: React.FC = () => {
    // 从上下文获取侧边栏折叠状态和修改方法（添加非空断言，或根据实际情况处理 null）
    const { collapsed, setCollapsed, searchKeyword, setSearchKeyword } = useContext(configContext);
    // const navigate = useNavigate();

    // 模拟用户信息
    // const [userInfo] = useState<UserInfo>({
    //     name: '管理员',
    //     email: 'admin@lenovo.com',
    //     avatar: 'https://q.qlogo.cn/headimg_dl?dst_uin=2154072905&spec=100&img_type=jpg', // 示例头像URL
    // });

    const name = useAdminProfileStore((state) => state.profile?.name);
    const email = useAdminProfileStore((state) => state.profile?.email);
    const avatar = useAdminProfileStore((state) => state.profile?.avatar);
    

    // 模拟通知消息列表
    // const [messageList] = useState<NotificationItem[]>([
    //     {
    //         id: 1,
    //         type: 'order',
    //         title: '订单支付通知',
    //         content: '订单编号123456已完成支付，金额：5999元',
    //         time: '2025-12-17 10:00',
    //         read: false,
    //     },
    //     {
    //         id: 2,
    //         type: 'user',
    //         title: '新用户注册',
    //         content: '用户张三（手机号：138****1234）完成注册，已分配会员等级：普通会员',
    //         time: '2025-12-17 09:30',
    //         read: false,
    //         sender: { name: '系统', avatar: 'https://i.pravatar.cc/150?img=0' },
    //     },
    //     {
    //         id: 3,
    //         type: 'warning',
    //         title: '库存预警',
    //         content: '联想拯救者Y9000P库存剩余10台，请及时补货',
    //         time: '2025-12-17 08:00',
    //         read: true,
    //     },
    //     {
    //         id: 4,
    //         type: 'system',
    //         title: '系统维护通知',
    //         content: '平台将于2025-12-18 00:00-02:00进行系统维护，期间可能无法正常访问',
    //         time: '2025-12-17 07:00',
    //         read: true,
    //     },
    //     {
    //         id: 5,
    //         type: 'user',
    //         title: '用户反馈',
    //         content: '用户李四反馈商品物流更新不及时，需尽快处理',
    //         time: '2025-12-17 06:30',
    //         read: false,
    //         sender: { name: '李四', avatar: 'https://i.pravatar.cc/150?img=2' },
    //     },
    // ]);

    // 控制搜索框显示/隐藏的状态
    const [showSearch, setShowSearch] = useState(false);
    const [inputValue, setInputValue] = useState(searchKeyword);
    // 搜索框容器的 ref
    const searchRef = useRef<HTMLDivElement>(null);

    // 切换侧边栏折叠状态
    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    // 退出登录处理函数
    const handleLogout = async () => {
        try {
            window.dispatchEvent(new CustomEvent('logout'));
            await adminLogout();
        } catch (error) {
            globalErrorHandler.handle(error, globalMessage.error);
        }
    };

    // 切换搜索框显示/隐藏
    const toggleSearch = () => {
        setShowSearch(!showSearch);
    };

    // 处理搜索框的搜索事件
    const handleSearch = (value: string) => {
        console.log('搜索内容：', value);
        const trimmedValue = value.trim();
        if (!trimmedValue) return;
        setSearchKeyword(trimmedValue);
        setShowSearch(false);
        setInputValue(''); // 清空搜索框内容
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }

    // 处理点击外部关闭搜索框
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSearch(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // // 辅助函数：根据通知类型返回对应的图标
    // const getNotificationIcon = (type: NotificationType) => {
    //     switch (type) {
    //         case 'order':
    //             return <ShopOutlined className="text-blue-600!" />; // Tailwind 蓝色
    //         case 'user':
    //             return <UserAddOutlined className="text-green-600!" />; // Tailwind 绿色
    //         case 'warning':
    //             return <WarningOutlined className="text-orange-500!" />; // Tailwind 橙色
    //         case 'system':
    //             return <InfoCircleOutlined className="text-purple-600!" />; // Tailwind 紫色
    //         default:
    //             return <InfoCircleOutlined className="text-gray-500!" />; // Tailwind 灰色
    //     }
    // };

    // 辅助函数：根据通知类型返回标签颜色
    // const getNotificationTagColor = (type: NotificationType) => {
    //     switch (type) {
    //         case 'order':
    //             return 'blue';
    //         case 'user':
    //             return 'green';
    //         case 'warning':
    //             return 'orange';
    //         case 'system':
    //             return 'purple';
    //         default:
    //             return 'gray';
    //     }
    // };

    // 辅助函数：根据通知类型返回中文名称
    // const getNotificationTypeName = (type: NotificationType) => {
    //     const typeMap: Record<NotificationType, string> = {
    //         order: '订单',
    //         user: '用户',
    //         warning: '预警',
    //         system: '系统',
    //     };
    //     return typeMap[type];
    // };

    const userMenuItems: UserMenuItem[] = [
        {
            key: 'info',
            label: (
                <Space align="start" className="pl-0 py-2 pr-4">
                    <Avatar src={avatar} icon={<UserOutlined />} size="large" />
                    <div>
                        <Text strong>{name}</Text>
                        <div className="text-xs text-gray-500">{email}</div>
                    </div>
                </Space>
            ),
        },
        {
            key: 'divider1',
            type: 'divider',  //无需在意的错误
        },
        {
            key: 'profile',
            label: (
                <div className="flex items-center">
                    <UserOutlined className="mx-2" />
                    个人中心
                </div>
            ),
        },
        {
            key: 'settings',
            label: (
                <div className="flex items-center">
                    <SettingOutlined className="mx-2" />
                    账号设置
                </div>
            ),
        },
        {
            key: 'logout',
            label: (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                    }}
                    className="flex items-center text-red-600"
                >
                    <LogoutOutlined className="mx-2" />
                    退出登录
                </div>
            ),
        },
    ];

    // 通知内容渲染
    // const messageContent = (
    //     <div className="w-80 max-h-[400px] overflow-auto 
    //     [&::-webkit-scrollbar]:w-1
    // [&::-webkit-scrollbar-track]:rounded-xl
    // [&::-webkit-scrollbar-track]:bg-gray-100
    // [&::-webkit-scrollbar-thumb]:rounded-xl
    // [&::-webkit-scrollbar-thumb]:bg-gray-300
    // [&::-webkit-scrollbar-thumb:hover]:bg-gray-400
    // [&::-webkit-scrollbar-button]:hidden">

    //         {messageList.map((item) => (
    //             <Link to='' key={item.id}>
    //                 <div
    //                     className={`px-2 py-1 border-b rounded-sm mb-1 border-gray-100 transition-colors duration-200 hover:bg-gray-100 ${item.read ? 'bg-transparent' : 'bg-gray-50' // 未读浅蓝背景
    //                         }`}
    //                 >
    //                     <div className="flex items-start gap-3">
    //                         <div className="mt-1">
    //                             {getNotificationIcon(item.type)}
    //                         </div>

    //                         {/* 通知主体内容 */}
    //                         <div className="flex-1">
    //                             {/* 标题 + 类型标签 */}
    //                             <div className="flex items-center justify-between mb-1">
    //                                 <Text strong className={item.read ? 'text-gray-500!' : 'text-black'}>
    //                                     {item.title}
    //                                 </Text>
    //                                 <Tag color={getNotificationTagColor(item.type)}>
    //                                     {getNotificationTypeName(item.type)}
    //                                 </Tag>
    //                             </div>

    //                             {/* 通知详情内容 */}
    //                             <div className="text-[11px] font-normal text-gray-600 mb-1">
    //                                 {item.content}
    //                             </div>

    //                             {/* 发送者 + 时间 */}
    //                             <div className="flex items-center justify-between text-xs text-gray-400">
    //                                 {item.sender && (
    //                                     <div className="flex items-center">
    //                                         <Avatar src={item.sender.avatar} icon={<UserOutlined />} className="mr-3!" />
    //                                         <Text>{item.sender.name}</Text>
    //                                     </div>
    //                                 )}
    //                                 <Text className='text-[10px]!'>{item.time}</Text>
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </Link>
    //         ))}
    //     </div>
    // );

    // function handleMessageClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>): void {
    //     event.stopPropagation(); // 阻止事件冒泡，避免触发其他点击事件
    //     navigate('/messages')
    // }

    return (
        <Header className="flex fixed w-full  min-w-[800px] items-center justify-between  pl-2! shadow-sm  z-10 ">
            {/* 左侧：折叠按钮 + 系统名称 */}
            <div className="flex items-center">
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={toggleCollapsed}
                    className="text-xl mr-5 ml-4!"
                />
                <Title
                    level={2}
                    className="m-0 select-none mt-2! font-normal!"
                    style={{ letterSpacing: '-8px' }} // 自定义压缩间距（数值可调整，如 -1px、-3px）
                >
                    LenovoAdmin
                </Title>
            </div>

            {/* 右侧：搜索 + 通知 + 用户信息 */}
            <div className="flex items-center gap-4">
                {/* 搜索框区域 */}
                <div
                    ref={searchRef}
                    className="relative flex items-center"
                >
                    {!showSearch && (
                        <Button
                            type="text"
                            icon={<SearchOutlined />}
                            className="text-xl z-10"
                            onClick={toggleSearch}
                        />
                    )}
                    <div
                        className={`absolute right-0 transition-all duration-300 ease-in-out ${showSearch ? 'w-68 opacity-100' : 'w-0 opacity-0'
                            } overflow-hidden`}
                    >
                        <Search
                            placeholder="请输入搜索内容"
                            allowClear
                            enterButton={
                                <Button
                                    type="text"
                                    icon={<SearchOutlined />}
                                    className="border-0 bg-transparent text-black rounded-none"
                                />
                            }
                            size="middle"
                            value={inputValue}
                            onChange={handleInputChange}
                            onSearch={handleSearch}
                            onFocus={() => setShowSearch(true)}
                            className="w-full border border-gray-200 rounded-md"
                        />
                    </div>
                </div>
                {/* 消息通知 */}
                {/* <Popover
                    content={messageContent}
                    title="消息通知"
                    placement="bottomRight"
                    trigger="hover"
                    arrow
                >
                    <Badge count={messageList.filter(item => !item.read).length} size='small' dot={false}>
                        <Button type="text" icon={<BellOutlined />} onClick={handleMessageClick} className="text-xl" />
                    </Badge>
                </Popover> */}

                {/* 用户信息下拉 */}
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                    <div className="flex items-center cursor-pointer p-1 gap-2 rounded-md hover:bg-gray-200 transition-colors">
                        <Avatar src={avatar} icon={<UserOutlined />} />
                        <Text strong>{name}</Text>
                    </div>
                </Dropdown>
            </div>
        </Header>
    );
};

export default HeaderBar;