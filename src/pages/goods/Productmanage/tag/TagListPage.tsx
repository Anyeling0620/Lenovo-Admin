/* eslint-disable react-hooks/exhaustive-deps */ 
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
  Typography,
  message,
  Descriptions,
  Alert
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PlusOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

// API
import { 
  getTags, 
  deleteTag
} from '../../../../services/api';
import type { TagResponse } from '../../../../services/api-type';

const { Text } = Typography;
const { Option } = Select;

// 创建一个工具函数来构建路由状态
const buildRouteState = (location: any) => {
  return { 
    from: location.pathname + location.search 
  };
};

const TagListPage: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TagResponse[]>([]);
  const [filteredData, setFilteredData] = useState<TagResponse[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentTag, setCurrentTag] = useState<TagResponse | null>(null);
  
  // 搜索和过滤
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 加载数据
  const loadData = useCallback(async (status?: string) => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      const response = await getTags(status);
      
      if (response && Array.isArray(response)) {
        setData(response);
        applyFilters(response, status);
      } else {
        setData([]);
        setFilteredData([]);
        message.warning('暂无标签数据');
      }
    } catch (error: any) {
      console.error('Error loading tags:', error);
      const errorMsg = error?.response?.data?.message || '获取标签列表失败';
      setErrorMessage(errorMsg);
      message.error(errorMsg);
      setData([]);
      setFilteredData([]);
    } finally { 
      setLoading(false); 
    }
  }, []);

  // 应用过滤条件
  const applyFilters = (tags: TagResponse[], status?: string) => {
    let filtered = [...tags];
    
    if (status) {
      filtered = filtered.filter(tag => tag.status === status);
    }
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(keyword) || 
        (tag.remark && tag.remark.toLowerCase().includes(keyword))
      );
    }
    
    // 按优先级排序
    filtered.sort((a, b) => a.priority - b.priority);
    
    setFilteredData(filtered);
  };

  // 搜索处理
  const handleSearch = () => {
    applyFilters(data, searchStatus || undefined);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchKeyword('');
    setSearchStatus('');
    applyFilters(data);
  };

  // 单行删除
  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id);
      message.success('标签已删除');
      
      // 更新本地数据
      setData(prev => prev.filter(tag => tag.tag_id !== id));
      setFilteredData(prev => prev.filter(tag => tag.tag_id !== id));
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      const errorMsg = error?.response?.data?.message || '删除标签失败';
      message.error(errorMsg);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    
    try {
      // 批量删除标签
      const deletePromises = selectedRowKeys.map(id => deleteTag(String(id)));
      await Promise.all(deletePromises);
      
      message.success(`成功删除 ${selectedRowKeys.length} 个标签`);
      
      // 更新本地数据
      setData(prev => prev.filter(tag => !selectedRowKeys.includes(tag.tag_id)));
      setFilteredData(prev => prev.filter(tag => !selectedRowKeys.includes(tag.tag_id)));
      setSelectedRowKeys([]);
    } catch (error: any) {
      console.error('Error batch deleting tags:', error);
      const errorMsg = error?.response?.data?.message || '批量删除标签失败';
      message.error(errorMsg);
    }
  };

  useEffect(() => { 
    loadData();
  }, [loadData]);

  useEffect(() => {
    applyFilters(data, searchStatus || undefined);
  }, [data, searchKeyword, searchStatus]);

  // 表格列定义
  const columns: any[] = [
    { 
      title: '标签名称', 
      dataIndex: 'name', 
      key: 'name', 
      width: 150,
      render: (text: string) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '12px' }}>{text}</div>
        </div>
      ) 
    },
    { 
      title: '优先级', 
      dataIndex: 'priority', 
      key: 'priority', 
      width: 80,
      sorter: (a: TagResponse, b: TagResponse) => a.priority - b.priority,
      render: (priority: number) => (
        <div style={{ textAlign: 'center' }}>
          <Tag color="blue" style={{ fontSize: '11px', minWidth: 24 }}>
            {priority}
          </Tag>
        </div>
      ) 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 80, 
      render: (status: string) => {
        const color = status === '启用' ? 'success' : 'default';
        const icon = status === '启用' ? <CheckCircleOutlined /> : <StopOutlined />;
        return (
          <Tag color={color} style={{ fontSize: '11px' }}>
            {icon} {status}
          </Tag>
        );
      } 
    },
    { 
      title: '备注', 
      dataIndex: 'remark', 
      key: 'remark', 
      width: 150,
      render: (remark: string) => (
        <div style={{ fontSize: '11px', color: remark ? '#faad14' : '#d9d9d9' }}>
          {remark || '-'}
        </div>
      ) 
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: TagResponse) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => {
                setCurrentTag(record);
                setDetailModalVisible(true);
              }} 
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Link 
              to={`/goods/tag/edit/${record.tag_id}`}
              state={buildRouteState(location)}
            >
              <Button 
                type="text" 
                size="small" 
                icon={<EditOutlined />}
              />
            </Link>
          </Tooltip>
          <Popconfirm 
            title="确定删除该标签吗？" 
            description="删除后可能影响关联商品的标签展示"
            onConfirm={() => handleDelete(record.tag_id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="text" 
              size="small" 
              danger 
              icon={<DeleteOutlined />} 
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 获取统计信息
  const getStats = () => {
    const total = data.length;
    const enabled = data.filter(tag => tag.status === '启用').length;
    const disabled = data.filter(tag => tag.status === '禁用').length;
    
    return { total, enabled, disabled };
  };

  const stats = getStats();

  return (
    <div style={{ padding: 16, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 错误提示 */}
      {errorMessage && (
        <Alert
          message="加载失败"
          description={errorMessage}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => loadData()}>
              重试
            </Button>
          }
        />
      )}

      {/* 统计卡片 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>标签总数</span>} 
              value={stats.total} 
              prefix={<TagsOutlined />} 
              valueStyle={{ color: '#1890ff', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>启用中</span>} 
              value={stats.enabled} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>禁用</span>} 
              value={stats.disabled} 
              prefix={<StopOutlined />} 
              valueStyle={{ color: '#ff4d4f', fontSize: 20 }} 
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索 + 批量操作 */}
      <Card size="small" bordered={false} style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="small">
              <Link 
                to="/goods/tag/create"
                state={buildRouteState(location)}
              >
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                >
                  新增标签
                </Button>
              </Link>
              <Popconfirm 
                title={`确定删除选中的 ${selectedRowKeys.length} 个标签吗？`} 
                description="此操作不可恢复"
                onConfirm={handleBatchDelete} 
                disabled={selectedRowKeys.length === 0}
                okText="确认删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button 
                  danger 
                  size="small" 
                  disabled={selectedRowKeys.length === 0} 
                  icon={<DeleteOutlined />}
                >
                  批量删除 ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            </Space>
          </Col>
          <Col>
            <Space size="small">
              <Input 
                placeholder="标签名称/备注" 
                size="small" 
                style={{ width: 150, fontSize: 12 }}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
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

      {/* 表格 */}
      <Card size="small" bordered={false}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="tag_id"
          loading={loading}
          size="small"
          rowSelection={{ 
            selectedRowKeys, 
            onChange: (keys) => setSelectedRowKeys(keys) 
          }}
          scroll={{ x: 900 }}
          pagination={{
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
            size: 'small',
            pageSizeOptions: ['10', '20', '50', '100'],
            defaultPageSize: 10
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal 
        title="标签详情" 
        open={detailModalVisible} 
        onCancel={() => setDetailModalVisible(false)} 
        footer={null}
        width={500}
      >
        {currentTag && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="标签名称">
              <Text strong>{currentTag.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="标签ID">
              <Text copyable code style={{ fontSize: 12 }}>{currentTag.tag_id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color="blue">{currentTag.priority}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentTag.status === '启用' ? 'success' : 'default'}>
                {currentTag.status === '启用' ? <CheckCircleOutlined /> : <StopOutlined />} 
                {currentTag.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="备注">
              {currentTag.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TagListPage;