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
  List
} from 'antd';
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
  LineChartOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

// 导入工具函数
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';

// 导入API
import * as api from '../../../services/api';
import type { 
  BrandResponse, 
  CategoryResponse, 
  ProductListItem, 
  StockResponse,
  ProductStatsResponse,
  ShelfStatsResponse,
  OrderListItem,
  OrderItemResponse,
  TagResponse
} from '../../../services/api-type';

const { Title, Text } = Typography;

interface CategoryStats {
  category_id: string;
  category_name: string;
  product_count: number;
  shelf_product_count?: number;
}

interface BrandStats {
  brand_id: string;
  brand_name: string;
  product_count: number;
}

interface StockAlertItem {
  product_config_id: string;
  product_id: string;
  product_name: string;
  config1: string;
  config2: string;
  config3: string | null;
  stock_num: number;
  warn_num: number;
  status: 'danger' | 'warning' | 'normal';
}

interface TopProduct {
  product_id: string;
  product_name: string;
  category_name?: string;
  brand_name?: string;
  main_image?: string | null;
  sales_count: number;
  order_count: number;
  revenue: number;
}

interface BrandDistribution {
  name: string;
  count: number;
  color: string;
}

const GoodsOverview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 添加这行来获取location
  
  // 构建返回状态函数
  const buildRouteState = () => {
    return { 
      from: location.pathname + location.search 
    };
  };
  
  const [loading, setLoading] = useState(true);
  
  // 真实数据状态
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [productStats, setProductStats] = useState<ProductStatsResponse | null>(null);
  const [shelfStats, setShelfStats] = useState<ShelfStatsResponse[]>([]);
  
  // 计算出的数据
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [brandStats, setBrandStats] = useState<BrandStats[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlertItem[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductListItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [totalSKUCount, setTotalSKUCount] = useState(0);
  const [lowStockSKUCount, setLowStockSKUCount] = useState(0);
  const [outOfStockSKUCount, setOutOfStockSKUCount] = useState(0);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [todaySales, setTodaySales] = useState({ count: 0, revenue: 0 });

  // 品牌分布
  const [brandDistribution, setBrandDistribution] = useState<BrandDistribution[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 并行获取所有数据
      const [
        brandsRes, 
        categoriesRes, 
        productsRes, 
        stocksRes,
        ordersRes,
        tagsRes,
        productStatsRes,
        shelfStatsRes
      ] = await Promise.allSettled([
        api.getBrands(),
        api.getCategories(),
        api.getProducts(),
        api.getStocks(),
        api.getOrders({ page: 1, page_size: 100 }),
        api.getTags(),
        api.getProductStats(),
        api.getShelfStats()
      ]);

      // 处理API响应
      const loadedBrands = brandsRes.status === 'fulfilled' ? brandsRes.value : [];
      const loadedCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : [];
      const loadedProducts = productsRes.status === 'fulfilled' ? productsRes.value : [];
      const loadedStocks = stocksRes.status === 'fulfilled' ? stocksRes.value : [];
      const loadedOrders = ordersRes.status === 'fulfilled' ? ordersRes.value : [];
      const loadedTags = tagsRes.status === 'fulfilled' ? tagsRes.value : [];
      const loadedProductStats = productStatsRes.status === 'fulfilled' ? productStatsRes.value : null;
      const loadedShelfStats = shelfStatsRes.status === 'fulfilled' ? shelfStatsRes.value : [];

      // 设置基础数据
      setBrands(loadedBrands);
      setCategories(loadedCategories);
      setProducts(loadedProducts);
      setStocks(loadedStocks);
      setOrders(loadedOrders);
      setTags(loadedTags);
      setProductStats(loadedProductStats);
      setShelfStats(loadedShelfStats);

      // 计算今日销售数据
      const today = dayjs().format('YYYY-MM-DD');
      let todaySalesCount = 0;
      let todayRevenue = 0;
      
      // 统计商品销售数据
      const productSalesMap: Record<string, {
        product_id: string;
        sales_count: number;
        order_count: number;
        revenue: number;
      }> = {};
      
      loadedOrders.forEach(order => {
        const orderDate = dayjs(order.created_at).format('YYYY-MM-DD');
        const isToday = orderDate === today;
        
        order.items.forEach((item: OrderItemResponse) => {
          if (!productSalesMap[item.product_id]) {
            productSalesMap[item.product_id] = {
              product_id: item.product_id,
              sales_count: 0,
              order_count: 0,
              revenue: 0
            };
          }
          
          productSalesMap[item.product_id].sales_count += item.quantity;
          productSalesMap[item.product_id].order_count += 1;
          productSalesMap[item.product_id].revenue += item.pay_amount_snapshot as number;
          
          if (isToday) {
            todaySalesCount += item.quantity;
            todayRevenue += item.pay_amount_snapshot as number;
          }
        });
      });
      
      setTodaySales({ count: todaySalesCount, revenue: todayRevenue });

      // 计算热销商品排行榜
      const computedTopProducts: TopProduct[] = [];
      
      Object.entries(productSalesMap).forEach(([productId, salesData]) => {
        const product = loadedProducts.find(p => p.product_id === productId);
        if (product) {
          computedTopProducts.push({
            product_id: productId,
            product_name: product.name,
            category_name: product.category_name,
            brand_name: product.brand_name,
            main_image: product.main_image,
            sales_count: salesData.sales_count,
            order_count: salesData.order_count,
            revenue: salesData.revenue
          });
        }
      });
      
      // 按销售数量排序，取前5名
      const sortedTopProducts = computedTopProducts
        .sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, 5);
      
      setTopProducts(sortedTopProducts);
      
      // 计算总销售数量
      const totalSales = Object.values(productSalesMap).reduce((sum, item) => sum + item.sales_count, 0);
      setTotalSalesCount(totalSales);

      // 计算品类统计
      const categoryCounts: Record<string, { name: string; count: number }> = {};
      loadedProducts.forEach(product => {
        if (!categoryCounts[product.category_id]) {
          categoryCounts[product.category_id] = {
            name: product.category_name || product.category_id,
            count: 0
          };
        }
        categoryCounts[product.category_id].count++;
      });

      const computedCategoryStats = Object.entries(categoryCounts).map(([id, data]) => {
        const shelfStat = loadedShelfStats.find(s => s.category_id === id);
        return {
          category_id: id,
          category_name: data.name,
          product_count: data.count,
          shelf_product_count: shelfStat?.shelf_product_count || 0
        };
      }).sort((a, b) => b.product_count - a.product_count).slice(0, 6);

      setCategoryStats(computedCategoryStats);

      // 计算品牌统计
      const brandCounts: Record<string, { name: string; count: number }> = {};
      loadedProducts.forEach(product => {
        if (!brandCounts[product.brand_id]) {
          brandCounts[product.brand_id] = {
            name: product.brand_name || product.brand_id,
            count: 0
          };
        }
        brandCounts[product.brand_id].count++;
      });

      const computedBrandStats = Object.entries(brandCounts)
        .map(([id, data]) => ({
          brand_id: id,
          brand_name: data.name,
          product_count: data.count
        }))
        .sort((a, b) => b.product_count - a.product_count)
        .slice(0, 5);

      setBrandStats(computedBrandStats);

      // 计算品牌分布
      const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#8c8c8c'];
      const distribution: BrandDistribution[] = computedBrandStats.map((brand, index) => ({
        name: brand.brand_name,
        count: brand.product_count,
        color: colors[index] || colors[colors.length - 1]
      }));
      
      // 添加"其他"品牌
      const otherCount = loadedProducts.length - distribution.reduce((sum, brand) => sum + brand.count, 0);
      if (otherCount > 0) {
        distribution.push({
          name: '其他',
          count: otherCount,
          color: colors[colors.length - 1]
        });
      }
      
      setBrandDistribution(distribution);

      // 计算库存预警
      const alertItems: StockAlertItem[] = [];
      let skuCount = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      // 按商品分组统计SKU
      const productConfigPromises = loadedProducts.map(async (product) => {
        try {
          const configs = await api.getProductConfigs(product.product_id);
          skuCount += configs.length;
          
          configs.forEach(config => {
            const stockInfo = loadedStocks.find(s => s.config_id === config.product_config_id);
            const stockNum = stockInfo?.stock_num || 0;
            const warnNum = stockInfo?.warn_num || 10;
            
            if (stockNum === 0) {
              outOfStockCount++;
            } else if (stockNum <= warnNum) {
              lowStockCount++;
            }
            
            if (stockNum <= warnNum) {
              alertItems.push({
                product_config_id: config.product_config_id,
                product_id: product.product_id,
                product_name: product.name,
                config1: config.config1,
                config2: config.config2,
                config3: config.config3,
                stock_num: stockNum,
                warn_num: warnNum,
                status: stockNum === 0 ? 'danger' : (stockNum <= Math.ceil(warnNum / 2) ? 'danger' : 'warning')
              });
            }
          });
        } catch (error) {
          console.error(`获取商品 ${product.product_id} 的配置失败:`, error);
        }
      });

      await Promise.all(productConfigPromises);
      
      setTotalSKUCount(skuCount);
      setLowStockSKUCount(lowStockCount);
      setOutOfStockSKUCount(outOfStockCount);
      
      // 按库存数量排序，显示最紧急的预警
      const sortedAlerts = alertItems
        .sort((a, b) => a.stock_num - b.stock_num)
        .slice(0, 4);
      
      setStockAlerts(sortedAlerts);

      // 获取最近添加的商品（按创建时间倒序）
      const sortedProducts = [...loadedProducts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4);
      
      setRecentProducts(sortedProducts);

      globalMessage.success('数据加载完成');
    } catch (error) {
      console.error('加载数据失败:', error);
      globalMessage.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 统计卡片配置 - 修改标签卡片
  const statCards = [
    {
      title: '商品总数',
      value: products.length || 0,
      icon: <ShoppingOutlined />,
      color: '#1890ff',
      suffix: '个',
      desc: '全部商品数量',
      onClick: () => navigate('/goods/manage/list', { state: buildRouteState() })
    },
    {
      title: '在售商品',
      value: products.filter(p => p.status === '正常').length || 0,
      icon: <ShopOutlined />,
      color: '#52c41a',
      suffix: '个',
      desc: '当前可购买',
      onClick: () => navigate('/goods/manage/list', { state: { from: 'overview', status: '正常' } })
    },
    {
      title: '库存预警',
      value: lowStockSKUCount,
      icon: <WarningOutlined />,
      color: '#faad14',
      suffix: '个',
      desc: '低于安全库存',
      warning: true,
      onClick: () => navigate('/goods/configs', { state: buildRouteState() })
    },
    {
      title: '合作品牌',
      value: brands.filter(b => b.status === '启用').length || 0,
      icon: <CrownOutlined />,
      color: '#722ed1',
      suffix: '个',
      desc: '品牌合作伙伴',
      onClick: () => navigate('/goods/brand', { state: buildRouteState() })
    },
    {
      title: '商品品类',
      value: categories.filter(c => c.status === '启用').length || 0,
      icon: <ClusterOutlined />,
      color: '#13c2c2',
      suffix: '类',
      desc: '分类体系',
      onClick: () => navigate('/goods/zone', { state: buildRouteState() })
    },
    {
      title: '标签总数',
      value: tags.filter(t => t.status === '启用').length || 0,
      icon: <TagsOutlined />,
      color: '#eb2f96',
      suffix: '个',
      desc: '商品标签',
      onClick: () => navigate('/goods/tag', { state: buildRouteState() }) // 修改这里，跳转到tag管理页面
    },
    {
      title: 'SKU总数',
      value: totalSKUCount,
      icon: <DatabaseOutlined />,
      color: '#fa8c16',
      suffix: '款',
      desc: '库存单位',
      onClick: () => navigate('/goods/configs', { state: buildRouteState() })
    },
    {
      title: '今日订单',
      value: todaySales.count,
      icon: <ShoppingCartOutlined />,
      color: '#f5222d',
      suffix: '单',
      desc: '今日新增',
      onClick: () => navigate('/orders', { state: buildRouteState() })
    }
  ];

  // 热销商品列定义
  const topSalesColumns = [
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
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
      render: (text: string, record: TopProduct) => (
        <Space size="small" align="start">
          {record.main_image ? (
            <Image 
              src={getImageUrl(record.main_image)} 
              width={36} 
              height={36} 
              style={{ borderRadius: '4px', border: '1px solid #f0f0f0' }}
              preview={false}
            />
          ) : (
            <div style={{ 
              width: 36, 
              height: 36, 
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AppstoreOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.2 }}>{text}</div>
            <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
              {record.brand_name} · {record.category_name}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '销售额',
      key: 'revenue',
      width: 100,
      align: 'right' as const,
      render: (record: TopProduct) => (
        <Text style={{ fontSize: '12px', fontWeight: 600, color: '#f5222d' }}>
          ¥{record.revenue.toLocaleString()}
        </Text>
      )
    },
    {
      title: '周期销量',
      key: 'sales',
      width: 100,
      align: 'center' as const,
      render: (record: TopProduct) => (
        <div>
          <Tag color="orange" style={{ fontSize: '10px', borderRadius: '10px', padding: '0 8px' }}>
            {record.sales_count.toLocaleString()} 件
          </Tag>
          <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: 2 }}>
            平均日销: {Math.round(record.sales_count/30)}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (record: TopProduct) => (
        <Space size={0}>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/goods/manage/detail/${record.product_id}`, { state: buildRouteState() })}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => navigate(`/goods/manage/edit/${record.product_id}`, { state: buildRouteState() })}
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
      dataIndex: 'product_name',
      key: 'name',
      width: 180,
      render: (text: string, record: StockAlertItem) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
            {record.config1} / {record.config2} {record.config3 ? `/ ${record.config3}` : ''}
          </div>
        </div>
      )
    },
    {
      title: '库存状态',
      key: 'status',
      width: 100,
      render: (record: StockAlertItem) => {
        let statusColor = '#52c41a';
        let statusText = '充足';
        let icon = <CheckCircleOutlined />;
        
        if (record.status === 'warning') {
          statusColor = '#faad14';
          statusText = '预警';
          icon = <WarningOutlined />;
        } else if (record.status === 'danger') {
          statusColor = '#ff4d4f';
          statusText = '紧急';
          icon = <StopOutlined />;
        }
        
        return (
          <div>
            <Tag color={statusColor} style={{ fontSize: '10px', borderRadius: '10px' }}>
              {icon} {statusText}
            </Tag>
            <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: 2 }}>
              库存: {record.stock_num}
            </div>
          </div>
        );
      }
    },
    {
      title: '库存进度',
      key: 'progress',
      width: 150,
      render: (record: StockAlertItem) => {
        const percent = Math.min((record.stock_num / record.warn_num) * 100, 100);
        const strokeColor = record.status === 'danger' ? '#ff4d4f' : 
                          record.status === 'warning' ? '#faad14' : '#52c41a';
        
        return (
          <div>
            <Progress 
              percent={percent} 
              size="small" 
              strokeColor={strokeColor}
              format={() => `${record.stock_num}/${record.warn_num}`}
            />
            <div style={{ fontSize: '9px', color: '#8c8c8c', textAlign: 'center' }}>
              安全库存: {record.warn_num}
            </div>
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (record: StockAlertItem) => (
        <Button 
          type="link" 
          size="small" 
          onClick={() => navigate(`/goods/stock/edit/${record.product_config_id}`, { state: buildRouteState() })}
        >
          补货
        </Button>
      )
    }
  ];

  // 快捷操作按钮 - 修改标签管理按钮
  const quickActions = [
    { 
      label: '发布商品', 
      icon: <PlusOutlined />, 
      color: '#1890ff',
      onClick: () => navigate('/goods/manage/create', { state: buildRouteState() })
    },
    { 
      label: '品牌管理', 
      icon: <CrownOutlined />, 
      color: '#722ed1',
      onClick: () => navigate('/goods/brand', { state: buildRouteState() })
    },
    { 
      label: '品类管理', 
      icon: <ClusterOutlined />, 
      color: '#13c2c2',
      onClick: () => navigate('/goods/zone', { state: buildRouteState() })
    },
    { 
      label: '库存管理', 
      icon: <StockOutlined />, 
      color: '#fa8c16',
      onClick: () => navigate('/goods/stock', { state: buildRouteState() })
    },
    { 
      label: '标签管理', 
      icon: <TagsOutlined />, 
      color: '#eb2f96',
      onClick: () => navigate('/goods/tag', { state: buildRouteState() }) // 修改这里，跳转到tag管理页面
    },
    { 
      label: '配置管理', 
      icon: <SettingOutlined />, 
      color: '#52c41a',
      onClick: () => navigate('/goods/configs', { state: buildRouteState() })
    },
    { 
      label: '上架管理', 
      icon: <ShopOutlined />, 
      color: '#f5222d',
      onClick: () => navigate('/goods/shelf', { state: buildRouteState() })
    },
    { 
      label: '数据分析', 
      icon: <LineChartOutlined />, 
      color: '#fa8c16',
      onClick: () => navigate('/goods/analytics', { state: buildRouteState() })
    }
  ];

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case '正常':
        return <Tag color="success" style={{ fontSize: '10px', padding: '0 4px' }}>上架中</Tag>;
      case '下架':
        return <Tag color="default" style={{ fontSize: '10px', padding: '0 4px' }}>已下架</Tag>;
      default:
        return <Tag color="warning" style={{ fontSize: '10px', padding: '0 4px' }}>{status}</Tag>;
    }
  };

  if (loading && products.length === 0) {
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
              品牌: {brands.filter(b => b.status === '启用').length} 个 | 品类: {categories.filter(c => c.status === '启用').length} 类 | 商品: {products.length} 个 | 标签: {tags.filter(t => t.status === '启用').length} 个
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
          <Button 
            type="primary" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/goods/manage/create', { state: buildRouteState() })}
          >
            发布新商品
          </Button>
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
                onClick={item.onClick}
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
                    backgroundColor: `${item.color}15`,
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

        {/* 第二部分：主要内容区 */}
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
                    <Tag color="orange" style={{ fontSize: '10px' }}>累计销量</Tag>
                  </Space>
                }
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', width: '100%' }}
                extra={
                  <Link to="/orders" state={buildRouteState()}>
                    <Button type="link" size="small" style={{ fontSize: '12px' }}>
                      查看订单
                    </Button>
                  </Link>
                }
              >
                {topProducts.length > 0 ? (
                  <Table 
                    dataSource={topProducts} 
                    columns={topSalesColumns} 
                    pagination={false} 
                    rowKey="product_id"
                    size="small"
                    style={{ fontSize: '12px' }}
                    rowClassName={() => 'compact-row'}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <ShoppingCartOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
                    <div style={{ marginTop: 8, color: '#8c8c8c' }}>暂无销售数据</div>
                    <Link to="/orders" state={buildRouteState()}>
                      <Button type="link" size="small">查看订单</Button>
                    </Link>
                  </div>
                )}
              </Card>

              {/* 库存预警 */}
              <Card 
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>库存预警</span>
                    <Badge count={stockAlerts.filter(item => item.status === 'danger').length} 
                      style={{ backgroundColor: '#ff4d4f' }} />
                  </Space>
                }
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', width: '100%' }}
                extra={
                  <Link to="/goods/configs" state={buildRouteState()}>
                    <Button type="link" size="small" style={{ fontSize: '12px' }}>
                      管理库存
                    </Button>
                  </Link>
                }
              >
                {stockAlerts.length > 0 ? (
                  <Table 
                    dataSource={stockAlerts} 
                    columns={stockColumns} 
                    pagination={false} 
                    rowKey="product_config_id"
                    size="small"
                    style={{ fontSize: '12px' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    <div style={{ marginTop: 8, color: '#8c8c8c' }}>暂无库存预警</div>
                  </div>
                )}
              </Card>

              {/* 品类商品分布 */}
              <Card 
                title={<span style={{ fontSize: '14px', fontWeight: 500 }}>品类商品分布</span>}
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', width: '100%' }}
                extra={
                  <Link to="/goods/zone" state={buildRouteState()}>
                    <Button type="link" size="small" style={{ fontSize: '12px' }}>
                      管理品类
                    </Button>
                  </Link>
                }
              >
                {categoryStats.length > 0 ? (
                  <Row gutter={[12, 12]}>
                    {categoryStats.map((category, index) => {
                      const colors = ['#13c2c2', '#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96'];
                      const color = colors[index % colors.length];
                      const maxCount = Math.max(...categoryStats.map(c => c.product_count));
                      const progress = Math.round((category.product_count / maxCount) * 100);
                      
                      return (
                        <Col xs={24} sm={12} md={8} key={index}>
                          <Card 
                            size="small" 
                            style={{ borderRadius: '4px', borderLeft: `4px solid ${color}` }}
                            bodyStyle={{ padding: '12px' }}
                            hoverable
                            onClick={() => navigate(`/goods/manage/list?category_id=${category.category_id}`, { state: buildRouteState() })}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                                  {category.category_name}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: color }}>
                                  {category.product_count} 件
                                </div>
                              </div>
                              <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                                占比 {progress}%
                              </div>
                            </div>
                            <Progress 
                              percent={progress} 
                              size="small" 
                              strokeColor={color}
                              style={{ marginTop: '8px' }}
                            />
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <ClusterOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
                    <div style={{ marginTop: 8, color: '#8c8c8c' }}>暂无品类数据</div>
                  </div>
                )}
              </Card>
            </Space>
          </Col>

          {/* 右侧：快速操作、品牌分布、最近商品、运营建议 */}
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
                      onClick={action.onClick}
                    >
                      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{action.icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: 500 }}>{action.label}</div>
                    </Button>
                  ))}
                </div>
                
                <Divider style={{ margin: '8px 0', fontSize: '10px' }}>最近添加的商品</Divider>
                
                {recentProducts.length > 0 ? (
                  <List
                    size="small"
                    dataSource={recentProducts}
                    renderItem={(item) => (
                      <List.Item 
                        style={{ padding: '4px 0' }}
                        actions={[
                          getStatusTag(item.status)
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            item.main_image ? (
                              <Image 
                                src={getImageUrl(item.main_image)} 
                                width={36} 
                                height={36}
                                style={{ borderRadius: '4px', objectFit: 'cover' }}
                                preview={false}
                              />
                            ) : (
                              <div style={{ 
                                width: 36, 
                                height: 36, 
                                backgroundColor: '#f5f5f5', 
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <AppstoreOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
                              </div>
                            )
                          }
                          title={
                            <div style={{ fontSize: '12px', fontWeight: 400 }}>
                              {item.name}
                            </div>
                          }
                          description={
                            <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                              {dayjs(item.created_at).format('MM-DD HH:mm')}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <AppstoreOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
                    <div style={{ marginTop: 8, color: '#8c8c8c' }}>暂无最近添加的商品</div>
                  </div>
                )}
              </Card>

              {/* 品牌分布 */}
              <Card 
                title={<span style={{ fontSize: '14px', fontWeight: 500 }}>品牌分布</span>}
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', width: '100%' }}
                extra={
                  <Link to="/goods/brand" state={buildRouteState()}>
                    <Button type="link" size="small" style={{ fontSize: '12px' }}>
                      管理品牌
                    </Button>
                  </Link>
                }
              >
                {brandDistribution.length > 0 ? (
                  <div style={{ padding: '8px 0' }}>
                    {brandDistribution.map((brand, index) => (
                      <div key={index} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '12px' }}>{brand.name}</span>
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>{brand.count}</span>
                        </div>
                        <Progress 
                          percent={products.length > 0 ? Math.round((brand.count / products.length) * 100) : 0} 
                          size="small" 
                          strokeColor={brand.color}
                          showInfo={false}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <CrownOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
                    <div style={{ marginTop: 8, color: '#8c8c8c' }}>暂无品牌数据</div>
                  </div>
                )}
              </Card>

              {/* 标签统计 */}
              <Card 
                title={<span style={{ fontSize: '14px', fontWeight: 500 }}>标签统计</span>}
                size="small"
                bordered={false}
                style={{ borderRadius: '6px', width: '100%' }}
                extra={
                  <Link to="/goods/tag" state={buildRouteState()}>
                    <Button type="link" size="small" style={{ fontSize: '12px' }}>
                      管理标签
                    </Button>
                  </Link>
                }
              >
                <Row gutter={[12, 12]} style={{ padding: '8px 0' }}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 600, color: '#1890ff' }}>
                        {tags.filter(t => t.status === '启用').length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>启用标签</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 600, color: '#52c41a' }}>
                        {tags.filter(t => t.priority <= 10).length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>高优先级标签</div>
                    </div>
                  </Col>
                </Row>
                {tags.length > 0 ? (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>
                      常用标签
                    </div>
                    <Space size={[4, 8]} wrap>
                      {tags
                        .filter(t => t.status === '启用')
                        .sort((a, b) => a.priority - b.priority)
                        .slice(0, 6)
                        .map(tag => (
                          <Tag 
                            key={tag.tag_id}
                            color={tag.priority <= 5 ? 'orange' : 'blue'}
                            style={{ fontSize: '11px', borderRadius: '12px' }}
                          >
                            {tag.name}
                          </Tag>
                        ))}
                    </Space>
                    <div style={{ marginTop: '8px' }}>
                      <Link to="/goods/tag" state={buildRouteState()}>
                        <Button type="link" size="small" style={{ fontSize: '11px' }}>
                          查看全部标签 →
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <TagsOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
                    <div style={{ marginTop: 8, color: '#8c8c8c' }}>暂无标签数据</div>
                  </div>
                )}
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
                    • 检测到 {lowStockSKUCount} 款商品库存低于阈值，建议及时补货
                  </div>
                  <div style={{ fontSize: '11px', color: '#595959' }}>
                    • {brandDistribution[0]?.name || '主力'}系列销量领先，建议增加首页展示权重
                  </div>
                  <div style={{ fontSize: '11px', color: '#595959' }}>
                    • 今日已销售 {todaySales.count} 件商品，收入 ¥{todaySales.revenue.toLocaleString()} 元
                  </div>
                  <div style={{ fontSize: '11px', color: '#595959' }}>
                    • 有 {outOfStockSKUCount} 个SKU缺货，请及时处理
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