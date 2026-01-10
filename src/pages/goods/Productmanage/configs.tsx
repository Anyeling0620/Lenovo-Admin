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
  Form,
  InputNumber,
  message,
  Badge,
  Divider,
  Descriptions,
  Image
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
  ShoppingOutlined,
  DollarOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// API
import * as api from '../../../services/api';
import type { ProductConfigResponse, ProductConfigStatus } from '../../../services/api-type';
import { globalMessage } from '../../../utils/globalMessage';
import { getImageUrl } from '../../../utils/imageUrl';

const { Title, Text } = Typography;
const { Option } = Select;

// 模拟数据生成函数
const generateMockConfigs = (): ProductConfigResponse[] => {
  const configs: ProductConfigResponse[] = [];
  const statuses: ProductConfigStatus[] = ['下架', '正常'];
  const products = [
    { id: 'prod_001', name: '拯救者 Y9000P 2024' },
    { id: 'prod_002', name: '小新 Pro 16 2024款' },
    { id: 'prod_003', name: 'ThinkPad X1 Carbon' },
    { id: 'prod_004', name: 'YOGA Air 14s' },
    { id: 'prod_005', name: '联想 1TB 固态硬盘' },
  ];
  
  const colors = ['冰魄白', '钛晶灰', '星际黑', '烈焰红', '深海蓝'];
  const memories = ['8GB', '16GB', '32GB', '64GB'];
  const storages = ['256GB', '512GB', '1TB', '2TB'];
  
  for (let i = 1; i <= 30; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    configs.push({
      product_config_id: `config_${i.toString().padStart(3, '0')}`,
      product_id: product.id,
      config1: colors[Math.floor(Math.random() * colors.length)],
      config2: memories[Math.floor(Math.random() * memories.length)],
      config3: storages[Math.floor(Math.random() * storages.length)],
      sale_price: Math.floor(Math.random() * 10000) + 3000,
      original_price: Math.floor(Math.random() * 12000) + 4000,
      status,
      image: i % 3 === 0 ? `config_${i}.jpg` : null,
      stock: {
        stock_id: `stock_${i}`,
        stock_num: Math.floor(Math.random() * 100) + 10,
        warn_num: 10,
        freeze_num: Math.floor(Math.random() * 5)
      },
      // 模拟字段
      product_name: product.name,
      created_at: dayjs().subtract(Math.floor(Math.random() * 30), 'day').toISOString()
    });
  }
  
  return configs;
};

const ConfigListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductConfigResponse[]>([]);
  const [filteredData, setFilteredData] = useState<ProductConfigResponse[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 搜索和过滤
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [searchProduct, setSearchProduct] = useState<string>('');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 这里应该调用API获取所有配置，但API可能需要逐个商品获取
      // 先使用模拟数据
      const mockConfigs = generateMockConfigs();
      setData(mockConfigs);
      applyFilters(mockConfigs);
    } catch (error) { 
      console.log('API调用失败，使用模拟数据');
      const mockConfigs = generateMockConfigs();
      setData(mockConfigs);
      applyFilters(mockConfigs);
    } finally { 
      setLoading(false); 
    }
  }, []);

  // 应用过滤条件
  const applyFilters = (configs: ProductConfigResponse[]) => {
    let filtered = [...configs];
    
    if (searchStatus) {
      filtered = filtered.filter(config => config.status === searchStatus);
    }
    
    if (searchProduct) {
      const productName = searchProduct.toLowerCase();
      filtered = filtered.filter(config => 
        (config as any).product_name.toLowerCase().includes(productName)
      );
    }
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(config => 
        config.config1.toLowerCase().includes(keyword) || 
        config.config2.toLowerCase().includes(keyword) ||
        (config.config3 && config.config3.toLowerCase().includes(keyword))
      );
    }
    
    setFilteredData(filtered);
  };

  // 单行删除
  const handleDelete = async (id: string) => {
    try {
      // 模拟API调用
      await api.deleteProductConfig(id);
      globalMessage.success('配置已删除');
      setData(prev => prev.filter(config => config.product_config_id !== id));
    } catch (err) { 
      console.log('API调用失败，更新本地数据');
      setData(prev => prev.filter(config => config.product_config_id !== id));
      globalMessage.success('配置已删除（本地演示）');
    }
  };

  // 查看配置详情
  const handleViewDetail = (config: ProductConfigResponse) => {
    navigate(`/goods/manage/sku/${config.product_id}`);
  };

  // 编辑配置
  const handleEdit = (config: ProductConfigResponse) => {
    // 这里应该跳转到编辑页面，暂时使用详情页
    handleViewDetail(config);
  };

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  useEffect(() => {
    applyFilters(data);
  }, [data, searchKeyword, searchStatus, searchProduct]);

  // 表格列定义
  const columns: any[] = [
    { 
      title: '商品信息', 
      key: 'product_info', 
      width: 200,
      render: (_: any, record: ProductConfigResponse) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '12px' }}>
            {(record as any).product_name || '未知商品'}
          </div>
          <div style={{ fontSize: '10px', color: '#999' }}>
            ID: {record.product_id}
          </div>
        </div>
      ) 
    },
    { 
      title: '配置规格', 
      key: 'config_spec', 
      width: 180,
      render: (_: any, record: ProductConfigResponse) => (
        <div>
          <div style={{ fontSize: '11px' }}>
            <Tag color="blue" style={{ fontSize: '10px', margin: '2px' }}>{record.config1}</Tag>
            <Tag color="green" style={{ fontSize: '10px', margin: '2px' }}>{record.config2}</Tag>
            {record.config3 && (
              <Tag color="orange" style={{ fontSize: '10px', margin: '2px' }}>{record.config3}</Tag>
            )}
          </div>
          <div style={{ fontSize: '10px', color: '#999', marginTop: 2 }}>
            配置ID: {record.product_config_id}
          </div>
        </div>
      ) 
    },
    { 
      title: '价格', 
      key: 'price', 
      width: 120,
      render: (_: any, record: ProductConfigResponse) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#f5222d' }}>
            ¥{typeof record.sale_price === 'string' ? record.sale_price : record.sale_price.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#999', textDecoration: 'line-through' }}>
            ¥{typeof record.original_price === 'string' ? record.original_price : record.original_price.toLocaleString()}
          </div>
        </div>
      ) 
    },
    { 
      title: '库存', 
      key: 'stock', 
      width: 100,
      render: (_: any, record: ProductConfigResponse) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600 }}>
            {record.stock?.stock_num || 0}
          </div>
          <div style={{ fontSize: '10px', color: '#faad14' }}>
            冻结: {record.stock?.freeze_num || 0}
          </div>
        </div>
      ) 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 80,
      render: (status: ProductConfigStatus) => (
        <Tag color={status === '正常' ? 'success' : 'default'} style={{ fontSize: '11px' }}>
          {status === '正常' ? <CheckCircleOutlined /> : <StopOutlined />} {status}
        </Tag>
      ) 
    },
    { 
      title: '图片', 
      key: 'image', 
      width: 60,
      render: (_: any, record: ProductConfigResponse) => (
        record.image ? (
          <Image 
            src={getImageUrl(record.image)} 
            width={30} 
            height={30} 
            style={{ borderRadius: 4, objectFit: 'cover' }}
            preview={false}
          />
        ) : (
          <div style={{ 
            width: 30, 
            height: 30, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AppstoreOutlined style={{ color: '#bfbfbf', fontSize: 14 }} />
          </div>
        )
      ) 
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: ProductConfigResponse) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm 
            title="确定删除该配置吗？" 
            onConfirm={() => handleDelete(record.product_config_id)}
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
    const active = data.filter(config => config.status === '正常').length;
    const inactive = data.filter(config => config.status === '下架').length;
    const lowStock = data.filter(config => (config.stock?.stock_num || 0) <= 10).length;
    
    return { total, active, inactive, lowStock };
  };

  const stats = getStats();

  // 获取商品列表（用于筛选）
  const productOptions = Array.from(new Set(data.map(item => (item as any).product_name))).filter(Boolean);

  return (
    <div style={{ padding: 16, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 统计卡片 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>配置总数</span>} 
              value={stats.total} 
              prefix={<SettingOutlined />} 
              valueStyle={{ color: '#1890ff', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>启用中</span>} 
              value={stats.active} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>库存预警</span>} 
              value={stats.lowStock} 
              prefix={<StopOutlined />} 
              valueStyle={{ color: '#faad14', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>已下架</span>} 
              value={stats.inactive} 
              prefix={<StopOutlined />} 
              valueStyle={{ color: '#ff4d4f', fontSize: 20 }} 
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索栏 */}
      <Card size="small" bordered={false} style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} justify="space-between">
          <Col span={24}>
            <Space wrap>
              <Input 
                placeholder="商品名称" 
                size="small" 
                style={{ width: 150, fontSize: 12 }}
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                allowClear
              />
              <Input 
                placeholder="配置规格" 
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
                <Option value="正常">正常</Option>
                <Option value="下架">下架</Option>
              </Select>
              <Button 
                type="primary" 
                size="small" 
                icon={<SearchOutlined />} 
                onClick={() => applyFilters(data)}
              >
                查询
              </Button>
              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  setSearchKeyword('');
                  setSearchStatus('');
                  setSearchProduct('');
                  applyFilters(data);
                }}
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
          rowKey="product_config_id"
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

      {/* 操作提示 */}
      <div style={{ marginTop: 16, fontSize: '12px', color: '#8c8c8c' }}>
        <Divider orientation="left">操作说明</Divider>
        <ul>
          <li>配置管理主要用于管理商品的不同规格版本（如颜色、内存、存储等）</li>
          <li>每个配置可以独立设置价格、库存和状态</li>
          <li>点击"查看详情"可以查看配置的详细信息</li>
          <li>可以通过商品管理页面的"SKU管理"功能批量管理配置</li>
        </ul>
      </div>
    </div>
  );
};

export default ConfigListPage;