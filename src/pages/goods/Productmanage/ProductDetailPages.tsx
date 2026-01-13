/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Button, Space, Typography, Descriptions, Tag, Image,
  Tabs, Badge, Statistic, Divider, Empty, Spin, List
} from 'antd';
import {
  ArrowLeftOutlined, TagOutlined, 
  StockOutlined, ShoppingOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';
import { getProductDetail } from '../../../services/api'; // 假设这个导入路径正确

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// 定义商品详情的接口类型
interface ProductTag {
  product_tag_relation_id: string;
  tag_id: string;
  tag_name: string;
  status: string;
}

interface ProductBanner {
  product_banner_id: string;
  image: string;
  sort: number;
}

interface ProductAppearance {
  product_appearance_id: string;
  image: string;
}

interface ProductConfig {
  product_config_id: string;
  product_id: string;
  config1: string;
  config2: string;
  config3: string | null;
  sale_price: number | string;
  original_price: number | string;
  status: string;
  image?: string | null;
  // API返回的库存字段
  stock?: {
    stock_id: string;
    stock_num: number;
    warn_num: number;
    freeze_num: number;
  } | null;
  // 其他可能的库存字段格式
  stock_info?: {
    stock_id: string;
    stock_num: number;
    warn_num: number;
    freeze_num: number;
  } | null;
  // 扁平库存字段
  stock_num?: number;
  warn_num?: number;
  freeze_num?: number;
}

interface ProductDetailData {
  product_id: string;
  name: string;
  sub_title: string | null;
  description: string | null;
  brand_id: string;
  brand_name: string;
  category_id: string;
  category_name: string;
  status: string;
  main_image: string | null;
  tags: ProductTag[];
  configs: ProductConfig[];
  banners: ProductBanner[];
  appearances: ProductAppearance[];
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [productDetail, setProductDetail] = useState<ProductDetailData | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // 获取来源页面，如果没有则使用默认页面
  const fromPath = (location.state as any)?.from || '/goods/manage/list';

  // 加载商品详情
  const loadProductDetail = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // 使用真实API获取商品详情
      const detail = await getProductDetail(id);
      
      if (detail) {
        setProductDetail(detail);
      } else {
        globalMessage.error('商品不存在或已被删除');
        navigate('/goods/manage/list');
      }
    } catch (error) {
      console.error('加载商品详情失败:', error);
      globalMessage.error('加载商品详情失败');
      navigate('/goods/manage/list');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // 返回原页面
  const handleBack = () => {
    navigate(fromPath);
  };

  // 处理价格显示
  const formatPrice = (price: number | string) => {
    if (typeof price === 'string') {
      const num = parseFloat(price);
      return isNaN(num) ? '0.00' : num.toFixed(2);
    }
    return price.toFixed(2);
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '正常':
        return 'success';
      case '下架':
        return 'warning';
      case '删除':
        return 'error';
      default:
        return 'default';
    }
  };

  // 获取配置状态标签颜色
  const getConfigStatusColor = (status: string) => {
    switch (status) {
      case '正常':
        return 'green';
      case '下架':
        return 'orange';
      default:
        return 'default';
    }
  };

  // 获取当前页面路径（包含查询参数）
  const getCurrentPath = () => {
    return window.location.pathname + window.location.search;
  };

  // 获取跳转状态，确保能返回到当前页面
  const getBackState = () => ({
    from: getCurrentPath()
  });

  // 处理库存编辑跳转
  const handleStockEdit = (stockId: string | undefined) => {
    if (!stockId) {
      globalMessage.warning('该SKU暂无库存信息');
      return;
    }
    navigate(`/goods/stock/edit/${stockId}`, {
      state: getBackState()
    });
  };

  // 辅助函数：检查是否有库存信息
  const hasStockInfo = (config: ProductConfig) => {
    // 检查多种可能的库存字段，包括API返回的stock字段
    // 即使字段值为0，也应该视为有库存信息
    return (
      // 检查扁平库存字段
      config.stock_num !== undefined ||
      config.warn_num !== undefined ||
      config.freeze_num !== undefined ||
      // 检查stock_info对象是否存在（即使里面字段为空）
      config.stock_info !== undefined && config.stock_info !== null ||
      // 检查stock对象是否存在（即使里面字段为空）
      config.stock !== undefined && config.stock !== null
    );
  };

  // 获取库存数值
  const getStockValue = (config: ProductConfig) => {
    if (config.stock) {
      return {
        stock_num: typeof config.stock.stock_num === 'number' ? config.stock.stock_num : 0,
        warn_num: typeof config.stock.warn_num === 'number' ? config.stock.warn_num : 10,
        freeze_num: typeof config.stock.freeze_num === 'number' ? config.stock.freeze_num : 0,
        stock_id: config.stock.stock_id
      };
    } else if (config.stock_info) {
      return {
        stock_num: typeof config.stock_info.stock_num === 'number' ? config.stock_info.stock_num : 0,
        warn_num: typeof config.stock_info.warn_num === 'number' ? config.stock_info.warn_num : 10,
        freeze_num: typeof config.stock_info.freeze_num === 'number' ? config.stock_info.freeze_num : 0,
        stock_id: config.stock_info.stock_id
      };
    }
    
    return {
      stock_num: typeof config.stock_num === 'number' ? config.stock_num : 0,
      warn_num: typeof config.warn_num === 'number' ? config.warn_num : 10,
      freeze_num: typeof config.freeze_num === 'number' ? config.freeze_num : 0,
      stock_id: undefined
    };
  };

  useEffect(() => {
    loadProductDetail();
  }, [loadProductDetail]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin tip="加载商品详情..." size="large" />
      </div>
    );
  }

  if (!productDetail) {
    return (
      <div style={{ padding: 16, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
        <Card>
          <Empty description="商品不存在或已被删除" />
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Button type="primary" onClick={handleBack}>
              返回
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 头部区域 */}
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ padding: 0, marginBottom: 16 }}
        >
          返回商品列表
        </Button>
        
        <Card
          title={
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                  <Title level={4} style={{ margin: 0 }}>{productDetail.name}</Title>
                  <Badge 
                    status={productDetail.status === '正常' ? 'success' : 'warning'} 
                    text={productDetail.status}
                    style={{ fontSize: 12 }}
                  />
                </Space>
                <Space>
                  <Button 
                    type="primary"
                    onClick={() => navigate(`/goods/manage/edit/${productDetail.product_id}`, {
                      state: getBackState()
                    })}
                  >
                    编辑商品
                  </Button>
                </Space>
              </div>
              {productDetail.sub_title && (
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {productDetail.sub_title}
                </Text>
              )}
            </Space>
          }
          headStyle={{ 
            padding: '12px 16px',  // 修复：增加顶部卡片标题区域的内边距
            borderBottom: '1px solid #f0f0f0'
          }}
          bordered={false}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <Image
                  src={getImageUrl(productDetail.main_image || '')}
                  alt={productDetail.name}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: 300, 
                    objectFit: 'contain',
                    borderRadius: 4
                  }}
                  preview={{
                    mask: '点击预览',
                    src: getImageUrl(productDetail.main_image || '')
                  }}
                />
              </div>
            </Col>
            
            <Col xs={24} md={16}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic 
                    title="商品ID" 
                    value={productDetail.product_id} 
                    valueStyle={{ fontSize: 16 }}
                    prefix={<TagOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="SKU数量" 
                    value={productDetail.configs?.length || 0}
                    valueStyle={{ fontSize: 16 }}
                    prefix={<ShoppingOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="标签数量" 
                    value={productDetail.tags?.length || 0}
                    valueStyle={{ fontSize: 16 }}
                    prefix={<TagOutlined />}
                  />
                </Col>
              </Row>
              
              <Divider />
              
              <Descriptions 
                size="small" 
                column={2} 
                labelStyle={{ fontWeight: 500, width: 80 }}
              >
                <Descriptions.Item label="品牌">
                  <Tag color="blue">{productDetail.brand_name}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="品类">
                  <Tag color="green">{productDetail.category_name}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Badge 
                    status={getStatusColor(productDetail.status)} 
                    text={productDetail.status}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="标签">
                  <Space size={[0, 4]} wrap>
                    {productDetail.tags && productDetail.tags.length > 0 ? (
                      productDetail.tags.map((tag) => (
                        <Tag key={tag.tag_id} color="blue">{tag.tag_name}</Tag>
                      ))
                    ) : (
                      <Text type="secondary">暂无标签</Text>
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>
      </div>

      {/* 内容区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="商品描述" key="description">
            <div style={{ padding: 16 }}>
              {productDetail.description ? (
                <div 
                  style={{ 
                    lineHeight: 1.8,
                    color: '#333'
                  }}
                >
                  {productDetail.description}
                </div>
              ) : (
                <Empty description="暂无商品描述" />
              )}
            </div>
          </TabPane>
          
          <TabPane tab="商品图库" key="media">
            <div style={{ padding: 16 }}>
              <div style={{ marginBottom: 24 }}>
                <h4>宣传横幅 ({productDetail.banners?.length || 0})</h4>
                {productDetail.banners && productDetail.banners.length > 0 ? (
                  <Row gutter={[12, 12]}>
                    {productDetail.banners.map((banner) => (
                      <Col key={banner.product_banner_id} xs={12} sm={8} md={6} lg={4}>
                        <Image
                          src={getImageUrl(banner.image)}
                          style={{ 
                            width: '100%', 
                            height: 120, 
                            objectFit: 'cover',
                            borderRadius: 4
                          }}
                          preview={{
                            mask: '预览',
                            src: getImageUrl(banner.image)
                          }}
                        />
                        <div style={{ 
                          textAlign: 'center', 
                          fontSize: 12, 
                          color: '#999', 
                          marginTop: 4 
                        }}>
                          排序: {banner.sort}
                        </div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty description="暂无宣传横幅" />
                )}
              </div>
              
              <div>
                <h4>外观展示 ({productDetail.appearances?.length || 0})</h4>
                {productDetail.appearances && productDetail.appearances.length > 0 ? (
                  <Row gutter={[12, 12]}>
                    {productDetail.appearances.map((appearance) => (
                      <Col key={appearance.product_appearance_id} xs={12} sm={8} md={6} lg={4}>
                        <Image
                          src={getImageUrl(appearance.image)}
                          style={{ 
                            width: '100%', 
                            height: 120, 
                            objectFit: 'cover',
                            borderRadius: 4
                          }}
                          preview={{
                            mask: '预览',
                            src: getImageUrl(appearance.image)
                          }}
                        />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty description="暂无外观展示" />
                )}
              </div>
            </div>
          </TabPane>
          
          <TabPane tab="SKU管理" key="sku">
            <div style={{ padding: 16 }}>
              {productDetail.configs && productDetail.configs.length > 0 ? (
                <List
                  size="small"
                  dataSource={productDetail.configs}
                  renderItem={(config) => {
                    const hasStock = hasStockInfo(config);
                    const stockData = getStockValue(config);
                    
                    return (
                      <List.Item>
                        <Card 
                          size="small" 
                          style={{ 
                            width: '100%',
                            borderLeft: `4px solid ${config.status === '正常' ? '#52c41a' : '#faad14'}`
                          }}
                        >
                          <Row align="middle" gutter={16}>
                            <Col span={3}>
                              {config.image && (
                                <Image
                                  src={getImageUrl(config.image)}
                                  width={60}
                                  height={60}
                                  style={{ 
                                    objectFit: 'contain',
                                    borderRadius: 4
                                  }}
                                />
                              )}
                            </Col>
                            <Col span={5}>
                              <div>
                                <Text strong>配置1: </Text>
                                {config.config1}
                              </div>
                              <div>
                                <Text strong>配置2: </Text>
                                {config.config2}
                              </div>
                              {config.config3 && (
                                <div>
                                  <Text strong>配置3: </Text>
                                  {config.config3}
                                </div>
                              )}
                            </Col>
                            <Col span={4}>
                              <div style={{ color: '#f5222d', fontWeight: 600, fontSize: 16 }}>
                                ¥{formatPrice(config.sale_price)}
                              </div>
                              <div style={{ 
                                fontSize: 12, 
                                color: '#999', 
                                textDecoration: 'line-through' 
                              }}>
                                原价: ¥{formatPrice(config.original_price)}
                              </div>
                            </Col>
                            <Col span={4}>
                              {hasStock ? (
                                <>
                                  <div>
                                    <StockOutlined /> 库存: {stockData.stock_num}
                                  </div>
                                  <div style={{ fontSize: 12, color: '#faad14' }}>
                                    预警: {stockData.warn_num}
                                  </div>
                                  {stockData.freeze_num > 0 && (
                                    <div style={{ fontSize: 12, color: '#ff4d4f' }}>
                                      冻结: {stockData.freeze_num}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div style={{ color: '#999' }}>
                                  <StockOutlined /> 无库存信息
                                </div>
                              )}
                            </Col>
                            <Col span={3}>
                              <Tag color={getConfigStatusColor(config.status)}>
                                {config.status}
                              </Tag>
                            </Col>
                            <Col span={5} style={{ textAlign: 'right' }}>
                              <Space>
                                {/* <Button 
                                  size="small"
                                  onClick={() => navigate(`/goods/manage/sku/edit/${config.product_config_id}`, {
                                    state: getBackState()
                                  })}
                                >
                                  编辑
                                </Button> */}
                                <Button 
                                  size="small"
                                  onClick={() => handleStockEdit(stockData.stock_id)}
                                  disabled={!hasStock || !stockData.stock_id}
                                >
                                  管理库存
                                </Button>
                              </Space>
                            </Col>
                          </Row>
                        </Card>
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Empty description="暂无SKU配置" />
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 底部区域 */}
      <div style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text type="secondary">
              商品ID: {productDetail.product_id}
            </Text>
          </Space>
          <Space>
            <Button
              onClick={() => navigate(`/goods/manage/sku/${productDetail.product_id}`, {
                state: getBackState()
              })}
            >
              管理SKU
            </Button>
            <Button
              onClick={() => navigate(`/goods/manage/gallery/${productDetail.product_id}`, {
                state: getBackState()
              })}
            >
              管理图库
            </Button>
            {/* <Button
              type="primary"
              onClick={() => navigate(`/goods/manage/shelf/${productDetail.product_id}`, {
                state: getBackState()
              })}
            >
              上架商品
            </Button> */}
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;