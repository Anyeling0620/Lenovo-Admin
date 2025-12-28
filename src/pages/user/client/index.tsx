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
  Statistic,
  Modal,
  Form,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Descriptions
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  FilterOutlined,
  ShoppingOutlined,
  DollarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import { 
  getClientUsers, 
  getClientUserStatistics, 
  deleteClientUser,
  type User,
  type UserListParams,
  type UserStatistics
} from '../../../services/user';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 表单验证schema
const userFilterSchema = z.object({
  keyword: z.string().optional(),
  memberType: z.string().optional(),
  status: z.string().optional(),
  dateRange: z.array(z.string()).optional(),
});

type UserFilterForm = z.infer<typeof userFilterSchema>;

const ClientUserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { control, handleSubmit, reset, watch } = useForm<UserFilterForm>({
    resolver: zodResolver(userFilterSchema),
    defaultValues: {
      keyword: '',
      memberType: '',
      status: '',
    }
  });

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

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      const stats = await getClientUserStatistics();
      setStatistics(stats);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  useEffect(() => {
    loadUserList();
    loadStatistics();
  }, [page, pageSize]);

  // 处理搜索
  const handleSearch = (values: UserFilterForm) => {
    const params: UserListParams = {
      keyword: values.keyword,
      memberType: values.memberType,
      status: values.status,
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

  // 删除用户
  const handleDelete = async (userId: string) => {
    try {
      await deleteClientUser(userId);
      globalMessage.success('用户删除成功');
      loadUserList();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      globalMessage.warning('请选择要删除的用户');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个用户吗？`,
      onOk: async () => {
        try {
          // 这里应该调用批量删除接口，暂时循环删除
          for (const userId of selectedRowKeys) {
            await deleteClientUser(userId as string);
          }
          globalMessage.success('批量删除成功');
          setSelectedRowKeys([]);
          loadUserList();
        } catch (error) {
          globalErrorHandler.handle(error, globalMessage.error);
        }
      }
    });
  };

  // 查看用户详情
  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          ACTIVE: { color: 'success', text: '活跃' },
          INACTIVE: { color: 'default', text: '未激活' },
          BANNED: { color: 'error', text: '已封禁' },
        };
        const config = statusMap[status as keyof typeof statusMap] || statusMap.INACTIVE;
        return <Badge status={config.color as any} text={config.text} />;
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
      width: 180,
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
              disabled={record.status === 'BANNED'}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个用户吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                disabled={record.status === 'BANNED'}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    getCheckboxProps: (record: User) => ({
      disabled: record.status === 'BANNED',
    }),
  };

  return (
    <div className="p-4">
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={statistics?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={statistics?.activeUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={statistics?.newUsersToday || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="VIP用户"
              value={(statistics?.vipUsers || 0) + (statistics?.svipUsers || 0)}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作栏 */}
      <Card className="mb-6">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                // onClick={() => setCreateModalVisible(true)}
              >
                新增用户
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
                disabled={selectedRowKeys.length === 0}
              >
                批量删除
              </Button>
            </Space>
          </Col>
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
          rowSelection={rowSelection}
          scroll={{ x: 1500 }}
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
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item label="用户状态">
                <Select
                  placeholder="请选择用户状态"
                  value={watch('status')}
                  onChange={(value) => reset({ ...watch(), status: value })}
                  allowClear
                >
                  <Option value="ACTIVE">活跃</Option>
                  <Option value="INACTIVE">未激活</Option>
                  <Option value="BANNED">已封禁</Option>
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
                  <Descriptions.Item label="状态">
                    <Badge 
                      status={
                        selectedUser.status === 'ACTIVE' ? 'success' :
                        selectedUser.status === 'INACTIVE' ? 'default' : 'error'
                      } 
                      text={
                        selectedUser.status === 'ACTIVE' ? '活跃' :
                        selectedUser.status === 'INACTIVE' ? '未激活' : '已封禁'
                      }
                    />
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
    </div>
  );
};

export default ClientUserManagement