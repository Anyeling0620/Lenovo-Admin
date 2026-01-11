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
  Popconfirm,
  Tooltip,
  Image,
  Divider,
  Spin,
  Modal,
  message
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
  AppstoreOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// API
import * as api from '../../../services/api';
import type { 
  ProductConfigResponse, 
  ProductConfigStatus,
  ProductListItem,
  StockResponse 
} from '../../../services/api-type';
import { globalMessage } from '../../../utils/globalMessage';
import { getImageUrl } from '../../../utils/imageUrl';

const { Option } = Select;
const { confirm } = Modal;

// 扩展类型以包含额外信息
interface ExtendedProductConfigResponse extends ProductConfigResponse {
  product_name?: string;
  category_name?: string;
  brand_name?: string;
  stock_num?: number;
  warn_num?: number;
  freeze_num?: number;
}

const ConfigListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<ExtendedProductConfigResponse[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<ExtendedProductConfigResponse[]>([]);
  const [, setProducts] = useState<ProductListItem[]>([]);
  const [, setStocks] = useState<StockResponse[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 搜索和过滤
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [searchProduct, setSearchProduct] = useState<string>('');

  // 加载所有数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 获取所有商品
      const productsResponse = await api.getProducts();
      setProducts(productsResponse);
      
      // 2. 获取所有库存信息
      const stocksResponse = await api.getStocks();
      setStocks(stocksResponse);
      
      // 3. 为每个商品获取其配置
      const allConfigs: ExtendedProductConfigResponse[] = [];
      
      // 使用 Promise.all 并行获取所有商品的配置
      const configPromises = productsResponse.map(async (product) => {
        try {
          const productConfigs = await api.getProductConfigs(product.product_id);
          
          // 为每个配置添加商品信息和库存信息
          const enrichedConfigs = productConfigs.map(config => {
            const stockInfo = stocksResponse.find(stock => 
              stock.config_id === config.product_config_id
            );
            
            return {
              ...config,
              product_name: product.name,
              category_name: product.category_name,
              brand_name: product.brand_name,
              stock_num: stockInfo?.stock_num || 0,
              warn_num: stockInfo?.warn_num || 0,
              freeze_num: stockInfo?.freeze_num || 0
            };
          });
          
          return enrichedConfigs;
        } catch (error) {
          console.error(`获取商品 ${product.product_id} 的配置失败:`, error);
          return [];
        }
      });
      
      const configsArrays = await Promise.all(configPromises);
      
      // 合并所有配置
      configsArrays.forEach(configArray => {
        allConfigs.push(...configArray);
      });
      
      setConfigs(allConfigs);
      setFilteredConfigs(allConfigs);
      
    } catch (error) {
      console.error('加载数据失败:', error);
      globalMessage.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 应用过滤条件
  const applyFilters = useCallback(() => {
    let filtered = [...configs];
    
    if (searchStatus) {
      filtered = filtered.filter(config => config.status === searchStatus);
    }
    
    if (searchProduct) {
      const productName = searchProduct.toLowerCase();
      filtered = filtered.filter(config => 
        config.product_name?.toLowerCase().includes(productName)
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
    
    setFilteredConfigs(filtered);
  }, [configs, searchKeyword, searchStatus, searchProduct]);

  // 加载数据
  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  // 当过滤条件变化时重新应用过滤
  useEffect(() => {
    applyFilters();
  }, [searchKeyword, searchStatus, searchProduct, configs, applyFilters]);

  // 单行删除
  const handleDelete = async (configId: string) => {
    confirm({
      title: '确定删除该配置吗？',
      icon: <ExclamationCircleOutlined />,
      content: '删除配置将同时删除关联的库存信息，此操作不可恢复。',
      onOk: async () => {
        try {
          await api.deleteProductConfig(configId);
          globalMessage.success('配置已删除');
          
          // 更新本地数据
          setConfigs(prev => prev.filter(config => config.product_config_id !== configId));
          
        } catch (err) {
          console.error('删除配置失败:', err);
          globalMessage.error('删除配置失败');
        }
      }
    });
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的配置');
      return;
    }

    confirm({
      title: `确定删除选中的 ${selectedRowKeys.length} 个配置吗？`,
      icon: <ExclamationCircleOutlined />,
      content: '删除配置将同时删除关联的库存信息，此操作不可恢复。',
      onOk: async () => {
        setLoading(true);
        try {
          // 批量删除
          const deletePromises = selectedRowKeys.map(id => 
            api.deleteProductConfig(id as string)
          );
          
          await Promise.all(deletePromises);
          
          globalMessage.success(`成功删除 ${selectedRowKeys.length} 个配置`);
          
          // 重新加载数据
          await loadData();
          
          // 清空选择
          setSelectedRowKeys([]);
          
        } catch (err) {
          console.error('批量删除失败:', err);
          globalMessage.error('批量删除失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 查看配置详情
  const handleViewDetail = (config: ExtendedProductConfigResponse) => {
    navigate(`/goods/manage/sku/${config.product_id}`, {
      state: { 
        configId: config.product_config_id,
        from: window.location.pathname + window.location.search 
      }
    });
  };

  // 编辑配置
  const handleEdit = (config: ExtendedProductConfigResponse) => {
    navigate(`/goods/manage/configs/edit/${config.product_config_id}`, {
      state: { 
        productId: config.product_id,
        from: window.location.pathname + window.location.search 
      }
    });
  };

  // 更新配置状态
  const handleUpdateStatus = async (configId: string, newStatus: ProductConfigStatus) => {
    try {
      await api.updateProductConfigStatus(configId, newStatus);
      globalMessage.success('状态更新成功');
      
      // 更新本地数据
      setConfigs(prev => prev.map(config => 
        config.product_config_id === configId 
          ? { ...config, status: newStatus }
          : config
      ));
      
    } catch (error) {
      console.error('更新状态失败:', error);
      globalMessage.error('更新状态失败');
    }
  };

  // 表格列定义
  const columns = [
    { 
      title: '商品信息', 
      key: 'product_info', 
      width: 180,
      render: (_: any, record: ExtendedProductConfigResponse) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: 2 }}>
            {record.product_name || '未知商品'}
          </div>
          <div style={{ fontSize: '10px', color: '#999' }}>
            <div>品牌: {record.brand_name}</div>
            <div>品类: {record.category_name}</div>
          </div>
        </div>
      ) 
    },
    { 
      title: '配置规格', 
      key: 'config_spec', 
      width: 160,
      render: (_: any, record: ExtendedProductConfigResponse) => (
        <div>
          <div style={{ fontSize: '11px' }}>
            <Tag color="blue" style={{ fontSize: '10px', margin: '2px' }}>{record.config1}</Tag>
            <Tag color="green" style={{ fontSize: '10px', margin: '2px' }}>{record.config2}</Tag>
            {record.config3 && (
              <Tag color="orange" style={{ fontSize: '10px', margin: '2px' }}>{record.config3}</Tag>
            )}
          </div>
          <div style={{ fontSize: '10px', color: '#999', marginTop: 2 }}>
            ID: {record.product_config_id}
          </div>
        </div>
      ) 
    },
    { 
      title: '价格', 
      key: 'price', 
      width: 120,
      render: (_: any, record: ExtendedProductConfigResponse) => {
        const salePrice = typeof record.sale_price === 'string' 
          ? parseFloat(record.sale_price) 
          : record.sale_price;
        const originalPrice = typeof record.original_price === 'string'
          ? parseFloat(record.original_price)
          : record.original_price;
          
        return (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#f5222d' }}>
              ¥{salePrice.toFixed(2)}
            </div>
            <div style={{ fontSize: '10px', color: '#999', textDecoration: 'line-through' }}>
              ¥{originalPrice.toFixed(2)}
            </div>
          </div>
        );
      }
    },
    { 
      title: '库存', 
      key: 'stock', 
      width: 100,
      render: (_: any, record: ExtendedProductConfigResponse) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600 }}>
            {record.stock_num || 0}
          </div>
          <div style={{ fontSize: '10px', color: '#faad14' }}>
            预警: {record.warn_num || 10}
          </div>
          {record.freeze_num && record.freeze_num > 0 && (
            <div style={{ fontSize: '10px', color: '#ff4d4f' }}>
              冻结: {record.freeze_num}
            </div>
          )}
        </div>
      ) 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: (status: ProductConfigStatus, record: ExtendedProductConfigResponse) => (
        <Popconfirm
          title={`确定${status === '正常' ? '下架' : '启用'}该配置吗？`}
          onConfirm={() => handleUpdateStatus(
            record.product_config_id, 
            status === '正常' ? '下架' : '正常'
          )}
        >
          <Tag 
            color={status === '正常' ? 'success' : 'default'} 
            style={{ fontSize: '11px', cursor: 'pointer' }}
          >
            {status === '正常' ? <CheckCircleOutlined /> : <StopOutlined />} {status}
          </Tag>
        </Popconfirm>
      ) 
    },
    { 
      title: '图片', 
      key: 'image', 
      width: 60,
      render: (_: any, record: ExtendedProductConfigResponse) => (
        record.image ? (
          <Image 
            src={getImageUrl(record.image)} 
            width={30} 
            height={30} 
            style={{ borderRadius: 4, objectFit: 'cover' }}
            preview={{
              mask: '预览',
              src: getImageUrl(record.image)
            }}
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
      fixed: 'right' as const,
      render: (_: any, record: ExtendedProductConfigResponse) => (
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
    const total = configs.length;
    const active = configs.filter(config => config.status === '正常').length;
    const inactive = configs.filter(config => config.status === '下架').length;
    const lowStock = configs.filter(config => (config.stock_num || 0) <= (config.warn_num || 10)).length;
    
    return { total, active, inactive, lowStock };
  };

  const stats = getStats();

  // 重置搜索条件
  const handleReset = () => {
    setSearchKeyword('');
    setSearchStatus('');
    setSearchProduct('');
  };

  if (loading && configs.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin tip="加载配置数据..." size="large" />
      </div>
    );
  }

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
          <Col flex="auto">
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
                onClick={() => applyFilters()}
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
          <Col>
            <Space>
              {selectedRowKeys.length > 0 && (
                <Popconfirm
                  title={`确定删除选中的 ${selectedRowKeys.length} 个配置吗？`}
                  onConfirm={handleBatchDelete}
                >
                  <Button 
                    type="primary" 
                    danger 
                    size="small"
                    icon={<DeleteOutlined />}
                  >
                    批量删除 ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={loadData}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 表格 */}
      <Card size="small" bordered={false}>
        <Table
          columns={columns}
          dataSource={filteredConfigs}
          rowKey="product_config_id"
          loading={loading}
          size="small"
          rowSelection={{ 
            selectedRowKeys, 
            onChange: (keys) => setSelectedRowKeys(keys) 
          }}
          scroll={{ x: 1000 }}
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
        <Divider style={{ fontSize: '12px' }}>操作说明</Divider>
        <ul>
          <li>配置管理用于管理商品的不同规格版本（如颜色、内存、存储等）</li>
          <li>每个配置可以独立设置价格、库存和状态</li>
          <li>点击配置状态标签可以快速切换启用/下架状态</li>
          <li>点击"查看详情"可以查看配置的详细信息</li>
          <li>可以通过商品管理页面的"SKU管理"功能批量管理配置</li>
        </ul>
      </div>
    </div>
  );
};

export default ConfigListPage;