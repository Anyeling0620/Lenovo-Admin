import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Select, 
  Space, 
  Statistic,
  Modal,
  Popconfirm,
  Tooltip,
  Badge,
  Descriptions,
  Tabs
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  UserOutlined, 
  LogoutOutlined,
  DesktopOutlined,
  MobileOutlined,
  EyeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { 
  getOnlineList, 
  forceLogout,
  getLoginRecords,
  type OnlineUser,
  type OnlineAdmin,
  type OnlineListResponse,
  type LoginRecord
} from '../../../services/user';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';

const { TabPane } = Tabs;
const { Option } = Select;

const OnlineManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [onlineData, setOnlineData] = useState<OnlineListResponse | null>(null);
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsPageSize, setRecordsPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('online');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<OnlineUser | OnlineAdmin | null>(null);
  const [keyword, setKeyword] = useState('');
  const [deviceType, setDeviceType] = useState('');

  // 加载在线列表
  const loadOnlineList = async () => {
    setLoading(true);
    try {
      const data = await getOnlineList();
      setOnlineData(data);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setLoading(false);
    }
  };

  // 加载登录记录
  const loadLoginRecords = useCallback(async () => {
    try {
      const response = await getLoginRecords({
        page: recordsPage,
        pageSize: recordsPageSize,
        account: keyword,
        deviceType: deviceType,
        userType: 'ADMIN', // 指定为管理员类型
      });
      setLoginRecords(response.list);
      setRecordsTotal(response.total);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  }, [recordsPage, recordsPageSize, keyword, deviceType]);

  useEffect(() => {
    if (activeTab === 'online') {
      loadOnlineList();
      const interval = setInterval(loadOnlineList, 30000);
      return () => clearInterval(interval);
    } else {
      loadLoginRecords();
    }
  }, [activeTab, loadLoginRecords]);

  // 强制下线
  const handleForceLogout = async (sessionId: string, userType: 'USER' | 'ADMIN') => {
    try {
      await forceLogout(sessionId, userType);
      globalMessage.success('强制下线成功');
      loadOnlineList();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 查看会话详情
  const handleViewDetail = (session: OnlineUser | OnlineAdmin) => {
    setSelectedSession(session);
    setDetailModalVisible(true);
  };

  // 计算在线时长
  const calculateOnlineDuration = (loginTime: string) => {
    const login = dayjs(loginTime);
    const now = dayjs();
    const duration = now.diff(login, 'second');
    
    if (duration < 60) return `${duration}秒`;
    if (duration < 3600) return `${Math.floor(duration / 60)}分钟`;
    if (duration < 86400) return `${Math.floor(duration / 3600)}小时${Math.floor((duration % 3600) / 60)}分钟`;
    return `${Math.floor(duration / 86400)}天${Math.floor((duration % 86400) / 3600)}小时`;
  };

  // 解析User-Agent字符串为友好的设备名称
  const parseDeviceName = (deviceName: string): string => {
    if (!deviceName || deviceName === '未知设备') return '未知设备';
    
    // 如果不是User-Agent字符串，直接返回
    if (!deviceName.startsWith('Mozilla/') && deviceName.length < 50) {
      return deviceName;
    }
    
    const ua = deviceName;
    let browser = '未知浏览器';
    let os = '未知系统';
    
    // 解析浏览器（顺序很重要）
    if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
    
    // 解析操作系统
    if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
    else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (ua.includes('Windows NT 6.2')) os = 'Windows 8';
    else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (ua.includes('Windows NT')) os = 'Windows';
    else if (ua.includes('Mac OS X')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('iPad')) os = 'iPad';
    else if (ua.includes('Linux') && ua.includes('X11')) os = 'Linux';
    else if (ua.includes('Linux')) os = 'Linux';
    
    return `${browser} (${os})`;
  };

  // 用户表格列定义
  const userColumns: ColumnsType<OnlineUser> = [
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '设备',
      key: 'device',
      width: 250,
      render: (_, record) => {
        // 更精确的设备类型判断
        const deviceType = record.deviceType?.toLowerCase() || '';
        const isMobile = deviceType.includes('mobile') || 
                        deviceType === '手机' || 
                        deviceType === 'android' || 
                        deviceType === 'ios' ||
                        deviceType === 'phone';
        const deviceTypeName = isMobile ? '手机' : '电脑';
        
        // 使用解析函数获取友好的设备名称
        const displayName = parseDeviceName(record.deviceName);
        
        return (
          <div className="flex items-center">
            {isMobile ? <MobileOutlined className="mr-2 text-green-500" /> : <DesktopOutlined className="mr-2 text-blue-500" />}
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-gray-500">{deviceTypeName}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '在线时长',
      key: 'duration',
      width: 120,
      render: (_, record) => (
        <Tooltip title={`登录时间：${dayjs(record.loginTime).format('YYYY-MM-DD HH:mm:ss')}`}>
          <div className="flex items-center">
            <ClockCircleOutlined className="mr-1" />
            {calculateOnlineDuration(record.loginTime)}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150,
      render: (ip) => ip || '未知',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="强制下线">
            <Popconfirm title="确定要强制下线这个用户吗？" onConfirm={() => handleForceLogout(record.sessionId, 'USER')}>
              <Button type="text" danger icon={<LogoutOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 管理员表格列定义
  const adminColumns: ColumnsType<OnlineAdmin> = [
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '设备',
      key: 'device',
      width: 250,
      render: (_, record) => {
        // 更精确的设备类型判断
        const deviceType = record.deviceType?.toLowerCase() || '';
        const isMobile = deviceType.includes('mobile') || 
                        deviceType === '手机' || 
                        deviceType === 'android' || 
                        deviceType === 'ios' ||
                        deviceType === 'phone';
        const deviceTypeName = isMobile ? '手机' : '电脑';
        
        // 使用解析函数获取友好的设备名称
        const displayName = parseDeviceName(record.deviceName);
        
        return (
          <div className="flex items-center">
            {isMobile ? <MobileOutlined className="mr-2 text-green-500" /> : <DesktopOutlined className="mr-2 text-blue-500" />}
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-gray-500">{deviceTypeName}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '在线时长',
      key: 'duration',
      width: 120,
      render: (_, record) => (
        <Tooltip title={`登录时间：${dayjs(record.loginTime).format('YYYY-MM-DD HH:mm:ss')}`}>
          <div className="flex items-center">
            <ClockCircleOutlined className="mr-1" />
            {calculateOnlineDuration(record.loginTime)}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150,
      render: (ip) => ip || '未知',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="强制下线">
            <Popconfirm title="确定要强制下线这个管理员吗？" onConfirm={() => handleForceLogout(record.sessionId, 'ADMIN')}>
              <Button type="text" danger icon={<LogoutOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 登录记录表格列定义
  const recordColumns: ColumnsType<LoginRecord> = [
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '设备',
      key: 'device',
      width: 250,
      render: (_, record) => {
        // 更精确的设备类型判断
        const deviceType = record.deviceType?.toLowerCase() || '';
        const isMobile = deviceType.includes('mobile') || 
                        deviceType === '手机' || 
                        deviceType === 'android' || 
                        deviceType === 'ios' ||
                        deviceType === 'phone';
        const deviceTypeName = isMobile ? '手机' : '电脑';
        
        // 使用解析函数获取友好的设备名称
        const displayName = parseDeviceName(record.deviceName);
        
        return (
          <div className="flex items-center">
            {isMobile ? <MobileOutlined className="mr-2 text-green-500" /> : <DesktopOutlined className="mr-2 text-blue-500" />}
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-gray-500">{deviceTypeName}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '登出时间',
      dataIndex: 'logoutTime',
      key: 'logoutTime',
      width: 180,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150,
      render: (ip) => ip || '未知',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Badge status={status === 'ONLINE' ? 'success' : 'default'} text={status === 'ONLINE' ? '在线' : '离线'} />,
    },
  ];

  return (
    <div className="p-4">
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}><Card><Statistic title="在线用户" value={onlineData?.totalUsers || 0} prefix={<UserOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="在线管理员" value={onlineData?.totalAdmins || 0} prefix={<UserOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="PC端在线" value={(onlineData?.users?.filter(u => u.deviceType === 'pc').length || 0) + (onlineData?.admins?.filter(a => a.deviceType === 'pc').length || 0)} prefix={<DesktopOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="移动端在线" value={(onlineData?.users?.filter(u => u.deviceType === 'mobile').length || 0) + (onlineData?.admins?.filter(a => a.deviceType === 'mobile').length || 0)} prefix={<MobileOutlined />} valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="在线用户" key="online">
            <div className="mb-4">
              <Space>
                <Input placeholder="搜索账号/姓名" style={{ width: 200 }} value={keyword} onChange={e => setKeyword(e.target.value)} />
                <Select placeholder="设备类型" style={{ width: 120 }} value={deviceType} onChange={setDeviceType} allowClear>
                  <Option value="pc">电脑</Option>
                  <Option value="mobile">手机</Option>
                </Select>
                <Button icon={<SearchOutlined />} type="primary" onClick={loadOnlineList}>搜索</Button>
                <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setDeviceType(''); }}>重置</Button>
              </Space>
            </div>
            <Table columns={userColumns} dataSource={onlineData?.users || []} rowKey="sessionId" loading={loading} scroll={{ x: 1000 }} />
          </TabPane>
          
          <TabPane tab="在线管理员" key="admin">
            <div className="mb-4">
              <Space>
                <Input placeholder="搜索账号/姓名" style={{ width: 200 }} value={keyword} onChange={e => setKeyword(e.target.value)} />
                <Select placeholder="设备类型" style={{ width: 120 }} value={deviceType} onChange={setDeviceType} allowClear>
                  <Option value="pc">电脑</Option>
                  <Option value="mobile">手机</Option>
                </Select>
                <Button icon={<SearchOutlined />} type="primary" onClick={loadOnlineList}>搜索</Button>
                <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setDeviceType(''); }}>重置</Button>
              </Space>
            </div>
            <Table columns={adminColumns} dataSource={onlineData?.admins || []} rowKey="sessionId" loading={loading} scroll={{ x: 1000 }} />
          </TabPane>
          
          <TabPane tab="登录记录" key="records">
            <div className="mb-4">
              <Space>
                <Input placeholder="搜索账号" style={{ width: 200 }} value={keyword} onChange={e => setKeyword(e.target.value)} />
                <Select placeholder="设备类型" style={{ width: 120 }} value={deviceType} onChange={setDeviceType} allowClear>
                  <Option value="pc">电脑</Option>
                  <Option value="mobile">手机</Option>
                </Select>
                <Button icon={<SearchOutlined />} type="primary" onClick={loadLoginRecords}>搜索</Button>
                <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setDeviceType(''); }}>重置</Button>
              </Space>
            </div>
            <Table columns={recordColumns} dataSource={loginRecords} rowKey="id" loading={loading} pagination={{ current: recordsPage, pageSize: recordsPageSize, total: recordsTotal, onChange: (page, pageSize) => { setRecordsPage(page); setRecordsPageSize(pageSize); } }} scroll={{ x: 1200 }} />
          </TabPane>
        </Tabs>
      </Card>

      <Modal title="会话详情" open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} footer={null} width={600}>
        {selectedSession && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="账号">{selectedSession.account}</Descriptions.Item>
            <Descriptions.Item label="姓名">{selectedSession.name}</Descriptions.Item>
            <Descriptions.Item label="设备类型">{selectedSession.deviceType === 'pc' ? '电脑' : '手机'}</Descriptions.Item>
            <Descriptions.Item label="设备名称">{selectedSession.deviceName}</Descriptions.Item>
            <Descriptions.Item label="登录时间">{dayjs(selectedSession.loginTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="在线时长">{calculateOnlineDuration(selectedSession.loginTime)}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{selectedSession.ipAddress || '未知'}</Descriptions.Item>
            <Descriptions.Item label="最后活动">{selectedSession.lastActivityTime ? dayjs(selectedSession.lastActivityTime).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
            <Descriptions.Item label="会话ID" span={2}>{selectedSession.sessionId}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OnlineManagement;