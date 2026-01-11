/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Statistic,
  Modal,
  Popconfirm,
  Tooltip,
  Tree,
  Typography,
  Breadcrumb,
  message,
  Descriptions,
  Badge
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PlusOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  CopyOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { globalMessage } from '../../../../utils/globalMessage';
import * as api from '../../../../services/api';
import type { CategoryResponse, CategoryStatus } from '../../../../services/api-type';

const { Text } = Typography;
const { Option } = Select;
const { DirectoryTree } = Tree;

// 模拟数据生成函数 - 添加更多字段以匹配实际数据库设计
const generateMockCategories = (): CategoryResponse[] => {
  const categories: CategoryResponse[] = [];
  const statuses: CategoryStatus[] = ['启用', '禁用'];
  
  // 一级分类（专区）
  const level1Names = [
    '笔记本专区', '游戏本专区', '商务本专区', '轻薄本专区',
    '台式机专区', '一体机专区', '工作站专区', '服务器专区',
    '配件专区', '外设专区', '软件专区', '服务专区'
  ];
  
  // 二级分类
  const level2Names = [
    '入门级', '性能级', '旗舰级', '定制版',
    '学生版', '企业版', '教育版', '政府版'
  ];
  
  let id = 1;
  
  // 生成一级分类
  level1Names.forEach((name, index) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    categories.push({
      category_id: `cat_${id.toString().padStart(3, '0')}`,
      name,
      code: `ZONE${(index + 1).toString().padStart(2, '0')}`,
      parent_id: null,
      status,
      updated_at: null,
      created_at: ''
    });
    id++;
    
    // 为每个一级分类生成2-3个二级分类
    const subCount = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < subCount; j++) {
      const subStatus = statuses[Math.floor(Math.random() * statuses.length)];
      categories.push({
        category_id: `cat_${id.toString().padStart(3, '0')}`,
        name: `${name} - ${level2Names[Math.floor(Math.random() * level2Names.length)]}`,
        code: `ZONE${(index + 1).toString().padStart(2, '0')}_SUB${(j + 1).toString().padStart(2, '0')}`,
        parent_id: `cat_${(id - 1).toString().padStart(3, '0')}`,
        status: subStatus,
        updated_at: null,
        created_at: ''
      });
      id++;
    }
  });
  
  return categories;
};

const ZoneListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CategoryResponse[]>([]);
  const [filteredData, setFilteredData] = useState<CategoryResponse[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentViewCategory, setCurrentViewCategory] = useState<CategoryResponse | null>(null);

  // 加载数据
  const loadData = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      const response = await api.getCategories(filters.status);
      let categories = response || []; // 修改这里：直接使用response，而不是response?.data
      
      if (categories.length === 0) {
        console.log('使用模拟专区数据');
        categories = generateMockCategories();
      }
      
      setData(categories);
      applyFilters(categories, filters);
      
      // 构建树形数据
      buildTreeData(categories);
    } catch (error) { 
      console.log('API调用失败，使用模拟数据');
      const mockCategories = generateMockCategories();
      setData(mockCategories);
      applyFilters(mockCategories, filters);
      buildTreeData(mockCategories);
    } finally { 
      setLoading(false); 
    }
  }, []);

  // 构建树形数据
  const buildTreeData = (categories: CategoryResponse[]) => {
    const categoryMap = new Map();
    const treeNodes: any[] = [];
    
    // 创建所有节点的映射
    categories.forEach(category => {
      categoryMap.set(category.category_id, {
        key: category.category_id,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ marginRight: 8 }}>{category.name}</span>
              <Tag color={category.status === '启用' ? 'success' : 'default'} style={{ fontSize: 10 }}>
                {category.status}
              </Tag>
            </div>
            <Space size="small">
              <Text type="secondary" style={{ fontSize: 11 }}>{category.code}</Text>
              <Button 
                type="text" 
                size="small" 
                icon={<EditOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/goods/zone/edit/${category.category_id}`);
                }}
              />
            </Space>
          </div>
        ),
        icon: category.parent_id ? <FolderOutlined /> : <FolderOpenOutlined />,
        isLeaf: !categories.some(c => c.parent_id === category.category_id),
        data: category,
        children: []
      });
    });
    
    // 构建树结构
    categoryMap.forEach((node, id) => {
      const category = categories.find(c => c.category_id === id);
      if (category?.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(node);
          parent.isLeaf = false;
        }
      } else {
        treeNodes.push(node);
      }
    });
    
    setTreeData(treeNodes);
  };

  // 应用过滤条件
  const applyFilters = (categories: CategoryResponse[], filters: any) => {
    let filtered = [...categories];
    
    if (filters.status) {
      filtered = filtered.filter(cat => cat.status === filters.status);
    }
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(keyword) || 
        cat.code.toLowerCase().includes(keyword)
      );
    }
    
    setFilteredData(filtered);
  };

  // 搜索处理
  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      applyFilters(data, { status: searchStatus });
      setLoading(false);
    }, 300);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchKeyword('');
    setSearchStatus('');
    applyFilters(data, {});
  };

  // 单行删除
  const handleDelete = async (id: string) => {
    try {
      // 找到要删除的专区
      const categoryToDelete = data.find(cat => cat.category_id === id);
      if (!categoryToDelete) return;
      
      // 获取所有需要更新的分类ID（包括所有子级）
      const idsToUpdate: string[] = [id];
      
      // 递归获取所有子级ID
      const getAllChildrenIds = (parentId: string): string[] => {
        const children = data.filter(cat => cat.parent_id === parentId);
        const childIds: string[] = [];
        children.forEach(child => {
          childIds.push(child.category_id);
          childIds.push(...getAllChildrenIds(child.category_id));
        });
        return childIds;
      };
      
      // 如果是父级分类，获取所有子级ID
      const isParentCategory = data.some(cat => cat.parent_id === id);
      if (isParentCategory) {
        const childrenIds = getAllChildrenIds(id);
        idsToUpdate.push(...childrenIds);
      }
      
      // 去重
      const uniqueIds = Array.from(new Set(idsToUpdate));
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      globalMessage.success(`已禁用${uniqueIds.length}个专区`);
      
      // 更新状态
      setData(prev => prev.map(cat => 
        uniqueIds.includes(cat.category_id) 
          ? { ...cat, status: '禁用' as CategoryStatus } 
          : cat
      ));
    } catch (err) { 
      message.error('操作失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    
    // 获取所有要删除的分类ID（包括子级）
    const idsToUpdate: string[] = [];
    
    const getAllChildrenIds = (parentId: string): string[] => {
      const children = data.filter(cat => cat.parent_id === parentId);
      const childIds: string[] = [];
      children.forEach(child => {
        childIds.push(child.category_id);
        childIds.push(...getAllChildrenIds(child.category_id));
      });
      return childIds;
    };
    
    // 遍历选中的分类
    selectedRowKeys.forEach(categoryId => {
      idsToUpdate.push(categoryId as string);
      
      // 如果是父级分类，获取所有子级ID
      const isParentCategory = data.some(cat => cat.parent_id === categoryId);
      if (isParentCategory) {
        const childrenIds = getAllChildrenIds(categoryId as string);
        idsToUpdate.push(...childrenIds);
      }
    });
    
    // 去重
    const uniqueIds = Array.from(new Set(idsToUpdate));
    
    Modal.confirm({
      title: `确定禁用这${uniqueIds.length}个专区吗？`,
      content: '禁用的专区将不在前台展示，同时其所有子分类也会被禁用。',
      okText: '确认禁用',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          globalMessage.success(`成功禁用 ${uniqueIds.length} 个专区`);
          
          // 更新状态
          setData(prev => prev.map(cat => 
            uniqueIds.includes(cat.category_id) 
              ? { ...cat, status: '禁用' as CategoryStatus } 
              : cat
          ));
          setSelectedRowKeys([]);
        } catch (err) { 
          message.error('操作失败');
        }
      }
    });
  };

  // 查看专区详情
  const handleViewCategory = (category: CategoryResponse) => {
    setCurrentViewCategory(category);
    setViewModalVisible(true);
  };

  // 复制专区编码
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        message.success(`已复制编码: ${code}`);
      })
      .catch(() => {
        message.error('复制失败');
      });
  };

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  useEffect(() => {
    applyFilters(data, { status: searchStatus });
  }, [data, searchKeyword, searchStatus]);

  // 表格列定义 - 添加查看按钮
  const columns: ColumnsType<CategoryResponse> = [
    { 
      title: '专区名称', 
      dataIndex: 'name', 
      key: 'name', 
      width: 200,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: 11, color: '#999' }}>
            {record.parent_id ? '子分类' : '主分类'} · {record.code}
          </div>
        </div>
      ) 
    },
    { 
      title: '层级', 
      key: 'level', 
      width: 100,
      render: (_, record) => (
        <Tag color={record.parent_id ? 'blue' : 'purple'} style={{ fontSize: 11 }}>
          {record.parent_id ? '二级分类' : '一级专区'}
        </Tag>
      ) 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: (status: CategoryStatus, record) => {
        const isEnabled = status === '启用';
        const text = isEnabled ? '启用' : '禁用';
        const color = isEnabled ? 'success' : 'default';
        
        return (
          <Space>
            <Tag 
              color={color} 
              style={{ fontSize: 11, cursor: 'pointer' }}
              onClick={() => handleToggleStatus(record.category_id, record.status)}
            >
              {text}
            </Tag>
          </Space>
        );
      }
    },
    { 
      title: '父级专区', 
      key: 'parent', 
      width: 120,
      render: (_, record) => {
        if (!record.parent_id) return '-';
        const parent = data.find(cat => cat.category_id === record.parent_id);
        return parent ? (
          <Text type="secondary" style={{ fontSize: 11 }}>
            {parent.name}
          </Text>
        ) : '-';
      } 
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewCategory(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Link 
              to={{
                pathname: `/goods/zone/edit/${record.category_id}`,
                state: { from: window.location.pathname + window.location.search }
              } as any} // 使用类型断言解决state类型问题
            >
              <Button type="text" size="small" icon={<EditOutlined />} />
            </Link>
          </Tooltip>
          <Popconfirm 
            title="确定禁用该专区吗？" 
            onConfirm={() => handleDelete(record.category_id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 添加状态切换函数
  const handleToggleStatus = async (id: string, currentStatus: CategoryStatus) => {
    const newStatus: CategoryStatus = currentStatus === '启用' ? '禁用' : '启用';
    
    // 获取所有需要更新的分类ID（包括所有子级）
    const idsToUpdate: string[] = [id];
    
    // 递归获取所有子级ID
    const getAllChildrenIds = (parentId: string): string[] => {
      const children = data.filter(cat => cat.parent_id === parentId);
      const childIds: string[] = [];
      children.forEach(child => {
        childIds.push(child.category_id);
        childIds.push(...getAllChildrenIds(child.category_id));
      });
      return childIds;
    };
    
    // 如果是父级分类，获取所有子级ID
    const isParentCategory = data.some(cat => cat.parent_id === id);
    if (isParentCategory) {
      const childrenIds = getAllChildrenIds(id);
      idsToUpdate.push(...childrenIds);
    }
    
    // 去重
    const uniqueIds = Array.from(new Set(idsToUpdate));
    
    const action = newStatus === '启用' ? '启用' : '禁用';
    
    Modal.confirm({
      title: `确定${action}这${uniqueIds.length}个专区吗？`,
      content: isParentCategory 
        ? `这是一个${action}操作，将同时${action}所有子分类。`
        : `确定${action}这个专区吗？`,
      okText: `确认${action}`,
      okType: newStatus === '启用' ? 'primary' : 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          globalMessage.success(`${action}成功`);
          
          // 更新状态
          setData(prev => prev.map(cat => 
            uniqueIds.includes(cat.category_id) 
              ? { ...cat, status: newStatus } 
              : cat
          ));
        } catch (err) { 
          message.error('操作失败');
        }
      }
    });
  };

  // 获取统计信息
  const getStats = () => {
    const total = data.length;
    const enabled = data.filter(cat => cat.status === '启用').length;
    const disabled = data.filter(cat => cat.status === '禁用').length;
    const level1 = data.filter(cat => !cat.parent_id).length;
    const level2 = data.filter(cat => !!cat.parent_id).length;
    
    return { total, enabled, disabled, level1, level2 };
  };

  const stats = getStats();

  return (
    <div style={{ padding: 16, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 面包屑 */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link to="/goods/brand-zone">品牌·专区</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>专区管理</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col flex="1">
          <Card size="small" bordered={false} style={{ height: '100%' }}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>专区总数</span>} 
              value={stats.total} 
              prefix={<ApartmentOutlined />} 
              valueStyle={{ color: '#1890ff', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col flex="1">
          <Card size="small" bordered={false} style={{ height: '100%' }}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>启用中</span>} 
              value={stats.enabled} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col flex="1">
          <Card size="small" bordered={false} style={{ height: '100%' }}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>禁用</span>} 
              value={stats.disabled} 
              prefix={<InfoCircleOutlined />} 
              valueStyle={{ color: '#ff4d4f', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col flex="1">
          <Card size="small" bordered={false} style={{ height: '100%' }}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>一级专区</span>} 
              value={stats.level1} 
              prefix={<FolderOpenOutlined />} 
              valueStyle={{ color: '#722ed1', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col flex="1">
          <Card size="small" bordered={false} style={{ height: '100%' }}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>子分类</span>} 
              value={stats.level2} 
              prefix={<FolderOutlined />} 
              valueStyle={{ color: '#fa8c16', fontSize: 20 }} 
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索 + 批量操作 */}
      <Card size="small" bordered={false} style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" style={{ width: '100%' }}>
          <Col>
            <Space size="small">
              <Link 
                to={{
                  pathname: "/goods/zone/create",
                  state: { from: window.location.pathname + window.location.search }
                } as any} // 使用类型断言解决state类型问题
              >
                <Button type="primary" size="small" icon={<PlusOutlined />}>
                  新增专区
                </Button>
              </Link>
              <Popconfirm 
                title={`确定禁用 ${selectedRowKeys.length} 个专区吗？`} 
                onConfirm={handleBatchDelete} 
                disabled={selectedRowKeys.length === 0}
              >
                <Button 
                  danger 
                  size="small" 
                  disabled={selectedRowKeys.length === 0} 
                  icon={<DeleteOutlined />}
                >
                  批量禁用
                </Button>
              </Popconfirm>
            </Space>
          </Col>
          <Col>
            <Space size="small">
              <Input 
                placeholder="专区名称/编码" 
                size="small" 
                style={{ width: 150, fontSize: 12 }}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
              />
              <Select 
                placeholder="状态"
                size="small" 
                style={{ width: 100, fontSize: 12 }}
                value={searchStatus}
                onChange={(value) => setSearchStatus(value)}
                allowClear
              >
                <Option value="">全部</Option>
                <Option value="启用">启用</Option>
                <Option value="禁用">禁用</Option>
              </Select>
              <Button 
                type="primary" 
                size="small" 
                icon={<SearchOutlined />} 
                onClick={handleSearch}
              >
                查询
              </Button>
              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 内容区域：左侧树 + 右侧表格 */}
      <Row gutter={16}>
        {/* 左侧树形结构 */}
        <Col xs={24} md={8}>
          <Card 
            size="small" 
            bordered={false}
            title={
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                <ApartmentOutlined style={{ marginRight: 8 }} />
                专区结构树
              </div>
            }
            style={{ height: '100%' }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <DirectoryTree
              treeData={treeData}
              defaultExpandAll
              onSelect={(_keys: React.Key[], { node }: any) => {
                if (node.data) {
                  setSelectedCategory(node.data);
                  setSearchKeyword(node.data.name);
                }
              }}
              style={{ fontSize: 13 }}
            />
          </Card>
        </Col>

        {/* 右侧表格 */}
        <Col xs={24} md={16}>
          <Card size="small" bordered={false} style={{ height: '100%' }}>
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="category_id"
              loading={loading}
              size="small"
              rowSelection={{ 
                selectedRowKeys, 
                onChange: (keys) => setSelectedRowKeys(keys) 
              }}
              scroll={{ x: 750 }}
              pagination={{
                showTotal: (total) => `共 ${total} 条`,
                showSizeChanger: true,
                showQuickJumper: true,
                size: 'small',
                pageSizeOptions: ['10', '20', '50', '100']
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 专区详情查看模态框 */}
      <Modal 
        title="专区详细信息" 
        open={viewModalVisible} 
        onCancel={() => setViewModalVisible(false)} 
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
          currentViewCategory && (
            <Button 
              key="edit" 
              type="primary" 
              onClick={() => {
                setViewModalVisible(false);
                navigate(`/goods/zone/edit/${currentViewCategory.category_id}`);
              }}
            >
              编辑专区
            </Button>
          )
        ]} 
        width={600}
      >
        {currentViewCategory && (
          <Descriptions 
            bordered 
            size="small" 
            column={1} 
            labelStyle={{ width: '120px', fontSize: '12px', fontWeight: 500 }} 
            contentStyle={{ fontSize: '12px' }}
          >
            <Descriptions.Item label="专区名称">
              <Text strong>{currentViewCategory.name}</Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="专区编码">
              <Space>
                <Text>{currentViewCategory.code}</Text>
                <Button 
                  type="text" 
                  size="small" 
                  icon={<CopyOutlined />} 
                  onClick={() => handleCopyCode(currentViewCategory.code)}
                />
              </Space>
            </Descriptions.Item>
            
            <Descriptions.Item label="专区ID">
              <Space>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {currentViewCategory.category_id}
                </Text>
                <Button 
                  type="text" 
                  size="small" 
                  icon={<CopyOutlined />} 
                  onClick={() => handleCopyCode(currentViewCategory.category_id)}
                />
              </Space>
            </Descriptions.Item>
            
            <Descriptions.Item label="状态">
              <Badge 
                status={currentViewCategory.status === '启用' ? 'success' : 'default'} 
                text={currentViewCategory.status}
              />
            </Descriptions.Item>
            
            <Descriptions.Item label="层级类型">
              <Tag color={currentViewCategory.parent_id ? 'blue' : 'purple'}>
                {currentViewCategory.parent_id ? '二级分类' : '一级专区'}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="父级专区">
              {currentViewCategory.parent_id ? (
                <div>
                  {(() => {
                    const parent = data.find(cat => cat.category_id === currentViewCategory.parent_id);
                    return parent ? (
                      <div>
                        <Text>{parent.name}</Text>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          编码: {parent.code}
                        </div>
                      </div>
                    ) : '未知父级';
                  })()}
                </div>
              ) : (
                <Text type="secondary">无（一级专区）</Text>
              )}
            </Descriptions.Item>
            
            <Descriptions.Item label="创建信息">
              <Space direction="vertical" size={0}>
                <Space>
                  <UserOutlined style={{ color: '#999', fontSize: '12px' }} />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    创建者: admin
                  </Text>
                </Space>
                <Space>
                  <CalendarOutlined style={{ color: '#999', fontSize: '12px' }} />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    创建时间: {dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm')}
                  </Text>
                </Space>
              </Space>
            </Descriptions.Item>
            
            <Descriptions.Item label="关联商品数">
              <Badge 
                count={Math.floor(Math.random() * 50) + 5} 
                style={{ backgroundColor: '#1890ff' }}
              />
              <Text type="secondary" style={{ marginLeft: 8, fontSize: '11px' }}>
                个商品
              </Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="专区说明">
              {currentViewCategory.parent_id ? (
                <Text type="secondary">
                  这是{data.find(cat => cat.category_id === currentViewCategory.parent_id)?.name || '未知专区'}下的子分类，
                  用于更精细的商品分类管理。
                </Text>
              ) : (
                <Text type="secondary">
                  这是一级商品专区，用于组织和管理特定类型的商品集合。
                </Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
        
        {/* 操作提示 */}
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', borderRadius: 4 }}>
          <Space>
            <InfoCircleOutlined style={{ color: '#52c41a' }} />
            <Text type="success" style={{ fontSize: '12px' }}>
              提示：专区是商品分类的基础，合理的专区设置有助于用户快速找到所需商品。
            </Text>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default ZoneListPage;