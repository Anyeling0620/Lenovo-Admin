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
  Typography,
  InputNumber,
  Form,
  message,
  Badge,
  Divider,
  Descriptions
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
  EyeOutlined,
  CopyOutlined,
  SortAscendingOutlined,
  FireOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// API
import * as api from '../../../services/api';
import type { TagResponse, TagCreateRequest, TagUpdateRequest, TagStatus } from '../../../services/api-type';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';

const { Title, Text } = Typography;
const { Option } = Select;

// 模拟数据生成函数
const generateMockTags = (): TagResponse[] => {
  const tags: TagResponse[] = [];
  const statuses: TagStatus[] = ['启用', '禁用'];
  const tagNames = [
    '热销爆款', '新品上市', '限时秒杀', '联想推荐', '商务办公', 
    '游戏电竞', '轻薄便携', '高性能', '学生优选', '企业采购',
    '设计师专用', '程序员必备', '视频剪辑', '3D渲染', '便携出行',
    '超长续航', '高色域屏', '高刷新率', 'RTX显卡', '雷电接口',
    'WiFi6', '指纹识别', '面部识别', '背光键盘', '触摸屏'
  ];
  
  const priorities = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const creators = ['admin', 'system', 'tag_manager', 'product_admin'];
  
  for (let i = 1; i <= 30; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const name = tagNames[Math.floor(Math.random() * tagNames.length)];
    
    tags.push({
      tag_id: `tag_${i.toString().padStart(3, '0')}`,
      name: name + (i > 10 ? ` ${i}` : ''),
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status,
      remark: Math.random() > 0.5 ? '热门标签，需重点关注' : '普通标签',
      // 模拟字段
      created_at: dayjs().subtract(Math.floor(Math.random() * 365), 'day').toISOString(),
      creator_id: creators[Math.floor(Math.random() * creators.length)],
      product_count: Math.floor(Math.random() * 50) + 1
    });
  }
  
  return tags;
};

const TagListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TagResponse[]>([]);
  const [filteredData, setFilteredData] = useState<TagResponse[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 模态框状态
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentTag, setCurrentTag] = useState<TagResponse | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 搜索和过滤
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  
  // 表单
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载数据
  const loadData = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      const response = await api.getTags(filters.status);
      let tags = response?.data || [];
      
      if (tags.length === 0) {
        console.log('使用模拟标签数据');
        tags = generateMockTags();
      }
      
      setData(tags);
      applyFilters(tags, filters);
    } catch (error) { 
      console.log('API调用失败，使用模拟数据');
      const mockTags = generateMockTags();
      setData(mockTags);
      applyFilters(mockTags, filters);
      globalErrorHandler.handle(error, globalMessage.error);
    } finally { 
      setLoading(false); 
    }
  }, []);

  // 应用过滤条件
  const applyFilters = (tags: TagResponse[], filters: any) => {
    let filtered = [...tags];
    
    if (filters.status) {
      filtered = filtered.filter(tag => tag.status === filters.status);
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
    applyFilters(data, { status: searchStatus });
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
      // 模拟API调用
      await api.deleteTag(id);
      globalMessage.success('标签已删除');
      setData(prev => prev.filter(tag => tag.tag_id !== id));
    } catch (err) { 
      console.log('API调用失败，更新本地数据');
      setData(prev => prev.filter(tag => tag.tag_id !== id));
      globalMessage.success('标签已删除（本地演示）');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      // 模拟批量删除
      await Promise.all(selectedRowKeys.map(id => 
        api.deleteTag(String(id))
      ));
      globalMessage.success(`成功删除 ${selectedRowKeys.length} 个标签`);
      setData(prev => prev.filter(tag => !selectedRowKeys.includes(tag.tag_id)));
    } catch (err) { 
      console.log('API调用失败，更新本地数据');
      setData(prev => prev.filter(tag => !selectedRowKeys.includes(tag.tag_id)));
      globalMessage.success(`成功删除 ${selectedRowKeys.length} 个标签（本地演示）`);
    }
  };

  // 打开表单弹窗
  const openFormModal = (tag?: TagResponse) => {
    if (tag) {
      setEditingId(tag.tag_id);
      form.setFieldsValue({
        name: tag.name,
        priority: tag.priority,
        status: tag.status,
        remark: tag.remark || ''
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({
        priority: 5,
        status: '启用'
      });
    }
    setCurrentTag(tag || null);
    setFormModalVisible(true);
  };

  // 表单提交
  const handleFormSubmit = async () => {
    try {
      setIsSubmitting(true);
      const values = await form.validateFields();
      
      if (editingId) {
        // 编辑现有标签
        const formData: TagUpdateRequest = {
          name: values.name,
          priority: values.priority,
          status: values.status as TagStatus,
          remark: values.remark || undefined
        };
        
        try {
          await api.updateTag(editingId, formData);
          globalMessage.success('更新成功');
          setData(prev => prev.map(tag => 
            tag.tag_id === editingId ? { 
              ...tag, 
              ...formData,
              updated_at: new Date().toISOString()
            } : tag
          ));
        } catch (error) {
          console.log('API调用失败，更新本地数据');
          setData(prev => prev.map(tag => 
            tag.tag_id === editingId ? { 
              ...tag, 
              ...formData,
              updated_at: new Date().toISOString()
            } : tag
          ));
          globalMessage.success('更新成功（本地演示）');
        }
      } else {
        // 新增标签
        const formData: TagCreateRequest = {
          name: values.name,
          priority: values.priority,
          status: values.status as TagStatus,
          remark: values.remark || undefined
        };
        
        try {
          const response = await api.createTag(formData);
          globalMessage.success('新增成功');
          const newTag: TagResponse = {
            tag_id: response?.data?.tag_id || `tag_${Date.now()}`,
            ...formData,
            // 模拟字段
            created_at: new Date().toISOString(),
            creator_id: 'admin',
            product_count: 0
          };
          setData(prev => [newTag, ...prev]);
        } catch (error) {
          console.log('API调用失败，更新本地数据');
          const newTag: TagResponse = {
            tag_id: `tag_${Date.now()}`,
            ...formData,
            created_at: new Date().toISOString(),
            creator_id: 'admin',
            product_count: 0
          };
          setData(prev => [newTag, ...prev]);
          globalMessage.success('新增成功（本地演示）');
        }
      }
      
      setFormModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 复制标签名称
  const handleCopyName = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => message.success('已复制'))
      .catch(() => message.error('复制失败'));
  };

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  useEffect(() => {
    applyFilters(data, { status: searchStatus });
  }, [data, searchKeyword, searchStatus]);

  // 表格列定义
  const columns: any[] = [
    { 
      title: '标签名称', 
      dataIndex: 'name', 
      key: 'name', 
      width: 150,
      render: (text: string, record: TagResponse) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '12px' }}>{text}</div>
          <div style={{ fontSize: '10px', color: '#999' }}>
            关联商品: {(record as any).product_count || 0}
          </div>
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
      render: (status: TagStatus) => {
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
        <div style={{ fontSize: '11px', color: '#faad14' }}>
          {remark || '-'}
        </div>
      ) 
    },
    { 
      title: '创建者', 
      dataIndex: 'creator_id', 
      key: 'creator', 
      width: 80,
      render: (creator: string) => (
        <div style={{ fontSize: '11px' }}>
          {creator}
        </div>
      ) 
    },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      width: 120,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD') 
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
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => openFormModal(record)}
            />
          </Tooltip>
          <Popconfirm 
            title="确定删除该标签吗？" 
            onConfirm={() => handleDelete(record.tag_id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
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
              <Button 
                type="primary" 
                size="small" 
                icon={<PlusOutlined />}
                onClick={() => openFormModal()}
              >
                新增标签
              </Button>
              <Popconfirm 
                title={`确定删除 ${selectedRowKeys.length} 个标签吗？`} 
                onConfirm={handleBatchDelete} 
                disabled={selectedRowKeys.length === 0}
              >
                <Button 
                  danger 
                  size="small" 
                  disabled={selectedRowKeys.length === 0} 
                  icon={<DeleteOutlined />}
                >
                  批量删除
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
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal 
        title={editingId ? "编辑标签" : "新增标签"} 
        open={formModalVisible} 
        onCancel={() => setFormModalVisible(false)} 
        onOk={handleFormSubmit} 
        confirmLoading={isSubmitting} 
        destroyOnClose 
        width={500}
      >
        <Form 
          form={form} 
          layout="vertical" 
          size="small"
          initialValues={{
            priority: 5,
            status: '启用'
          }}
        >
          <Form.Item 
            label="标签名称" 
            name="name"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: 20, message: '名称不能超过20个字符' }
            ]}
          >
            <Input placeholder="例如：热销爆款、新品上市" />
          </Form.Item>
          
          <Form.Item 
            label="优先级" 
            name="priority"
            rules={[{ required: true, message: '请输入优先级' }]}
            tooltip="数字越小，排序越靠前"
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item 
            label="状态" 
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="启用">启用</Option>
              <Option value="禁用">禁用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            label="备注" 
            name="remark"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="标签说明或使用场景" 
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

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
              <Text copyable code>{currentTag.tag_id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color="blue">{currentTag.priority}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentTag.status === '启用' ? 'success' : 'default'}>
                {currentTag.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="备注">
              {currentTag.remark || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="创建者">
              {(currentTag as any).creator_id || 'admin'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs((currentTag as any).created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="关联商品数">
              <Badge 
                count={(currentTag as any).product_count || 0} 
                style={{ backgroundColor: '#1890ff' }}
              />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TagListPage;