import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Tag, 
  Modal,
  Form,
  Tooltip,
  Descriptions,
  Statistic
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  EyeOutlined,
  FilterOutlined,
  ShoppingOutlined,
  DollarOutlined,
  UserOutlined,
  UserAddOutlined,
  CrownOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import { 
  getClientUsers, 
  updateClientUser,
  getClientUserStatistics,
  type User,
  type UserListParams,
  type ClientUserStatistics
} from '../../../services/user';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 表单验证schema
const userFilterSchema = z.object({
  keyword: z.string().optional(),
  memberType: z.string().optional(),
  dateRange: z.array(z.string()).optional(),
});

type UserFilterForm = z.infer<typeof userFilterSchema>;

const ClientUserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterVisible, setFilterVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 统计数据
  const [statistics, setStatistics] = useState<ClientUserStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 编辑弹窗
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const { handleSubmit, reset, watch } = useForm<UserFilterForm>({
    resolver: zodResolver(userFilterSchema),
    defaultValues: {
      keyword: '',
      memberType: '',
    }
  });

  // 加载统计数据
  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      const stats = await getClientUserStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 加载用户列表
  const loadUserList = async (params: UserListParams = {}) => {
    setLoading(true);
    try {
      const response = await getClientUsers({
        page,
        pageSize,
        ...params,
      });
      setData(response.list);
      setTotal(response.total);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    loadUserList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // 处理搜索
  const handleSearch = (values: UserFilterForm) => {
    const params: UserListParams = {
      keyword: values.keyword,
      memberType: values.memberType,
    };
    
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0];
      params.endDate = values.dateRange[1];
    }
    
    loadUserList(params);
    setFilterVisible(false);
  };

  // 重置筛选
  const handleReset = () => {
    reset();
    loadUserList();
  };

  // 查看用户详情
  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      account: user.account,
      nickname: user.nickname,
      email: user.email,
      memberType: user.memberType,
    });
    setEditModalVisible(true);
  };

  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        await updateClientUser(editingUser.id, {
          nickname: values.nickname,
          memberType: values.memberType,
        });
        globalMessage.success('用户更新成功');
      }

      // 刷新列表
      loadUserList();

      setEditModalVisible(false);
    } catch (error) {
      // 表单校验失败会抛出
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
      width: 120,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: '会员类型',
      dataIndex: 'memberType',
      key: 'memberType',
      width: 100,
      render: (type) => {
        const typeMap = {
          NORMAL: { color: 'default', text: '普通' },
          VIP: { color: 'blue', text: 'VIP' },
          SVIP: { color: 'gold', text: 'SVIP' },
        };
        const config = typeMap[type as keyof typeof typeMap] || typeMap.NORMAL;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 100,
      align: 'center',
      render: (count) => (
        <Tooltip title="查看订单">
          <Button type="link" icon={<ShoppingOutlined />}>
            {count}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '消费总额',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      width: 120,
      align: 'right',
      render: (amount) => (
        <Tooltip title="查看消费记录">
          <Button type="link" icon={<DollarOutlined />}>
            ¥{amount.toFixed(2)}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="用户总数"
              value={statistics?.totalUsers ?? 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="今日新增"
              value={statistics?.newUsersToday ?? 0}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="VIP会员"
              value={statistics?.vipUsers ?? 0}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="SVIP会员"
              value={statistics?.svipUsers ?? 0}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作栏 */}
      <Card className="mb-6">
        <Row justify="end" align="middle" gutter={[16, 16]}>
          <Col>
            <Space>
              <Input
                placeholder="搜索账号/昵称/邮箱"
                style={{ width: 200 }}
                value={watch('keyword')}
                onChange={(e) => reset({ ...watch(), keyword: e.target.value })}
                onPressEnter={() => handleSubmit(handleSearch)()}
              />
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterVisible(true)}
              >
                高级筛选
              </Button>
              <Button
                icon={<SearchOutlined />}
                type="primary"
                onClick={() => handleSubmit(handleSearch)()}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* 高级筛选模态框 */}
      <Modal
        title="高级筛选"
        open={filterVisible}
        onCancel={() => setFilterVisible(false)}
        onOk={() => handleSubmit(handleSearch)()}
        width={600}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="会员类型">
                <Select
                  placeholder="请选择会员类型"
                  value={watch('memberType')}
                  onChange={(value) => reset({ ...watch(), memberType: value })}
                  allowClear
                >
                  <Option value="NORMAL">普通会员</Option>
                  <Option value="VIP">VIP会员</Option>
                  <Option value="SVIP">SVIP会员</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="注册时间范围">
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates) {
                  reset({
                    ...watch(),
                    dateRange: dates.map(date => date?.format('YYYY-MM-DD')),
                  });
                } else {
                  reset({ ...watch(), dateRange: undefined });
                }
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedUser && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div className="text-center">
                  <div className="mb-4">
                    <img
                      src={selectedUser.avatar || 'https://via.placeholder.com/100'}
                      alt="avatar"
                      className="w-24 h-24 rounded-full mx-auto"
                    />
                  </div>
                  <h3 className="text-lg font-semibold">{selectedUser.nickname || selectedUser.account}</h3>
                  <Tag color={
                    selectedUser.memberType === 'SVIP' ? 'gold' :
                    selectedUser.memberType === 'VIP' ? 'blue' : 'default'
                  }>
                    {selectedUser.memberType === 'SVIP' ? 'SVIP会员' :
                     selectedUser.memberType === 'VIP' ? 'VIP会员' : '普通会员'}
                  </Tag>
                </div>
              </Col>
              <Col span={16}>
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="账号">{selectedUser.account}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{selectedUser.email}</Descriptions.Item>
                  <Descriptions.Item label="昵称">{selectedUser.nickname || '未设置'}</Descriptions.Item>
                  <Descriptions.Item label="性别">
                    {selectedUser.gender === 'MALE' ? '男' :
                     selectedUser.gender === 'FEMALE' ? '女' : '未知'}
                  </Descriptions.Item>
                  <Descriptions.Item label="生日">
                    {selectedUser.birthday ? dayjs(selectedUser.birthday).format('YYYY-MM-DD') : '未设置'}
                  </Descriptions.Item>
                  <Descriptions.Item label="注册时间">
                    {dayjs(selectedUser.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后登录">
                    {selectedUser.lastLoginTime ? dayjs(selectedUser.lastLoginTime).format('YYYY-MM-DD HH:mm:ss') : '从未登录'}
                  </Descriptions.Item>
                  <Descriptions.Item label="订单数" span={1}>
                    {selectedUser.orderCount}
                  </Descriptions.Item>
                  <Descriptions.Item label="消费总额" span={1}>
                    ¥{selectedUser.totalSpent.toFixed(2)}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveUser}
        okText="保存"
        cancelText="取消"
        width={640}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="账号"
                name="account"
              >
                <Input placeholder="账号" disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                name="email"
              >
                <Input placeholder="邮箱" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="昵称"
                name="nickname"
              >
                <Input placeholder="请输入昵称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="会员类型" name="memberType">
                <Select placeholder="请选择会员类型">
                  <Option value="NORMAL">普通会员</Option>
                  <Option value="VIP">VIP会员</Option>
                  <Option value="SVIP">SVIP会员</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientUserManagement;