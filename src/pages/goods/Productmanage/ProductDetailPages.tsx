/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Space, Typography, Descriptions, Tag, Image,
  Tabs, Badge, Statistic, Divider, Empty, Spin, List
} from 'antd';
import {
  ArrowLeftOutlined, ShoppingOutlined, DollarOutlined, 
  AppstoreOutlined, TagOutlined, CalendarOutlined, 
  EyeOutlined, StockOutlined, HistoryOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ProductListItem } from '../../../services/api-type';
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { getProductDetail } from '../../../services/api';
import { findMockProductDetail } from '../../../services/cyf-mockData';
import './ProductDetailPage.less';

const { Title, Text } = Typography;
const { TabPane } = Tabs;



const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [productDetail, setProductDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const useMockData = true;
  // 获取来源页面，如果没有则使用默认页面
  const fromPath = (location.state as any)?.from || '/goods/manage/list';

  useEffect(() => {
    if (id) {
      loadProductDetail();
    }
  }, [id]);

  const loadProductDetail = async () => {
    setLoading(true);
    try {
      let detail;
      if (useMockData) {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800));
        detail = findMockProductDetail(id!);
      } else {
        detail = await getProductDetail(id!);
      }
      
      if (detail) {
        setProductDetail(detail);
      } else {
        globalMessage.error('商品不存在或已被删除');
        navigate('/goods/manage/list');
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      globalMessage.error('加载商品详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 返回原页面
  const handleBack = () => {
    navigate(fromPath);
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <Spin tip="加载商品详情..." size="large" />
      </div>
    );
  }

  if (!productDetail) {
    return (
      <div className="product-detail-container">
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
    <div className="product-detail-container">
      <div className="detail-header">
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
                  <Link to={`/goods/manage/edit/${productDetail.product_id}`}>
                    <Button type="primary">编辑商品</Button>
                  </Link>
                </Space>
              </div>
              {productDetail.sub_title && (
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {productDetail.sub_title}
                </Text>
              )}
            </Space>
          }
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
                    title="创建时间" 
                    value={dayjs(productDetail.created_at).format('YYYY-MM-DD')}
                    valueStyle={{ fontSize: 16 }}
                    prefix={<CalendarOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="更新时间" 
                    value={dayjs(productDetail.updated_at).format('YYYY-MM-DD HH:mm')}
                    valueStyle={{ fontSize: 16, color: '#faad14' }}
                    prefix={<HistoryOutlined />}
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
                  <Tag color="blue">{productDetail.brand_name || productDetail.brand_id}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="品类">
                  <Tag color="green">{productDetail.category_name || productDetail.category_id}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建人">
                  {productDetail.creator_name || productDetail.creator_id}
                </Descriptions.Item>
                <Descriptions.Item label="标签">
                  <Space size={[0, 4]} wrap>
                    {productDetail.tags && productDetail.tags.length > 0 ? (
                      productDetail.tags.map((tag: any) => (
                        <Tag key={tag.tag_id} color="blue">{tag.name}</Tag>
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

      <Card className="detail-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="商品描述" key="description">
            <div className="description-content">
              {productDetail.description ? (
                <div dangerouslySetInnerHTML={{ __html: productDetail.description }} />
              ) : (
                <Empty description="暂无商品描述" />
              )}
            </div>
          </TabPane>
          
          <TabPane tab="规格参数" key="specs">
            <div className="specs-content">
              {productDetail.specifications && productDetail.specifications.length > 0 ? (
                <List
                  size="small"
                  dataSource={productDetail.specifications}
                  renderItem={(spec: any, index) => (
                    <List.Item>
                      <Row style={{ width: '100%' }}>
                        <Col span={8} style={{ fontWeight: 500, color: '#666' }}>
                          {spec.key}
                        </Col>
                        <Col span={16}>{spec.value}</Col>
                      </Row>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无规格参数" />
              )}
            </div>
          </TabPane>
          
          <TabPane tab="多媒体库" key="media">
            <div className="media-content">
              <div style={{ marginBottom: 24 }}>
                <h4>宣传图 ({productDetail.banners?.length || 0})</h4>
                {productDetail.banners && productDetail.banners.length > 0 ? (
                  <Row gutter={[12, 12]}>
                    {productDetail.banners.map((banner: any, index: number) => (
                      <Col key={index} xs={12} sm={8} md={6} lg={4}>
                        <Image
                          src={getImageUrl(banner.image)}
                          style={{ width: '100%', height: 120, objectFit: 'cover' }}
                          preview={{
                            mask: '预览',
                            src: getImageUrl(banner.image)
                          }}
                        />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty description="暂无宣传图" />
                )}
              </div>
              
              <div>
                <h4>外观图 ({productDetail.appearances?.length || 0})</h4>
                {productDetail.appearances && productDetail.appearances.length > 0 ? (
                  <Row gutter={[12, 12]}>
                    {productDetail.appearances.map((app: any, index: number) => (
                      <Col key={index} xs={12} sm={8} md={6} lg={4}>
                        <Image
                          src={getImageUrl(app.image)}
                          style={{ width: '100%', height: 120, objectFit: 'cover' }}
                          preview={{
                            mask: '预览',
                            src: getImageUrl(app.image)
                          }}
                        />
                        <div style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 4 }}>
                          外观图 {index + 1}
                        </div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty description="暂无外观图" />
                )}
              </div>
            </div>
          </TabPane>
          
          <TabPane tab="SKU库存" key="sku">
            <div className="sku-content">
              {productDetail.configs && productDetail.configs.length > 0 ? (
                <List
                  size="small"
                  dataSource={productDetail.configs}
                  renderItem={(config: any) => (
                    <List.Item>
                      <Card size="small" style={{ width: '100%' }}>
                        <Row align="middle">
                          <Col span={4}>
                            {config.image && (
                              <Image
                                src={getImageUrl(config.image)}
                                width={60}
                                height={60}
                                style={{ objectFit: 'contain' }}
                              />
                            )}
                          </Col>
                          <Col span={6}>
                            <Text strong>{config.config1}/{config.config2}</Text>
                            {config.config3 && (
                              <div style={{ color: '#666', fontSize: 12 }}>
                                {config.config3}
                              </div>
                            )}
                          </Col>
                          <Col span={4}>
                            <div style={{ color: '#f5222d', fontWeight: 600 }}>
                              ¥{config.sale_price}
                            </div>
                            <div style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>
                              ¥{config.original_price}
                            </div>
                          </Col>
                          <Col span={4}>
                            <div>
                              <StockOutlined /> 库存: {config.stock?.stock_num || 0}
                            </div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              预警: {config.stock?.warn_num || 10}
                            </div>
                          </Col>
                          <Col span={6} style={{ textAlign: 'right' }}>
                            <Tag color={config.status === '正常' ? 'green' : 'orange'}>
                              {config.status}
                            </Tag>
                          </Col>
                        </Row>
                      </Card>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无SKU配置" />
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <div className="detail-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text type="secondary">最后更新: {dayjs(productDetail.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
          </Space>
          <Space>
            <Link to={`/goods/manage/sku/${productDetail.product_id}`}>
              <Button>管理SKU</Button>
            </Link>
            <Link to={`/goods/manage/gallery/${productDetail.product_id}`}>
              <Button>管理图库</Button>
            </Link>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;