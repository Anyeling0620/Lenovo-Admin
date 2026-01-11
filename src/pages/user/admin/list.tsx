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
  Tag, 
  Modal,
  Form,
  Tooltip,
  Badge
} from 'antd';
import type { BadgeProps } from 'antd';

type IdName = { id: string; name: string };
type CategoryApiItem = { category_id: string; name: string };
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EyeOutlined,
  PlusOutlined,
  KeyOutlined,
  LockOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  getAdminList,
  createAdmin,
  resetAdminPassword,
  getIdentityList,
  type Admin,
  type AdminListParams,
  type CreateAdminParams
} from '../../../services/user';
import { disableAdmin, getCategories } from '../../../services/api';
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
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // 新增管理员相关状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [identities, setIdentities] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const { handleSubmit, reset, watch } = useForm<AdminFilterForm>({
    resolver: zodResolver(adminFilterSchema),
    defaultValues: {
      keyword: '',
      status: '',
      identityId: '',
    }
  });

  // 加载管理员列表
  const loadAdminList = useCallback(async (params: AdminListParams = {}) => {
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
  }, [page, pageSize]);

  useEffect(() => {
    loadAdminList();
    loadIdentities();
    loadCategories();
  }, [loadAdminList]);

  // 加载身份列表
  const loadIdentities = async () => {
    try {
      const response = await getIdentityList({ page: 1, pageSize: 100 });
      setIdentities(response.list.map(item => ({ id: item.id, name: item.name })));
    } catch (error) {
      console.error('Failed to load identities:', error);
    }
  };

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(
        (response as CategoryApiItem[]).map((item) => ({ id: item.category_id, name: item.name }))
      );
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // 处理搜索
  const handleSearch = (values: AdminFilterForm) => {
    const params: AdminListParams = {
      keyword: values.keyword,
      status: values.status,
      identityId: values.identityId,
    };
    
    // 搜索时重置到第一页
    setPage(1);
    loadAdminList(params);
  };

  // 重置筛选
  const handleReset = () => {
    reset();
    setPage(1);
    loadAdminList();
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

  // 禁用管理员（按需求：禁用后不允许再启用）
  // API（见 src/services/api.ts 与 src/services/API文档.md）：
  // - POST /system/admins/{adminId}/disable
  const handleDisableAdmin = async (admin: Admin) => {
    // 已禁用/封禁：按钮会置灰，不允许再次操作
    if (admin.status === 'INACTIVE' || admin.status === 'BANNED') return;
    Modal.confirm({
      title: '确定禁用该管理员？',
      content: '禁用后，该管理员将无法继续登录后台，且当前系统不支持再次启用。',
      okText: '禁用',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await disableAdmin(admin.id);
          globalMessage.success('已禁用');
          loadAdminList();
        } catch (error) {
          globalErrorHandler.handle(error, globalMessage.error);
        }
      },
    });
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

  // 打开创建管理员弹窗
  const handleOpenCreateModal = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  // 创建管理员
  const handleCreateAdmin = async () => {
    try {
      const values = await createForm.validateFields();
      
      const params: CreateAdminParams = {
        account: values.account,
        password: values.password,
        name: values.name,
        email: values.email,
        nickname: values.nickname,
        identityIds: values.identityIds || [],
        categoryIds: values.categoryIds || [], // 添加负责专区
      };
      
      await createAdmin(params);
      globalMessage.success('管理员创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      loadAdminList();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
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
          {(
            identities as IdName[] | undefined
          )?.slice(0, 2).map((identity) => (
            <Tag key={identity.id} color="blue">
              {identity.name}
            </Tag>
          ))}
          {(((identities as IdName[] | undefined)?.length ?? 0) > 2) && (
            <Tooltip
              title={(identities as IdName[]).slice(2).map(i => i.name).join(', ')}
            >
              <Tag>+{(identities as IdName[]).length - 2}</Tag>
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
          {(
            categories as IdName[] | undefined
          )?.slice(0, 2).map((category) => (
            <Tag key={category.id} color="green">
              {category.name}
            </Tag>
          ))}
          {(((categories as IdName[] | undefined)?.length ?? 0) > 2) && (
            <Tooltip
              title={(categories as IdName[]).slice(2).map(c => c.name).join(', ')}
            >
              <Tag>+{(categories as IdName[]).length - 2}</Tag>
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
  return <Badge status={config.color as BadgeProps['status']} text={config.text} />;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
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
      <Tooltip title={record.status === 'INACTIVE' ? '已禁用（不可操作）' : record.status === 'BANNED' ? '封禁（不可操作）' : '禁用'}>
            <Button
              type="text"
              icon={<LockOutlined />}
        onClick={() => handleDisableAdmin(record)}
        disabled={record.status === 'INACTIVE' || record.status === 'BANNED'}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      {/* 搜索和操作栏 */}
      <Card className="mb-6">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
            >
              新增管理员
            </Button>
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
              <div className="font-medium">{selectedAdmin.name}</div>
              <div className="text-gray-500">{selectedAdmin.account}</div>
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

      {/* 创建管理员模态框 */}
      <Modal
        title="新增管理员"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        onOk={handleCreateAdmin}
        width={640}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="账号"
                name="account"
                rules={[
                  { required: true, message: '请输入账号' },
                  { min: 3, message: '账号长度不能少于3位' }
                ]}
              >
                <Input placeholder="请输入账号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码长度不能少于6位' }
                ]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="昵称"
                name="nickname"
              >
                <Input placeholder="请输入昵称（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="身份/角色"
                name="identityIds"
              >
                <Select
                  mode="multiple"
                  placeholder="请选择身份/角色（可选）"
                  options={identities.map(item => ({
                    label: item.name,
                    value: item.id
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="负责专区"
                name="categoryIds"
              >
                <Select
                  mode="multiple"
                  placeholder="请选择负责的商品专区（可选）"
                  options={categories.map(item => ({
                    label: item.name,
                    value: item.id
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminListPage;