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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import { 
  getPermissionTree, 
  getPermissionList,
  createPermission,
  updatePermission,
  deletePermission,
  type Permission,
} from '../../../services/user';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';

const { Option } = Select;

interface FilterFormValues {
  type?: string;
  module?: string;
}

interface PermissionFormValues {
  name: string;
  code?: string;
  type: 'MENU' | 'BUTTON' | 'API';
  module: string;
  parentId?: string;
}

const PermissionManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [listData, setListData] = useState<Permission[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [parentPermissions, setParentPermissions] = useState<Permission[]>([]);
  
  // 筛选表单和权限表单
  const [filterForm] = Form.useForm<FilterFormValues>();
  const [permissionForm] = Form.useForm<PermissionFormValues>();

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
  const loadPermissionList = async (params?: FilterFormValues) => {
    try {
      const data = await getPermissionList(params);
      console.log('🔍 权限列表原始数据:', data);
      console.log('🔍 第一条数据类型字段:', data[0]?.type, '类型:', typeof data[0]?.type);
      setListData(data);
      
      // 所有权限都可以作为父级（包括MENU、BUTTON、API）
      setParentPermissions(data);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 转换权限数据为树节点
  const convertPermissionsToTreeNodes = (permissions: Permission[]): DataNode[] => {
    return permissions.map(permission => ({
      key: permission.id,
      title: (
        <div className="flex items-center justify-between" style={{ width: '100%' }}>
          <div className="flex items-center">
            {permission.type === 'MENU' && <MenuOutlined className="mr-2" />}
            {permission.type === 'BUTTON' && <AppstoreOutlined className="mr-2" />}
            {permission.type === 'API' && <ApiOutlined className="mr-2" />}
            <span className="mr-2">{permission.name}</span>
            <Tag color={
              permission.type === 'MENU' ? 'green' :
              permission.type === 'BUTTON' ? 'orange' : 'purple'
            }>
              {permission.type === 'MENU' ? '菜单' :
               permission.type === 'BUTTON' ? '按钮' : '接口'}
            </Tag>
          </div>
          <Space size={4}>
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
                description="删除后无法恢复，请谨慎操作"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  handleDeletePermission(permission.id);
                }}
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
      ),
      children: permission.children && permission.children.length > 0 
        ? convertPermissionsToTreeNodes(permission.children) 
        : undefined,
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
  const handleSearch = () => {
    const values = filterForm.getFieldsValue();
    loadPermissionList(values);
  };

  // 重置筛选
  const handleReset = () => {
    filterForm.resetFields();
    loadPermissionList();
  };

  // 处理树节点选择
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    setSelectedKeys(selectedKeys);
  };

  // 处理树节点展开
  const handleTreeExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys);
  };

  // 打开创建权限模态框
  const handleCreatePermission = () => {
    setFormMode('create');
    setEditingPermissionId(null);
    permissionForm.resetFields();
    
    // 如果有选中的节点，设置为父级
    if (selectedKeys.length > 0) {
      permissionForm.setFieldsValue({ parentId: selectedKeys[0] as string });
    }
    
    setFormModalVisible(true);
  };

  // 打开编辑权限模态框
  const handleEditPermission = (permission: Permission) => {
    console.log('编辑权限:', permission);
    setFormMode('edit');
    setEditingPermissionId(permission.id);
    permissionForm.setFieldsValue({
      name: permission.name,
      type: permission.type,
      module: permission.module,
      parentId: permission.parentId || undefined,
    });
    setFormModalVisible(true);
  };

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await permissionForm.validateFields();
      
      console.log('表单提交 - 模式:', formMode);
      console.log('表单提交 - 编辑ID:', editingPermissionId);
      console.log('表单提交 - 数据:', values);
      
      if (formMode === 'create') {
        const result = await createPermission(values);
        console.log('创建成功:', result);
        globalMessage.success('权限创建成功');
      } else {
        // 编辑模式
        if (!editingPermissionId) {
          console.error('编辑模式但没有权限ID');
          globalMessage.error('未找到要编辑的权限ID');
          return;
        }
        await updatePermission(editingPermissionId, values);
        console.log('更新成功');
        globalMessage.success('权限更新成功');
      }
      
      setFormModalVisible(false);
      setEditingPermissionId(null);
      permissionForm.resetFields();
      await loadPermissionTree();
      await loadPermissionList();
    } catch (error: unknown) {
      console.error('表单提交错误:', error);
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误
        return;
      }
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 删除权限
  const handleDeletePermission = async (permissionId: string) => {
    console.log('删除权限:', permissionId);
    try {
      await deletePermission(permissionId);
      globalMessage.success('权限删除成功');
      await loadPermissionTree();
      await loadPermissionList();
    } catch (error) {
      console.error('删除权限错误:', error);
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string, record) => {
        console.log('🎨 渲染类型列:', { type, record_name: record.name, record_type: record.type });
        const typeMap: Record<string, { color: string; text: string }> = {
          MENU: { color: 'green', text: '菜单' },
          BUTTON: { color: 'orange', text: '按钮' },
          API: { color: 'purple', text: '接口' },
        };
        const config = typeMap[type] || typeMap['MENU'];
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
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button 
              type="link" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditPermission(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个权限吗？"
              description="删除后无法恢复"
              onConfirm={() => handleDeletePermission(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="link" 
                size="small"
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
    const initData = async () => {
      await loadPermissionTree();
      await loadPermissionList();
    };
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <Row gutter={[16, 16]} style={{ flex: 1, overflow: 'hidden' }}>
        {/* 左侧权限树 */}
        <Col xs={24} md={10} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ marginBottom: '16px', flexShrink: 0 }}>
              <Form form={filterForm} layout="inline">
                <Form.Item name="module" style={{ marginBottom: 0 }}>
                  <Input
                    placeholder="搜索权限名称"
                    style={{ width: 200 }}
                    onPressEnter={handleSearch}
                  />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    icon={<SearchOutlined />}
                    type="primary"
                    onClick={handleSearch}
                  >
                    搜索
                  </Button>
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                  >
                    重置
                  </Button>
                </Form.Item>
              </Form>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '16px', maxHeight: 'calc(100vh - 300px)' }}>
              <Tree
                treeData={treeData}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                onExpand={handleTreeExpand}
                onSelect={handleTreeSelect}
                showIcon
                blockNode
              />
            </div>
          </Card>
        </Col>

        {/* 右侧权限列表 */}
        <Col xs={24} md={14} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card 
            title="权限列表"
            extra={
              <Form.Item name="type" noStyle>
                <Select
                  placeholder="按类型筛选"
                  style={{ width: 120 }}
                  onChange={(value) => {
                    filterForm.setFieldsValue({ type: value });
                    handleSearch();
                  }}
                  allowClear
                >
                  <Option value="MENU">菜单</Option>
                  <Option value="BUTTON">按钮</Option>
                  <Option value="API">接口</Option>
                </Select>
              </Form.Item>
            }
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: '8px' }}
            bodyStyle={{ flex: 1, overflow: 'hidden', padding: '16px' }}
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
              scroll={{ y: 'calc(100vh - 320px)', x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 创建/编辑权限模态框 */}
      <Modal
        title={formMode === 'create' ? '新增权限' : '编辑权限'}
        open={formModalVisible}
        onCancel={() => {
          setFormModalVisible(false);
          setEditingPermissionId(null);
          permissionForm.resetFields();
        }}
        onOk={handleFormSubmit}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={permissionForm} layout="vertical">
          <Form.Item 
            label="权限名称" 
            name="name"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="请输入权限名称" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="权限类型" 
                name="type"
                rules={[{ required: true, message: '请选择权限类型' }]}
              >
                <Select placeholder="请选择权限类型">
                  <Option value="MENU">菜单权限</Option>
                  <Option value="BUTTON">按钮权限</Option>
                  <Option value="API">接口权限</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="所属模块" 
                name="module"
                rules={[{ required: true, message: '请输入模块名称' }]}
                tooltip="模块名称用于分组管理权限，如：system、product、order 等"
              >
                <Input 
                  placeholder="如: system, product, order" 
                  onChange={(e) => {
                    // 自动转换为小写
                    const value = e.target.value.toLowerCase();
                    permissionForm.setFieldValue('module', value);
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="父级权限" name="parentId">
            <Select
              placeholder="请选择父级权限（可选）"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {parentPermissions.map(permission => {
                const typeText = permission.type === 'MENU' ? '菜单' : 
                                permission.type === 'BUTTON' ? '按钮' : '接口';
                const typeIcon = permission.type === 'MENU' ? '📁' : 
                                permission.type === 'BUTTON' ? '🔘' : '⚡';
                return (
                  <Option 
                    key={permission.id} 
                    value={permission.id}
                    label={`${permission.name} [${typeText}] ${permission.module}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {typeIcon} {permission.name}
                      </span>
                      <span className="text-gray-400 text-xs ml-2">
                        [{typeText}] {permission.module}
                      </span>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          
          <div className="text-sm text-gray-500">
            提示：选择父级权限可以创建层级结构，留空则为顶级权限。所有类型的权限都可以作为父级。
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;