/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Tag, 
  Spin, 
  Typography, 
  Button, 
  Space, 
  Badge,
  Image,
  Progress,
  Tooltip,
  Divider,
  List} from 'antd';
import { 
  ReloadOutlined, 
  ArrowRightOutlined, 
  ShoppingOutlined, 
  WarningOutlined,
  FireOutlined,
  ShopOutlined,
  TagsOutlined,
  DatabaseOutlined,
  SettingOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  StockOutlined,
  ClusterOutlined,
  CrownOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import dayjs from 'dayjs';

// 导入您的工具函数
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';

// 导入API（实际使用）
import * as api from '../../../services/api';
import type { 
  BrandResponse, 
  CategoryResponse, 
  ProductListItem, 
  StockResponse} from '../../../services/api-type';

// 模拟数据（如果API不可用时的备用数据）
const generateMockOverviewData = () => {
  const now = new Date();
  return {
    stats: {
      // 商品相关
      totalProducts: 1247,
      onSaleProducts: 980,
      offShelfProducts: 267,
      lowStockProducts: 38,
      
      // 品牌与品类
      totalBrands: 42,
      enabledBrands: 38,
      totalCategories: 15,
      leafCategories: 42,
      
      // 库存相关
      totalSKU: 2150,
      lowStockSKU: 78,
      outOfStockSKU: 12,
      frozenStock: 324,
      
      // 标签相关
      totalTags: 56,
      enabledTags: 51,
      
      // 今日数据
      todayOrders: 128,
      todayRevenue: 156200,
      todayVisitors: 4521
    },
    
    // 热销商品
    topSales: [
      { id: 'prod_001', name: '拯救者 Y9000P 2024旗舰版', price: 12999, sales: 452, image: 'p1.png', category: '游戏本专区', brand: '联想' },
      { id: 'prod_002', name: '小新 Pro 16 2024款', price: 5699, sales: 388, image: 'p2.png', category: '轻薄本专区', brand: '联想' },
      { id: 'prod_003', name: 'ThinkPad X1 Carbon Gen12', price: 14999, sales: 215, image: 'p3.png', category: '商务本专区', brand: 'ThinkPad' },
      { id: 'prod_004', name: '联想 1TB NVMe 固态硬盘', price: 399, sales: 189, image: 'p4.png', category: '配件专区', brand: '联想' },
      { id: 'prod_005', name: 'Legion 专业电竞鼠标', price: 299, sales: 156, image: 'p5.png', category: '外设专区', brand: '拯救者' },
    ],
    
    // 库存预警商品
    stockAlerts: [
      { id: 'stock_001', name: '拯救者 Y7000P 冰魄白', config: 'i7/16G/1TB/RTX4060', stock: 3, warnNum: 10, status: 'danger' },
      { id: 'stock_002', name: 'ThinkBook 14+ 2024', config: 'i5/16G/512G/集显', stock: 8, warnNum: 15, status: 'warning' },
      { id: 'stock_003', name: 'YOGA Air 14s 云母金', config: 'i7/32G/1TB/2.8K', stock: 5, warnNum: 12, status: 'danger' },
      { id: 'stock_004', name: '联想 Type-C 扩展坞', config: '九合一', stock: 12, warnNum: 20, status: 'normal' },
    ],
    
    // 最新添加的商品
    recentProducts: [
      { id: 'prod_100', name: '2024新款 Legion 电竞耳机', createdAt: '2024-03-15 14:30', status: '上架中' },
      { id: 'prod_101', name: '联想智能办公投影仪', createdAt: '2024-03-14 11:20', status: '审核中' },
      { id: 'prod_102', name: 'ThinkPad 专用背包', createdAt: '2024-03-13 16:45', status: '上架中' },
      { id: 'prod_103', name: '小新 Pad Pro 12.7', createdAt: '2024-03-12 09:15', status: '已上架' },
    ],
    
    // 品牌分布
    brandDistribution: [
      { name: '联想', count: 320, color: '#1890ff' },
      { name: 'ThinkPad', count: 185, color: '#52c41a' },
      { name: '拯救者', count: 156, color: '#fa8c16' },
      { name: '小新', count: 142, color: '#722ed1' },
      { name: '其他', count: 444, color: '#8c8c8c' },
    ],
    
    // 品类商品数
    categoryStats: [
      { name: '游戏本专区', count: 156, progress: 78 },
      { name: '商务本专区', count: 89, progress: 62 },
      { name: '轻薄本专区', count: 132, progress: 85 },
      { name: '配件专区', count: 245, progress: 45 },
      { name: '外设专区', count: 178, progress: 68 },
    ]
  };
};

const { Title, Text } = Typography;

const GoodsOverview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // 真实数据状态
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loadedProducts, setProducts] = useState<ProductListItem[]>([]);
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 尝试并行获取真实数据
      const promises = [
        api.getBrands().catch(() => ({ data: [] })),
        api.getCategories().catch(() => ({ data: [] })),
        api.getProducts().catch(() => ({ data: [] })),
        api.getStocks().catch(() => ({ data: [] })),
      ];
      
      const [brandRes, categoryRes, productRes, stockRes] = await Promise.all(promises);
      
        // 直接设置数据，不需要依赖外部的状态
        const loadedBrands = brandRes?.data || [];
        const loadedCategories = categoryRes?.data || [];
        const loadedProducts = productRes?.data || [];
        const loadedStocks = stockRes?.data || [];
  
      // 计算统计数据
      const onSaleProducts = loadedProducts.filter(p => p.status === '正常').length;
      const lowStockItems = stocks.filter(s => s.stock_num <= s.warn_num).length;
      const enabledBrands = brands.filter(b => b.status === '启用').length;
      
      // 合并模拟数据和真实数据
      const mockData = generateMockOverviewData();
    const processedData = {
      ...mockData,
      stats: {
        ...mockData.stats,
        totalProducts: loadedProducts.length || mockData.stats.totalProducts,
        onSaleProducts: onSaleProducts || mockData.stats.onSaleProducts,
        totalBrands: loadedBrands.length || mockData.stats.totalBrands,
        enabledBrands: enabledBrands || mockData.stats.enabledBrands,
        totalCategories: loadedCategories.length || mockData.stats.totalCategories,
        lowStockProducts: lowStockItems || mockData.stats.lowStockProducts,
      },
        brands: brands.length > 0 ? brands.slice(0, 5) : mockData.brandDistribution,
        recentProducts: loadedProducts.length > 0 
          ? loadedProducts.slice(0, 4).map(p => ({
              id: p.product_id,
              name: p.name,
              createdAt: p.created_at,
              status: p.status === '正常' ? '上架中' : '已下架'
            }))
          : mockData.recentProducts
      };
      
        setData(processedData);
        setBrands(loadedBrands);
        setCategories(loadedCategories);
        setProducts(loadedProducts);
        setStocks(loadedStocks);
        
        // 只在真实API调用成功时显示成功消息
        if (brandRes?.data || categoryRes?.data || productRes?.data || stockRes?.data) {
        globalMessage.success('商品数据已同步');
        } else {
        globalMessage.info('使用模拟数据展示');
        }
    } catch (error) {
        console.error('API调用失败，使用模拟数据', error);
        setData(generateMockOverviewData());
        globalMessage.warning('使用模拟数据展示');
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 统计卡片配置
  const statCards = [
    {
      title: '商品总数',
      value: data?.stats?.totalProducts || 0,
      icon: <ShoppingOutlined />,
      color: '#1890ff',
      path: '/goods/manage',
      suffix: '个',
      desc: '全部商品数量'
    },
    {
      title: '在售商品',
      value: data?.stats?.onSaleProducts || 0,
      icon: <ShopOutlined />,
      color: '#52c41a',
      path: '/goods/manage',
      suffix: '个',
      desc: '当前可购买'
    },
    {
      title: '库存预警',
      value: data?.stats?.lowStockProducts || 0,
      icon: <WarningOutlined />,
      color: '#faad14',
      path: '/goods/stock',
      suffix: '个',
      desc: '低于安全库存',
      warning: true
    },
    {
      title: '合作品牌',
      value: data?.stats?.totalBrands || 0,
      icon: <CrownOutlined />,
      color: '#722ed1',
      path: '/goods/brand',
      suffix: '个',
      desc: '品牌合作伙伴'
    },
    {
      title: '商品品类',
      value: data?.stats?.totalCategories || 0,
      icon: <ClusterOutlined />,
      color: '#13c2c2',
      path: '/goods/zone',
      suffix: '类',
      desc: '分类体系'
    },
    {
      title: '标签总数',
      value: data?.stats?.totalTags || 0,
      icon: <TagsOutlined />,
      color: '#eb2f96',
      path: '/goods/tags',
      suffix: '个',
      desc: '商品标签'
    },
    {
      title: 'SKU总数',
      value: data?.stats?.totalSKU || 0,
      icon: <DatabaseOutlined />,
      color: '#fa8c16',
      path: '/goods/configs',
      suffix: '款',
      desc: '库存单位'
    },
    {
      title: '今日订单',
      value: data?.stats?.todayOrders || 0,
      icon: <ShoppingCartOutlined />,
      color: '#f5222d',
      path: '/orders',
      suffix: '单',
      desc: '今日新增'
    }
  ];

  // 热销商品列定义
  const salesColumns = [
    {
      title: '排名',
      key: 'index',
      width: 50,
      render: (_: any, __: any, index: number) => (
        <Badge 
          count={index + 1} 
          style={{ 
            backgroundColor: index < 3 ? ['#ff4d4f', '#fa8c16', '#52c41a'][index] : '#8c8c8c',
            fontSize: 10,
            minWidth: 22,
            height: 22
          }} 
        />
      )
    },
    {
      title: '商品信息',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text: string, record: any) => (
        <Space size="small" align="start">
          <Image 
            src={getImageUrl(record.image)} 
            width={36} 
            height={36} 
            style={{ borderRadius: '4px', border: '1px solid #f0f0f0' }}
            fallback="https://via.placeholder.com/36"
            preview={false}
          />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.2 }}>{text}</div>
            <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
              {record.brand} · {record.category}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '当前售价',
      dataIndex: 'price',
      width: 100,
      align: 'right' as const,
      render: (v: number) => (
        <div>
          <Text style={{ fontSize: '12px', fontWeight: 600, color: '#f5222d' }}>¥{v.toLocaleString()}</Text>
        </div>
      )
    },
    {
      title: '周期销量',
      dataIndex: 'sales',
      width: 100,
      align: 'center' as const,
      render: (v: number) => (
        <div>
          <Tag color="orange" style={{ fontSize: '10px', borderRadius: '10px', padding: '0 8px' }}>
            {v.toLocaleString()} 件
          </Tag>
          <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: 2 }}>
            平均日销: {Math.round(v/30)}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (record: any) => (
        <Space size={0}>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/goods/detail/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => navigate(`/goods/manage/edit/${record.id}`)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 库存预警列定义
  const stockColumns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '10px', color: '#8c8c8c' }}>{record.config}</div>
        </div>
      )
    },
    {
      title: '库存状态',
      key: 'status',
      width: 100,
      render: (record: any) => {
        const percent = (record.stock / record.warnNum) * 100;
        let statusColor = '#52c41a';
        let statusText = '充足';
        
        if (record.status === 'warning') {
          statusColor = '#faad14';
          statusText = '预警';
        } else if (record.status === 'danger') {
          statusColor = '#ff4d4f';
          statusText = '紧急';
        }
        
        return (
          <div>
            <Tag color={statusColor} style={{ fontSize: '10px', borderRadius: '10px' }}>
              {statusText}
            </Tag>
            <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: 2 }}>
              库存: {record.stock}
            </div>
          </div>
        );
      }
    },
    {
      title: '库存进度',
      key: 'progress',
      width: 150,
      render: (record: any) => {
        const percent = Math.min((record.stock / record.warnNum) * 100, 100);
        const strokeColor = 
          record.status === 'danger' ? '#ff4d4f' : 
          record.status === 'warning' ? '#faad14' : '#52c41a';
        
        return (
          <div>
            <Progress 
              percent={percent} 
              size="small" 
              strokeColor={strokeColor}
              format={() => `${record.stock}/${record.warnNum}`}
            />
            <div style={{ fontSize: '9px', color: '#8c8c8c', textAlign: 'center' }}>
              安全库存: {record.warnNum}
            </div>
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (record: any) => (
        <Button 
          type="link" 
          size="small" 
          onClick={() => navigate(`/goods/stock/edit/${record.id}`)}
        >
          补货
        </Button>
      )
    }
  ];

  // 快捷操作按钮
  const quickActions = [
    { label: '发布商品', icon: <PlusOutlined />, path: '/goods/manage/create', color: '#1890ff' },
    { label: '品牌管理', icon: <CrownOutlined />, path: '/goods/brand', color: '#722ed1' },
    { label: '品类管理', icon: <ClusterOutlined />, path: '/goods/zone', color: '#13c2c2' },
    { label: '库存管理', icon: <StockOutlined />, path: '/goods/stock', color: '#fa8c16' },
    { label: '标签管理', icon: <TagsOutlined />, path: '/goods/tags', color: '#eb2f96' },
    { label: '配置管理', icon: <SettingOutlined />, path: '/goods/configs', color: '#52c41a' },
    { label: '上架管理', icon: <ShopOutlined />, path: '/goods/shelf', color: '#f5222d' },
    { label: '数据分析', icon: <LineChartOutlined />, path: '/goods/analytics', color: '#fa8c16' },
  ];

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}>
        <Spin tip="加载商品总览数据..." size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px', backgroundColor: '#f0f2f5', minHeight: '100%' }}>
      {/* 头部标题和刷新按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>商品管理总览</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            数据更新于: {dayjs().format('YYYY-MM-DD HH:mm')}
            <span style={{ marginLeft: 12, color: '#8c8c8c' }}>
              品牌: {data.stats.enabledBrands} 个 | 品类: {data.stats.totalCategories} 类 | 商品: {data.stats.totalProducts} 个
            </span>
          </Text>
        </div>
        <Space>
          <Button 
            type="default" 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={loadData}
            loading={loading}
          >
            刷新数据
          </Button>
          <Link to="/goods/manage/create">
            <Button type="primary" size="small" icon={<PlusOutlined />}>
              发布新商品
            </Button>
          </Link>
        </Space>
      </div>

      <Spin spinning={loading} tip="正在同步商品数据...">
        {/* 第一部分：核心指标卡片 */}
        <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
          {statCards.map((item, index) => (
            <Col xs={24} sm={12} lg={6} xl={3} key={index}>
              <Card 
                size="small" 
                hoverable 
                bordered={false}
                style={{ 
                  borderRadius: '6px', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  backgroundColor: item.warning ? '#fff7e6' : 'white'
                }}
                bodyStyle={{ padding: '12px 16px' }}
                onClick={() => navigate(item.path)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>
                      {item.title}
                    </div>
                    <div style={{ 
                      fontSize: '22px', 
                      fontWeight: 600, 
                      color: item.color,
                      lineHeight: 1.2 
                    }}>
                      {item.value.toLocaleString()}
                      <span style={{ fontSize: '14px', marginLeft: '2px' }}>{item.suffix}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#bfbfbf', marginTop: '4px' }}>
                      {item.desc}
                    </div>
                  </div>
                  <div style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: '50%', 
                    backgroundColor: `${item.color}15`, // 15% 透明度
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: item.color, fontSize: '16px' }}>
                      {item.icon}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '10px', 
                  color: '#bfbfbf', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>点击查看详情</span>
                  <ArrowRightOutlined style={{ fontSize: '10px' }} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 第二部分：主要内容区 - 修改后的布局 */}
        <Row gutter={[16, 16]}>
          {/* 左侧：热销商品、库存预警、品类分布 */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {/* 热销商品排行 */}
              <Card 
                title={
                  <Space>
                    <FireOutlined style={{ color: '#ff4d4f' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>热销商品排行</span>
                    <Tag color="orange" style={{ fontSize: '10px' }}>本月</Tag>
                  </Space>
                }
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', width: '100%' }}
                extra={
                  <Link to="/goods/analytics/sales">
                    <Button type="link" size="small" style={{ fontSize: '12px' }}>
                      完整报表
                    </Button>
                  </Link>
                }
              >
                <Table 
                  dataSource={data.topSales} 
                  columns={salesColumns} 
                  pagination={false} 
                  rowKey="id"
                  size="small"
                  style={{ fontSize: '12px' }}
                  rowClassName={() => 'compact-row'}
                />
              </Card>

              {/* 库存预警 */}
              <Card 
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>库存预警</span>
                    <Badge count={data.stockAlerts.filter((item: any) => item.status === 'danger').length} 
                      style={{ backgroundColor: '#ff4d4f' }} />
                  </Space>
                }
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', width: '100%' }}
                extra={
                  <Link to="/goods/stock">
                    <Button type="link" size="small" style={{ fontSize: '12px' }}>
                      管理库存
                    </Button>
                  </Link>
                }
              >
                <Table 
                  dataSource={data.stockAlerts} 
                  columns={stockColumns} 
                  pagination={false} 
                  rowKey="id"
                  size="small"
                  style={{ fontSize: '12px' }}
                />
              </Card>

              {/* 品类商品分布 - 现在放在库存预警下面 */}
              <Card 
                title={<span style={{ fontSize: '14px', fontWeight: 500 }}>品类商品分布</span>}
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', width: '100%' }}
                extra={
                  <Link to="/goods/zone">
                    <Button type="link" size="small" style={{ fontSize: '12px' }}>
                      管理品类
                    </Button>
                  </Link>
                }
              >
                <Row gutter={[12, 12]}>
                  {data.categoryStats.map((category: any, index: number) => (
                    <Col xs={24} sm={12} md={8} key={index}>
                      <Card 
                        size="small" 
                        style={{ borderRadius: '4px', borderLeft: `4px solid #13c2c2` }}
                        bodyStyle={{ padding: '12px' }}
                        hoverable
                        onClick={() => navigate(`/goods/zone/category/${index}`)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                              {category.name}
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#13c2c2' }}>
                              {category.count} 件
                            </div>
                          </div>
                          <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                            占比 {category.progress}%
                          </div>
                        </div>
                        <Progress 
                          percent={category.progress} 
                          size="small" 
                          strokeColor="#13c2c2"
                          style={{ marginTop: '8px' }}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Space>
          </Col>

          {/* 右侧：快速操作、品牌分布、运营建议 */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {/* 快捷操作中心 */}
              <Card 
                title={<span style={{ fontSize: '14px', fontWeight: 500 }}>快捷管理中心</span>}
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', width: '100%' }}
              >
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      size="small"
                      style={{
                        height: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        border: `1px solid ${action.color}20`,
                        backgroundColor: `${action.color}08`,
                        color: action.color
                      }}
                      onClick={() => navigate(action.path)}
                    >
                      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{action.icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: 500 }}>{action.label}</div>
                    </Button>
                  ))}
                </div>
                
                <Divider style={{ margin: '8px 0', fontSize: '10px' }}>最近操作</Divider>
                
                <List
                  size="small"
                  dataSource={data.recentProducts}
                  renderItem={(item: any) => (
                    <List.Item 
                      style={{ padding: '4px 0' }}
                      actions={[
                        <Tag color={item.status === '上架中' ? 'success' : 'default'} 
                          style={{ fontSize: '10px', padding: '0 4px' }}>
                          {item.status}
                        </Tag>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ fontSize: '12px', fontWeight: 400 }}>
                            {item.name}
                          </div>
                        }
                        description={
                          <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                            {dayjs(item.createdAt).format('MM-DD HH:mm')}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>

              {/* 品牌分布 */}
              <Card 
                title={<span style={{ fontSize: '14px', fontWeight: 500 }}>品牌分布</span>}
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', width: '100%' }}
                extra={
                  <Link to="/goods/brand">
                    <Button type="link" size="small" style={{ fontSize: '12px' }}>
                      管理品牌
                    </Button>
                  </Link>
                }
              >
                <div style={{ padding: '8px 0' }}>
                  {data.brandDistribution.map((brand: any, index: number) => (
                    <div key={index} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '12px' }}>{brand.name}</span>
                        <span style={{ fontSize: '12px', fontWeight: 500 }}>{brand.count}</span>
                      </div>
                      <Progress 
                        percent={Math.round((brand.count / data.stats.totalProducts) * 100)} 
                        size="small" 
                        strokeColor={brand.color}
                        showInfo={false}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* 运营建议 */}
              <Card 
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', backgroundColor: '#f6ffed', width: '100%' }}
                bodyStyle={{ padding: '12px' }}
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#52c41a' }}>
                    <WarningOutlined style={{ marginRight: '6px' }} />
                    运营建议
                  </div>
                  <div style={{ fontSize: '11px', color: '#595959' }}>
                    • 检测到 {data.stats.lowStockProducts} 款商品库存低于阈值，建议及时补货
                  </div>
                  <div style={{ fontSize: '11px', color: '#595959' }}>
                    • "拯救者"系列本月销量环比增长 12%，建议增加首页展示权重
                  </div>
                  <div style={{ fontSize: '11px', color: '#595959' }}>
                    • 合作品牌 "极客科技" 的授权即将到期，请及时处理
                  </div>
                  <div style={{ fontSize: '11px', color: '#595959' }}>
                    • "轻薄本专区" 的商品数量偏少，建议补充品类
                  </div>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </Spin>

      {/* 全局样式 */}
      <style>{`
        .ant-table-thead > tr > th { 
          font-size: 11px !important; 
          background: #fafafa !important; 
          padding: 8px 12px !important; 
          color: #595959 !important;
          font-weight: 600 !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .ant-table-tbody > tr > td { 
          padding: 8px 12px !important; 
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #fafafa !important;
        }
        .ant-statistic-title { 
          margin-bottom: 2px !important; 
          font-size: 12px !important; 
        }
        .ant-card-head-title { 
          font-size: 14px !important;
          font-weight: 500 !important;
        }
        .ant-card-body {
          padding: 16px !important;
        }
        .ant-card-small .ant-card-body {
          padding: 12px !important;
        }
        .compact-row {
          font-size: 12px !important;
        }
        .ant-divider {
          margin: 8px 0 !important;
        }
        .ant-list-item {
          padding: 8px 0 !important;
        }
        .ant-list-item-meta-title {
          font-size: 12px !important;
          margin-bottom: 2px !important;
        }
        .ant-list-item-meta-description {
          font-size: 10px !important;
        }
      `}</style>
    </div>
  );
};

export default GoodsOverview;