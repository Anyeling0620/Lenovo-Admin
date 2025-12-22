import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Modal,
  Form,
  Popconfirm,
  Tooltip,
  Badge,
  Avatar,
  message
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  KeyOutlined,
  LockOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import { 
  getAdminList, 
  deleteAdmin, 
  resetAdminPassword,
  type Admin,
  type AdminListParams
} from '../../../services/user';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';

const { Option } = Select;

// 表单验证schema
const adminFilterSchema = z.object({
  keyword: z.string().optional(),
  status: z.string().optional(),
  identityId: z.string().optional(),
});

type AdminFilterForm = z.infer<typeof adminFilterSchema>;

const AdminListPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { control, handleSubmit, reset, watch } = useForm<AdminFilterForm>({
    resolver: zodResolver(adminFilterSchema),
    defaultValues: {
      keyword: '',
      status: '',
      identityId: '',
    }
  });

  // 加载管理员列表
  const loadAdminList = async (params: AdminListParams = {}) => {
    setLoading(true);
    try {
      const response = await getAdminList({
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
    loadAdminList();
  }, [page, pageSize]);

  // 处理搜索
  const handleSearch = (values: AdminFilterForm) => {
    const params: AdminListParams = {
      keyword: values.keyword,
      status: values.status,
      identityId: values.identityId,
    };
    
    loadAdminList(params);
  };

  // 重置筛选
  const handleReset = () => {
    reset();
    loadAdminList();
  };

  // 删除管理员
  const handleDelete = async (adminId: string) => {
    try {
      await deleteAdmin(adminId);
      globalMessage.success('管理员删除成功');
      loadAdminList();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      globalMessage.warning('请选择要删除的管理员');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个管理员吗？`,
      onOk: async () => {
        try {
          // 这里应该调用批量删除接口，暂时循环删除
          for (const adminId of selectedRowKeys) {
            await deleteAdmin(adminId as string);
          }
          globalMessage.success('批量删除成功');
          setSelectedRowKeys([]);
          loadAdminList();
        } catch (error) {
          globalErrorHandler.handle(error, globalMessage.error);
        }
      }
    });
  };

  // 重置密码
  const handleResetPassword = (admin: Admin) => {
    setSelectedAdmin(admin);
    setNewPassword('');
    setResetPasswordModalVisible(true);
  };

  // 确认重置密码
  const confirmResetPassword = async () => {
    if (!selectedAdmin) return;
    
    if (!newPassword || newPassword.length < 6) {
      globalMessage.warning('密码长度不能少于6位');
      return;
    }

    try {
      await resetAdminPassword(selectedAdmin.id, newPassword);
      globalMessage.success('密码重置成功');
      setResetPasswordModalVisible(false);
      setSelectedAdmin(null);
      setNewPassword('');
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 生成随机密码
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  // 表格列定义
  const columns: ColumnsType<Admin> = [
    {
      title: '管理员ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar) => (
        <Avatar 
          src={avatar} 
          icon={!avatar && <UserOutlined />}
          size="large"
        />
      ),
    },
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
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (email) => email || '-',
    },
    {
      title: '身份',
      dataIndex: 'identities',
      key: 'identities',
      width: 200,
      render: (identities) => (
        <Space size={[0, 4]} wrap>
          {identities?.slice(0, 2).map((identity: any) => (
            <Tag key={identity.id} color="blue">
              {identity.name}
            </Tag>
          ))}
          {identities?.length > 2 && (
            <Tooltip title={identities.slice(2).map((i: any) => i.name).join(', ')}>
              <Tag>+{identities.length - 2}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '负责专区',
      dataIndex: 'productCategories',
      key: 'productCategories',
      width: 200,
      render: (categories) => (
        <Space size={[0, 4]} wrap>
          {categories?.slice(0, 2).map((category: any) => (
            <Tag key={category.id} color="green">
              {category.name}
            </Tag>
          ))}
          {categories?.length > 2 && (
            <Tooltip title={categories.slice(2).map((c: any) => c.name).join(', ')}>
              <Tag>+{categories.length - 2}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          ACTIVE: { color: 'success', text: '正常' },
          INACTIVE: { color: 'default', text: '停用' },
          BANNED: { color: 'error', text: '封禁' },
        };
        const config = statusMap[status as keyof typeof statusMap] || statusMap.INACTIVE;
        return <Badge status={config.color as any} text={config.text} />;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      width: 180,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '从未登录',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              disabled={record.status === 'BANNED'}
            />
          </Tooltip>
          <Tooltip title="重置密码">
            <Button 
              type="text" 
              icon={<KeyOutlined />}
              onClick={() => handleResetPassword(record)}
              disabled={record.status === 'BANNED'}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个管理员吗？"
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
    getCheckboxProps: (record: Admin) => ({
      disabled: record.status === 'BANNED',
    }),
  };

  return (
    <div className="p-4">
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
                新增管理员
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
                placeholder="搜索账号/姓名/邮箱"
                style={{ width: 200 }}
                value={watch('keyword')}
                onChange={(e) => reset({ ...watch(), keyword: e.target.value })}
                onPressEnter={() => handleSubmit(handleSearch)()}
              />
              <Select
                placeholder="状态筛选"
                style={{ width: 120 }}
                value={watch('status')}
                onChange={(value) => reset({ ...watch(), status: value })}
                allowClear
              >
                <Option value="ACTIVE">正常</Option>
                <Option value="INACTIVE">停用</Option>
                <Option value="BANNED">封禁</Option>
              </Select>
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

      {/* 管理员表格 */}
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
          scroll={{ x: 1800 }}
          size="middle"
        />
      </Card>

      {/* 重置密码模态框 */}
      <Modal
        title="重置密码"
        open={resetPasswordModalVisible}
        onCancel={() => {
          setResetPasswordModalVisible(false);
          setSelectedAdmin(null);
          setNewPassword('');
        }}
        onOk={confirmResetPassword}
        width={500}
      >
        {selectedAdmin && (
          <div>
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <Row align="middle" gutter={16}>
                <Col>
                  <Avatar 
                    src={selectedAdmin.avatar} 
                    icon={!selectedAdmin.avatar && <UserOutlined />}
                    size="large"
                  />
                </Col>
                <Col>
                  <div>
                    <div className="font-medium">{selectedAdmin.name}</div>
                    <div className="text-gray-500">{selectedAdmin.account}</div>
                  </div>
                </Col>
              </Row>
            </div>

            <Form layout="vertical">
              <Form.Item label="新密码" required>
                <Input.Password
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码"
                  addonAfter={
                    <Button 
                      type="text" 
                      icon={<LockOutlined />}
                      onClick={generateRandomPassword}
                    >
                      生成随机密码
                    </Button>
                  }
                />
              </Form.Item>
              {newPassword && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm text-gray-600">密码强度：</div>
                  <div className="mt-1">
                    {newPassword.length >= 12 ? (
                      <Tag color="success">强</Tag>
                    ) : newPassword.length >= 8 ? (
                      <Tag color="warning">中</Tag>
                    ) : (
                      <Tag color="error">弱</Tag>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    提示：密码应包含大小写字母、数字和特殊字符，长度不少于8位
                  </div>
                </div>
              )}
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminListPage;