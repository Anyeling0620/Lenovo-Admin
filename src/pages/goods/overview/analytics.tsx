/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Badge
} from 'antd';
import { 
  ReloadOutlined, 
  LineChartOutlined,
  ShoppingOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FireOutlined,
  StarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { 
  BarChart, 
  Bar, 
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
  ResponsiveContainer 
} from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 模拟数据
const generateAnalyticsData = () => {
  const now = dayjs();
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  return {
    // 关键指标
    keyMetrics: {
      totalSales: 1256000,
      totalOrders: 4521,
      avgOrderValue: 278,
      conversionRate: 3.2,
      customerCount: 28542,
      returnRate: 2.1
    },
    
    // 月度销售数据
    monthlySales: months.slice(0, now.month() + 1).map((month, _index) => ({
      month,
      sales: Math.floor(Math.random() * 200000) + 80000,
      orders: Math.floor(Math.random() * 500) + 200,
      customers: Math.floor(Math.random() * 3000) + 1000
    })),
    
    // 商品分类销售占比
    categorySales: [
      { name: '游戏本', value: 35, color: '#1890ff' },
      { name: '商务本', value: 25, color: '#52c41a' },
      { name: '轻薄本', value: 20, color: '#fa8c16' },
      { name: '配件', value: 12, color: '#722ed1' },
      { name: '外设', value: 8, color: '#eb2f96' }
    ],
    
    // 热销商品排行
    topProducts: [
      { id: 1, name: '拯救者 Y9000P', sales: 452000, growth: 12.5, stock: 45 },
      { id: 2, name: '小新 Pro 16', sales: 388000, growth: 8.3, stock: 32 },
      { id: 3, name: 'ThinkPad X1 Carbon', sales: 215000, growth: -2.1, stock: 18 },
      { id: 4, name: '联想固态硬盘', sales: 189000, growth: 15.7, stock: 120 },
      { id: 5, name: 'Legion电竞鼠标', sales: 156000, growth: 23.4, stock: 67 }
    ],
    
    // 库存预警
    stockAlerts: [
      { id: 1, name: '拯救者 Y7000P', stock: 3, status: '紧急' },
      { id: 2, name: 'ThinkBook 14+', stock: 8, status: '预警' },
      { id: 3, name: 'YOGA Air 14s', stock: 5, status: '紧急' },
      { id: 4, name: '联想扩展坞', stock: 12, status: '正常' }
    ]
  };
};

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(generateAnalyticsData());
    } catch (error) {
      console.error('加载数据失败', error);
      setData(generateAnalyticsData());
    } finally {
      setLoading(false);
    }
  }, []); // 移除 timeRange 依赖，因为函数内部没有使用它

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}>
        <Spin tip="加载数据分析..." size="large" />
      </div>
    );
  }

  // 关键指标卡片
  const keyMetricCards = [
    {
      title: '总销售额',
      value: `¥${(data.keyMetrics.totalSales / 10000).toFixed(1)}万`,
      icon: <DollarOutlined />,
      color: '#1890ff',
      trend: 12.5,
      suffix: '较上月'
    },
    {
      title: '总订单数',
      value: data.keyMetrics.totalOrders.toLocaleString(),
      icon: <ShoppingOutlined />,
      color: '#52c41a',
      trend: 8.3,
      suffix: '较上月'
    },
    {
      title: '客单价',
      value: `¥${data.keyMetrics.avgOrderValue}`,
      icon: <UserOutlined />,
      color: '#722ed1',
      trend: 5.2,
      suffix: '较上月'
    },
    {
      title: '转化率',
      value: `${data.keyMetrics.conversionRate}%`,
      icon: <LineChartOutlined />,
      color: '#fa8c16',
      trend: 1.8,
      suffix: '较上月'
    },
    {
      title: '客户总数',
      value: data.keyMetrics.customerCount.toLocaleString(),
      icon: <UserOutlined />,
      color: '#eb2f96',
      trend: 15.7,
      suffix: '累计'
    },
    {
      title: '退货率',
      value: `${data.keyMetrics.returnRate}%`,
      icon: <ArrowDownOutlined />,
      color: '#f5222d',
      trend: -0.3,
      suffix: '较上月'
    }
  ];

  // 热销商品列定义
  const productColumns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div style={{ fontWeight: 500, fontSize: '12px' }}>{text}</div>
      )
    },
    {
      title: '销售额',
      dataIndex: 'sales',
      key: 'sales',
      render: (value: number) => (
        <div style={{ fontWeight: 600, color: '#f5222d', fontSize: '12px' }}>
          ¥{(value / 1000).toFixed(1)}K
        </div>
      )
    },
    {
      title: '增长趋势',
      dataIndex: 'growth',
      key: 'growth',
      render: (value: number) => {
        const isPositive = value > 0;
        const color = isPositive ? '#52c41a' : '#ff4d4f';
        const icon = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
        
        return (
          <Tag color={color} style={{ fontSize: '11px' }}>
            {icon} {Math.abs(value)}%
          </Tag>
        );
      }
    },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (value: number) => {
        let color: 'success' | 'warning' | 'error' = 'success';
        if (value <= 10) color = 'error';
        else if (value <= 30) color = 'warning';
        
        return (
          <Badge 
            status={color} 
            text={<span style={{ fontSize: '12px' }}>{value}</span>}
          />
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="link" 
          size="small" 
          style={{ fontSize: '11px' }}
          onClick={() => navigate(`/goods/detail/${record.id}`)}
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
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string) => (
        <div style={{ fontSize: '12px' }}>{text}</div>
      )
    },
    {
      title: '库存量',
      dataIndex: 'stock',
      key: 'stock',
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
        return <Tag color={color} style={{ fontSize: '11px' }}>{status}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <Button 
          type="link" 
          size="small" 
          style={{ fontSize: '11px' }}
          onClick={() => navigate(`/goods/stock/replenish/${record.id}`)}
        >
          补货
        </Button>
      )
    }
  ];

  // 饼图工具提示格式化函数
  const formatPieTooltip = (value: number) => {
    return [`${value}%`, '占比'];
  };

  // 条形图工具提示格式化函数
  const formatBarTooltip = (value: number, name: string) => {
    if (name === '销售额') {
      return [`¥${value.toLocaleString()}`, name];
    }
    return [value, name];
  };

  return (
    <div style={{ padding: 16, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 标题和时间选择 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>商品数据分析</Title>
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
              <Card size="small" bordered={false} style={{ borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>
                      {metric.title}
                    </div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 600, 
                      color: metric.color,
                      lineHeight: 1.2 
                    }}>
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
                {data.monthlySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={formatBarTooltip} />
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
                  <Empty description="暂无数据" />
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
                {data.categorySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categorySales}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }: { name: string; value: number }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.categorySales.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={formatPieTooltip} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="暂无数据" />
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
                <Button type="link" size="small" onClick={() => navigate('/goods/analytics/sales')}>
                  查看更多
                </Button>
              }
            >
              <Table
                dataSource={data.topProducts}
                columns={productColumns}
                rowKey="id"
                size="small"
                pagination={false}
                style={{ fontSize: '12px' }}
              />
            </Card>
          </Col>

          {/* 库存预警 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <ShoppingOutlined />
                  <span>库存预警</span>
                </Space>
              }
              size="small"
              extra={
                <Button type="link" size="small" onClick={() => navigate('/goods/stock')}>
                  去管理
                </Button>
              }
            >
              <Table
                dataSource={data.stockAlerts}
                columns={stockColumns}
                rowKey="id"
                size="small"
                pagination={false}
                style={{ fontSize: '12px' }}
              />
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
                    <strong>库存优化：</strong>建议对低库存商品及时补货，避免影响销售
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>定价策略：</strong>部分商品价格偏高，可考虑适当调整以提升竞争力
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>品类优化：</strong>配件类商品占比偏低，可考虑增加新品
                  </li>
                  <li>
                    <strong>营销活动：</strong>建议在节假日期间开展促销活动，提升转化率
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
              <div style={{ padding: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '12px' }}>商品总数：</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>1,247个</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '12px' }}>在售商品：</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>980个</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '12px' }}>平均评分：</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#faad14' }}>
                    <StarOutlined /> 4.8
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px' }}>数据周期：</span>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {dayjs().startOf('month').format('MM-DD')} ~ {dayjs().format('MM-DD')}
                  </span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 样式覆盖 */}
        <style>{`
          .ant-card-head-title { font-size: 14px !important; }
          .ant-table-thead > tr > th { font-size: 11px !important; }
          .ant-table-tbody > tr > td { font-size: 12px !important; }
          .recharts-tooltip-wrapper { font-size: 12px !important; }
        `}</style>
      </Spin>
    </div>
  );
};

export default AnalyticsPage;