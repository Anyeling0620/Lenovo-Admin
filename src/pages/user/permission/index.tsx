import React, { useState, useEffect } from 'react';
import { 
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
  Tree,
  Popconfirm,
  Tooltip,
  Badge,
  Table,
  message
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  PlusOutlined,
  EditOutlined, 
  DeleteOutlined,
  FolderOutlined,
  MenuOutlined,
  ApiOutlined,
  AppstoreOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  getPermissionTree, 
  getPermissionList,
  createPermission,
  updatePermission,
  deletePermission,
  type Permission,
  type CreatePermissionParams
} from '../../../services/user';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';

const { Option } = Select;

// 表单验证schema
const permissionFilterSchema = z.object({
  type: z.string().optional(),
  module: z.string().optional(),
});

type PermissionFilterForm = z.infer<typeof permissionFilterSchema>;

// 创建/编辑权限表单schema
const permissionFormSchema = z.object({
  name: z.string().min(1, '权限名称不能为空'),
  code: z.string().optional(),
  type: z.enum(['MENU', 'BUTTON', 'API']),
  module: z.string().min(1, '模块名称不能为空'),
  parentId: z.string().optional(),
});

type PermissionForm = z.infer<typeof permissionFormSchema>;

const PermissionManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [listData, setListData] = useState<Permission[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [parentPermissions, setParentPermissions] = useState<Permission[]>([]);

  const { control: filterControl, handleSubmit: handleFilterSubmit, reset: resetFilter, watch: filterWatch } = useForm<PermissionFilterForm>({
    resolver: zodResolver(permissionFilterSchema),
    defaultValues: {
      type: '',
      module: '',
    }
  });

  const { control: formControl, handleSubmit: handleFormSubmit, reset: resetForm, setValue } = useForm<PermissionForm>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'MENU',
      module: '',
      parentId: '',
    }
  });

  // 加载权限树
  const loadPermissionTree = async () => {
    setLoading(true);
    try {
      const data = await getPermissionTree();
      const treeNodes = convertPermissionsToTreeNodes(data);
      setTreeData(treeNodes);
      
      // 展开所有节点
      const allKeys = getAllKeys(treeNodes);
      setExpandedKeys(allKeys);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setLoading(false);
    }
  };

  // 加载权限列表
  const loadPermissionList = async (params?: any) => {
    try {
      const data = await getPermissionList(params);
      setListData(data);
      
      // 加载父权限选项
      const parentOptions = data.filter(p => p.type === 'MENU');
      setParentPermissions(parentOptions);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 转换权限数据为树节点
  const convertPermissionsToTreeNodes = (permissions: Permission[]): DataNode[] => {
    return permissions.map(permission => ({
      key: permission.id,
      title: (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {permission.type === 'MENU' && <MenuOutlined className="mr-2" />}
            {permission.type === 'BUTTON' && <AppstoreOutlined className="mr-2" />}
            {permission.type === 'API' && <ApiOutlined className="mr-2" />}
            <span>{permission.name}</span>
            {permission.code && (
              <Tag color="blue" className="ml-2">
                {permission.code}
              </Tag>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Tag color={
              permission.type === 'MENU' ? 'green' :
              permission.type === 'BUTTON' ? 'orange' : 'purple'
            }>
              {permission.type === 'MENU' ? '菜单' :
               permission.type === 'BUTTON' ? '按钮' : '接口'}
            </Tag>
            <Tag color={permission.status === 'ACTIVE' ? 'success' : 'default'}>
              {permission.status === 'ACTIVE' ? '启用' : '禁用'}
            </Tag>
            <Space size={0}>
              <Tooltip title="编辑">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPermission(permission);
                  }}
                />
              </Tooltip>
              <Tooltip title="删除">
                <Popconfirm
                  title="确定要删除这个权限吗？"
                  onConfirm={() => handleDeletePermission(permission.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    type="text" 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Tooltip>
            </Space>
          </div>
        </div>
      ),
      children: permission.children ? convertPermissionsToTreeNodes(permission.children) : [],
      icon: permission.type === 'MENU' ? <FolderOutlined /> : undefined,
    }));
  };

  // 获取所有节点key
  const getAllKeys = (nodes: DataNode[]): React.Key[] => {
    let keys: React.Key[] = [];
    nodes.forEach(node => {
      keys.push(node.key);
      if (node.children) {
        keys = keys.concat(getAllKeys(node.children));
      }
    });
    return keys;
  };

  // 处理搜索
  const handleSearch = (values: PermissionFilterForm) => {
    loadPermissionList(values);
  };

  // 重置筛选
  const handleReset = () => {
    resetFilter();
    loadPermissionList();
  };

  // 处理树节点选择
  const handleTreeSelect = (selectedKeys: React.Key[], info: any) => {
    setSelectedKeys(selectedKeys);
    if (selectedKeys.length > 0) {
      // 这里可以加载选中权限的详细信息
    }
  };

  // 处理树节点展开
  const handleTreeExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys);
  };

  // 打开创建权限模态框
  const handleCreatePermission = () => {
    setFormMode('create');
    resetForm({
      name: '',
      code: '',
      type: 'MENU',
      module: '',
      parentId: selectedKeys.length > 0 ? selectedKeys[0] as string : '',
    });
    setFormModalVisible(true);
  };

  // 打开编辑权限模态框
  const handleEditPermission = (permission: Permission) => {
    setFormMode('edit');
    setSelectedPermission(permission);
    resetForm({
      name: permission.name,
      code: permission.code || '',
      type: permission.type as 'MENU' | 'BUTTON' | 'API',
      module: permission.module,
      parentId: permission.parentId || '',
    });
    setFormModalVisible(true);
  };

  // 处理表单提交
  const handleFormSubmitInternal = async (values: PermissionForm) => {
    try {
      if (formMode === 'create') {
        await createPermission(values);
        globalMessage.success('权限创建成功');
      } else {
        if (selectedPermission) {
          await updatePermission(selectedPermission.id, values);
          globalMessage.success('权限更新成功');
        }
      }
      
      setFormModalVisible(false);
      loadPermissionTree();
      loadPermissionList();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 删除权限
  const handleDeletePermission = async (permissionId: string) => {
    try {
      await deletePermission(permissionId);
      globalMessage.success('权限删除成功');
      loadPermissionTree();
      loadPermissionList();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 表格列定义
  const columns: ColumnsType<Permission> = [
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div className="flex items-center">
          {record.type === 'MENU' && <MenuOutlined className="mr-2" />}
          {record.type === 'BUTTON' && <AppstoreOutlined className="mr-2" />}
          {record.type === 'API' && <ApiOutlined className="mr-2" />}
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '权限编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const typeMap = {
          MENU: { color: 'green', text: '菜单' },
          BUTTON: { color: 'orange', text: '按钮' },
          API: { color: 'purple', text: '接口' },
        };
        const config = typeMap[type as keyof typeof typeMap] || typeMap.MENU;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge 
          status={status === 'ACTIVE' ? 'success' : 'default'} 
          text={status === 'ACTIVE' ? '启用' : '禁用'}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEditPermission(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个权限吗？"
              onConfirm={() => handleDeletePermission(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    loadPermissionTree();
    loadPermissionList();
  }, []);

  return (
    <div className="p-4">
      <Row gutter={[16, 16]}>
        {/* 左侧权限树 */}
        <Col xs={24} md={12}>
          <Card 
            title="权限树" 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreatePermission}
              >
                新增权限
              </Button>
            }
          >
            <div className="mb-4">
              <Space>
                <Input
                  placeholder="搜索权限名称"
                  style={{ width: 200 }}
                  value={filterWatch('module')}
                  onChange={(e) => resetFilter({ ...filterWatch(), module: e.target.value })}
                  onPressEnter={() => handleFilterSubmit(handleSearch)()}
                />
                <Button
                  icon={<SearchOutlined />}
                  type="primary"
                  onClick={() => handleFilterSubmit(handleSearch)()}
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
            </div>
            
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              onExpand={handleTreeExpand}
              onSelect={handleTreeSelect}
              showIcon
              blockNode
              className="border border-gray-200 rounded p-4"
            />
          </Card>
        </Col>

        {/* 右侧权限列表 */}
        <Col xs={24} md={12}>
          <Card 
            title="权限列表"
            extra={
              <Select
                placeholder="按类型筛选"
                style={{ width: 120 }}
                value={filterWatch('type')}
                onChange={(value) => {
                  resetFilter({ ...filterWatch(), type: value });
                  handleFilterSubmit(handleSearch)();
                }}
                allowClear
              >
                <Option value="MENU">菜单</Option>
                <Option value="BUTTON">按钮</Option>
                <Option value="API">接口</Option>
              </Select>
            }
          >
            <Table
              columns={columns}
              dataSource={listData}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              size="middle"
              scroll={{ y: 500 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 创建/编辑权限模态框 */}
      <Modal
        title={formMode === 'create' ? '新增权限' : '编辑权限'}
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        onOk={() => handleFormSubmit(handleFormSubmitInternal)()}
        width={600}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="权限名称" required>
                <Input
                  value={formControl._formValues.name}
                  onChange={(e) => setValue('name', e.target.value)}
                  placeholder="请输入权限名称"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="权限编码">
                <Input
                  value={formControl._formValues.code}
                  onChange={(e) => setValue('code', e.target.value)}
                  placeholder="请输入权限编码（英文）"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="权限类型" required>
                <Select
                  value={formControl._formValues.type}
                  onChange={(value) => setValue('type', value)}
                  placeholder="请选择权限类型"
                >
                  <Option value="MENU">菜单权限</Option>
                  <Option value="BUTTON">按钮权限</Option>
                  <Option value="API">接口权限</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="所属模块" required>
                <Input
                  value={formControl._formValues.module}
                  onChange={(e) => setValue('module', e.target.value)}
                  placeholder="请输入模块名称"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="父级权限">
            <Select
              value={formControl._formValues.parentId}
              onChange={(value) => setValue('parentId', value)}
              placeholder="请选择父级权限"
              allowClear
            >
              {parentPermissions.map(permission => (
                <Option key={permission.id} value={permission.id}>
                  {permission.name} ({permission.code || '无编码'})
                </Option>
              ))}
            </Select>
            <div className="mt-2 text-sm text-gray-500">
              提示：选择父级权限可以创建层级结构，留空则为顶级权限
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;