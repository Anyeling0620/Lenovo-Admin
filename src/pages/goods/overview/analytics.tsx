 
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space, 
  Select, 
  DatePicker,
  Table,
  Tag,
  Empty,
  Spin,
  Badge,
  Statistic,
  Divider
} from 'antd';
import { 
  ReloadOutlined, 
  LineChartOutlined,
  ShoppingOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FireOutlined,
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  AppstoreOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  type TooltipProps
} from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 导入API
import * as api from '../../../services/api';
import type { 
  OrderListItem,
  ProductListItem,
  StockResponse,
  ProductStatsResponse,
  ShelfStatsResponse,
  OrderItemResponse
} from '../../../services/api-type';

import { globalMessage } from '../../../utils/globalMessage';

interface MonthlySalesData {
  month: string;
  sales: number;
  orders: number;
  customers: number;
}

interface CategorySalesData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  sales: number;
  order_count: number;
  growth?: number;
  stock?: number;
}

interface StockAlert {
  product_config_id: string;
  product_name: string;
  config1: string;
  config2: string;
  config3: string | null;
  stock_num: number;
  warn_num: number;
  status: '紧急' | '预警' | '正常';
}

// 修复工具提示类型
interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    value?: number;
    name?: string;
    payload?: any;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
}

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // 真实数据状态
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [, setStocks] = useState<StockResponse[]>([]);
  const [productStats, setProductStats] = useState<ProductStatsResponse | null>(null);
  const [shelfStats, setShelfStats] = useState<ShelfStatsResponse[]>([]);
  
  // 计算出的数据
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [keyMetrics, setKeyMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    customerCount: 0,
    returnRate: 0
  });
  
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 并行获取基础数据
      const [ordersRes, productsRes, stocksRes, productStatsRes, shelfStatsRes] = 
        await Promise.allSettled([
          api.getOrders(),
          api.getProducts(),
          api.getStocks(),
          api.getProductStats(),
          api.getShelfStats()
        ]);

      // 处理响应
      const loadedOrders = ordersRes.status === 'fulfilled' ? ordersRes.value : [];
      const loadedProducts = productsRes.status === 'fulfilled' ? productsRes.value : [];
      const loadedStocks = stocksRes.status === 'fulfilled' ? stocksRes.value : [];
      const loadedProductStats = productStatsRes.status === 'fulfilled' ? productStatsRes.value : null;
      const loadedShelfStats = shelfStatsRes.status === 'fulfilled' ? shelfStatsRes.value : [];

      setOrders(loadedOrders);
      setProducts(loadedProducts);
      setStocks(loadedStocks);
      setProductStats(loadedProductStats);
      setShelfStats(loadedShelfStats);

      // 计算月度销售数据
      const monthlyData: Record<string, MonthlySalesData> = {};
      const categoryData: Record<string, { name: string; sales: number; count: number }> = {};
      const productSalesMap: Record<string, { name: string; sales: number; order_count: number }> = {};
      
      let totalSales = 0;
      let totalOrders = loadedOrders.length;
      let totalCustomers = 0;
      const customerSet = new Set<string>();

      loadedOrders.forEach(order => {
        const month = dayjs(order.created_at).format('YYYY-MM');
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month: dayjs(order.created_at).format('MM月'),
            sales: 0,
            orders: 0,
            customers: 0
          };
        }
        
        monthlyData[month].orders++;
        
        // 修复：使用订单的实际支付金额
        const orderAmount = Number(order.actual_pay_amount) || 0;
        monthlyData[month].sales += orderAmount;
        
        // 统计客户
        if (!customerSet.has(order.user_id)) {
          customerSet.add(order.user_id);
          monthlyData[month].customers++;
        }
        
        // 累加总销售额
        totalSales += orderAmount;
        
        // 统计每个商品的销售 - 修复：使用单价 × 数量
        order.items.forEach((item: OrderItemResponse) => {
          if (!productSalesMap[item.product_id]) {
            productSalesMap[item.product_id] = {
              name: item.name || '未知商品',
              sales: 0,
              order_count: 0
            };
          }
          
          // 修复：商品销售额 = 单价 × 数量
          const unitPrice = Number(item.pay_amount_snapshot) || 0;
          const quantity = item.quantity || 1;
          const itemTotal = unitPrice * quantity;
          
          productSalesMap[item.product_id].sales += itemTotal;
          productSalesMap[item.product_id].order_count++;
        });
      });

      totalCustomers = customerSet.size;

      // 计算品类销售占比
      loadedProducts.forEach(product => {
        if (!categoryData[product.category_id]) {
          categoryData[product.category_id] = {
            name: product.category_name || product.category_id,
            sales: 0,
            count: 0
          };
        }
        categoryData[product.category_id].count++;
      });

      // 将产品销售额分配到品类
      Object.entries(productSalesMap).forEach(([productId, salesData]) => {
        const product = loadedProducts.find(p => p.product_id === productId);
        if (product && categoryData[product.category_id]) {
          categoryData[product.category_id].sales += salesData.sales;
        }
      });

      // 准备月度数据（最近12个月）
      const sortedMonths = Object.values(monthlyData)
        .sort((a, b) => {
          const monthA = parseInt(a.month.replace('月', ''));
          const monthB = parseInt(b.month.replace('月', ''));
          return monthA - monthB;
        })
        .slice(-12);

      setMonthlySales(sortedMonths);

      // 准备品类数据
      const totalCategorySales = Object.values(categoryData).reduce((sum, cat) => sum + cat.sales, 0);
      const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];
      
      const computedCategorySales = Object.values(categoryData)
        .map((cat, index) => ({
          name: cat.name,
          value: totalCategorySales > 0 ? Math.round((cat.sales / totalCategorySales) * 100) : 0,
          color: colors[index % colors.length]
        }))
        .filter(cat => cat.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setCategorySales(computedCategorySales);

      // 计算热销商品
      const computedTopProducts = Object.entries(productSalesMap)
        .map(([productId, data]) => ({
          product_id: productId,
          product_name: data.name,
          sales: data.sales,
          order_count: data.order_count,
          growth: Math.round(Math.random() * 30) - 10 // 模拟增长率，实际应从历史数据计算
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setTopProducts(computedTopProducts);

      // 计算库存预警
      const alertItems: StockAlert[] = [];
      
      // 按商品分组处理库存预警
      const productStockPromises = loadedProducts.map(async (product) => {
        try {
          const configs = await api.getProductConfigs(product.product_id);
          
          configs.forEach(config => {
            const stockInfo = loadedStocks.find(s => s.config_id === config.product_config_id);
            const stockNum = stockInfo?.stock_num || 0;
            const warnNum = stockInfo?.warn_num || 10;
            
            if (stockNum <= warnNum) {
              let status: '紧急' | '预警' | '正常' = '正常';
              if (stockNum === 0) {
                status = '紧急';
              } else if (stockNum <= Math.ceil(warnNum / 2)) {
                status = '紧急';
              } else if (stockNum <= warnNum) {
                status = '预警';
              }
              
              alertItems.push({
                product_config_id: config.product_config_id,
                product_name: product.name,
                config1: config.config1,
                config2: config.config2,
                config3: config.config3,
                stock_num: stockNum,
                warn_num: warnNum,
                status
              });
            }
          });
        } catch (error) {
          console.error(`获取商品 ${product.product_id} 的配置失败:`, error);
        }
      });

      await Promise.all(productStockPromises);
      
      const sortedAlerts = alertItems
        .sort((a, b) => a.stock_num - b.stock_num)
        .slice(0, 4);
      
      setStockAlerts(sortedAlerts);

      // 计算关键指标
      const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
      const conversionRate = 0; // 转化率需要用户行为数据，暂无法计算
      const returnRate = 0; // 退货率需要售后数据，暂无法计算

      setKeyMetrics({
        totalSales,
        totalOrders,
        avgOrderValue,
        conversionRate,
        customerCount: totalCustomers,
        returnRate
      });

      globalMessage.success('数据分析加载完成');
    } catch (error) {
      console.error('加载数据分析失败:', error);
      globalMessage.error('加载数据分析失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 关键指标卡片
  const keyMetricCards = [
    {
      title: '总销售额',
      value: `¥${(keyMetrics.totalSales / 10000).toFixed(1)}万`,
      icon: <DollarOutlined />,
      color: '#1890ff',
      trend: 12.5, // 实际应从历史数据计算增长率
      suffix: '较上月',
      onClick: () => navigate('/orders', { state: { from: window.location.pathname } })
    },
    {
      title: '总订单数',
      value: keyMetrics.totalOrders.toLocaleString(),
      icon: <ShoppingOutlined />,
      color: '#52c41a',
      trend: 8.3,
      suffix: '较上月',
      onClick: () => navigate('/orders', { state: { from: window.location.pathname } })
    },
    {
      title: '客单价',
      value: `¥${keyMetrics.avgOrderValue}`,
      icon: <UserOutlined />,
      color: '#722ed1',
      trend: 5.2,
      suffix: '较上月',
      onClick: () => navigate('/orders', { state: { from: window.location.pathname } })
    },
    {
      title: '转化率',
      value: `${keyMetrics.conversionRate}%`,
      icon: <LineChartOutlined />,
      color: '#fa8c16',
      trend: 1.8,
      suffix: '较上月',
      onClick: () => navigate('/orders/analytics', { state: { from: window.location.pathname } })
    },
    {
      title: '客户总数',
      value: keyMetrics.customerCount.toLocaleString(),
      icon: <UserOutlined />,
      color: '#eb2f96',
      trend: 15.7,
      suffix: '累计',
      onClick: () => navigate('/users', { state: { from: window.location.pathname } })
    },
    {
      title: '退货率',
      value: `${keyMetrics.returnRate}%`,
      icon: <ArrowDownOutlined />,
      color: '#f5222d',
      trend: -0.3,
      suffix: '较上月',
      onClick: () => navigate('/after-sales', { state: { from: window.location.pathname } })
    }
  ];

  // 热销商品列定义
  const productColumns = [
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 150,
      render: (text: string) => (
        <div style={{ fontWeight: 500, fontSize: '12px' }}>
          {text}
        </div>
      )
    },
    {
      title: '销售额',
      dataIndex: 'sales',
      key: 'sales',
      width: 100,
      render: (value: number) => (
        <div style={{ fontWeight: 600, color: '#f5222d', fontSize: '12px' }}>
          ¥{value.toLocaleString()} {/* 修复：正确格式化 */}
        </div>
      )
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 80,
      render: (value: number) => (
        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
          {value} 单
        </div>
      )
    },
    {
      title: '增长趋势',
      dataIndex: 'growth',
      key: 'growth',
      width: 100,
      render: (value?: number) => {
        const numValue = value || 0;
        const isPositive = numValue > 0;
        const color = isPositive ? '#52c41a' : '#ff4d4f';
        const icon = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
        
        return (
          <Tag color={color} style={{ fontSize: '11px' }}>
            {icon} {Math.abs(numValue)}%
          </Tag>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: TopProduct) => (
        <Button 
          type="link" 
          size="small" 
          style={{ fontSize: '11px' }}
          onClick={() => {
            navigate(`/goods/manage/detail/${record.product_id}`, {
              state: { from: window.location.pathname }
            });
          }}
        >
          详情
        </Button>
      )
    }
  ];

  // 库存预警列定义
  const stockColumns = [
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 150,
      render: (text: string, record: StockAlert) => (
        <div style={{ fontSize: '12px' }}>
          {text}
          <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
            {record.config1}/{record.config2} {record.config3 ? `/${record.config3}` : ''}
          </div>
        </div>
      )
    },
    {
      title: '库存量',
      dataIndex: 'stock_num',
      key: 'stock_num',
      width: 80,
      render: (value: number) => (
        <div style={{ fontWeight: 600, color: value <= 5 ? '#ff4d4f' : '#faad14' }}>
          {value}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const color = status === '紧急' ? 'error' : status === '预警' ? 'warning' : 'success';
        return (
          <Tag color={color} style={{ fontSize: '11px' }}>
            {status}
          </Tag>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: StockAlert) => (
        <Button 
          type="link" 
          size="small" 
          style={{ fontSize: '11px' }}
          onClick={() => {
            navigate(`/goods/stock/edit/${record.product_config_id}`, {
              state: { from: window.location.pathname }
            });
          }}
        >
          补货
        </Button>
      )
    }
  ];

  // 自定义线图工具提示组件
  const CustomLineTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '12px'
        }}>
          <div style={{ marginBottom: '4px', fontWeight: '500', color: '#595959' }}>
            {label}
          </div>
          {payload.map((entry, index) => (
            <div key={index} style={{ 
              color: entry.color || '#333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2px'
            }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: '600', marginLeft: '8px' }}>
                {entry.name === '销售额' ? `¥${(entry.value || 0).toLocaleString()}` : `${entry.value} 单`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // 自定义饼图工具提示组件
  const CustomPieTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '12px'
        }}>
          <div style={{ marginBottom: '4px', fontWeight: '500', color: '#595959' }}>
            {data.name || data.payload?.name}
          </div>
          <div style={{ color: data.color, display: 'flex', justifyContent: 'space-between' }}>
            <span>占比:</span>
            <span style={{ fontWeight: '600', marginLeft: '8px' }}>
              {data.value || 0}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Pie图表标签渲染
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '12px' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}>
        <Spin tip="加载数据分析..." size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 16, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 标题和时间选择 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            商品数据分析
          </Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            数据更新时间: {dayjs().format('YYYY-MM-DD HH:mm:ss')}
          </Text>
        </div>
        <Space>
          <Select 
            value={timeRange} 
            onChange={(value) => setTimeRange(value)}
            size="small"
            style={{ width: 100 }}
          >
            <Option value="day">今日</Option>
            <Option value="week">本周</Option>
            <Option value="month">本月</Option>
            <Option value="year">本年</Option>
          </Select>
          <RangePicker 
            size="small"
            defaultValue={[dayjs().subtract(1, 'month'), dayjs()]}
          />
          <Button 
            type="primary" 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* 关键指标 */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {keyMetricCards.map((metric, index) => (
            <Col xs={24} sm={12} md={8} lg={4} key={index}>
              <Card 
                size="small" 
                bordered={false} 
                style={{ borderRadius: 6 }}
                hoverable
                onClick={metric.onClick}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>
                      {metric.title}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: metric.color, lineHeight: 1.2 }}>
                      {metric.value}
                    </div>
                    <div style={{ fontSize: '10px', color: '#bfbfbf', marginTop: 4 }}>
                      {metric.suffix}
                    </div>
                  </div>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    backgroundColor: `${metric.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: metric.color, fontSize: '14px' }}>
                      {metric.icon}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  marginTop: 8, 
                  fontSize: '10px', 
                  color: metric.trend > 0 ? '#52c41a' : '#ff4d4f',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {metric.trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(metric.trend)}%
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          {/* 销售趋势图 */}
          <Col xs={24} lg={16}>
            <Card 
              title={
                <Space>
                  <LineChartOutlined />
                  <span>销售趋势分析</span>
                </Space>
              }
              size="small"
              style={{ height: '100%' }}
            >
              <div style={{ height: 300 }}>
                {monthlySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis 
                        tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                      />
                      <Tooltip content={<CustomLineTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#1890ff" 
                        name="销售额"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#52c41a" 
                        name="订单数"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="暂无销售数据" />
                )}
              </div>
            </Card>
          </Col>

          {/* 分类占比 */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <span>品类销售占比</span>
                </Space>
              }
              size="small"
            >
              <div style={{ height: 300 }}>
                {categorySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySales}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categorySales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="暂无品类销售数据" />
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 商品排行和库存预警 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* 热销商品排行 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <FireOutlined />
                  <span>热销商品排行</span>
                </Space>
              }
              size="small"
              extra={
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => navigate('/order/manage', { state: { from: window.location.pathname } })}
                >
                  查看更多
                </Button>
              }
            >
              {topProducts.length > 0 ? (
                <Table
                  dataSource={topProducts}
                  columns={productColumns}
                  rowKey="product_id"
                  size="small"
                  pagination={false}
                  style={{ fontSize: '12px' }}
                />
              ) : (
                <Empty description="暂无热销商品数据" />
              )}
            </Card>
          </Col>

          {/* 库存预警 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <ShoppingOutlined />
                  <span>库存预警</span>
                  <Badge count={stockAlerts.filter(item => item.status === '紧急').length} 
                    style={{ backgroundColor: '#ff4d4f' }} />
                </Space>
              }
              size="small"
              extra={
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => navigate('/goods/configs', { state: { from: window.location.pathname } })}
                >
                  去管理
                </Button>
              }
            >
              {stockAlerts.length > 0 ? (
                <Table
                  dataSource={stockAlerts}
                  columns={stockColumns}
                  rowKey="product_config_id"
                  size="small"
                  pagination={false}
                  style={{ fontSize: '12px' }}
                />
              ) : (
                <Empty description="暂无库存预警" />
              )}
            </Card>
          </Col>
        </Row>

        {/* 更多分析卡片 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card 
              title="商品运营建议"
              size="small"
              style={{ height: '100%' }}
            >
              <div style={{ padding: '8px' }}>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '12px' }}>
                  <li style={{ marginBottom: 8 }}>
                    <strong>库存优化：</strong>
                    检测到 {stockAlerts.filter(item => item.status === '紧急').length} 个商品库存紧急，
                    建议及时补货以避免影响销售
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>销售策略：</strong>
                    {topProducts.length > 0 ? (
                      <span>"{topProducts[0]?.product_name}" 销售额最高，建议加大推广力度</span>
                    ) : (
                      '暂无热销商品数据'
                    )}
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>品类优化：</strong>
                    {categorySales.length > 0 ? (
                      <span>"{categorySales[0]?.name}" 品类销售额占比最高 ({categorySales[0]?.value}%)</span>
                    ) : (
                      '暂无品类销售数据'
                    )}
                  </li>
                  <li>
                    <strong>客户分析：</strong>
                    累计客户 {keyMetrics.customerCount} 人，
                    客单价 ¥{keyMetrics.avgOrderValue}
                  </li>
                </ul>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card 
              title="数据概览"
              size="small"
              style={{ height: '100%' }}
            >
              <div style={{ padding: '12px' }}>
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Statistic 
                      title="商品总数" 
                      value={productStats?.total || products.length || 0} 
                      prefix={<AppstoreOutlined />}
                      valueStyle={{ color: '#1890ff', fontSize: 18 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="在售商品" 
                      value={productStats?.normal || products.filter(p => p.status === '正常').length || 0} 
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#52c41a', fontSize: 18 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="上架商品" 
                      value={shelfStats.reduce((sum, stat) => sum + stat.shelf_product_count, 0) || 0} 
                      prefix={<ShopOutlined />}
                      valueStyle={{ color: '#fa8c16', fontSize: 18 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="库存预警" 
                      value={stockAlerts.length} 
                      prefix={<WarningOutlined />}
                      valueStyle={{ color: '#f5222d', fontSize: 18 }}
                    />
                  </Col>
                </Row>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                  数据周期: {dayjs().subtract(1, 'month').format('MM-DD')} ~ {dayjs().format('MM-DD')}
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 样式覆盖 */}
        <style>{`
          .ant-card-head-title { font-size: 14px !important; }
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
            font-size: 12px !important;
          }
          .ant-table-tbody > tr:hover > td {
            background-color: #fafafa !important;
          }
          .recharts-tooltip-wrapper { font-size: 12px !important; }
          .ant-statistic-title { 
            margin-bottom: 2px !important; 
            font-size: 12px !important; 
          }
          .ant-divider {
            margin: 8px 0 !important;
          }
        `}</style>
      </Spin>
    </div>
  );
};

export default AnalyticsPage;