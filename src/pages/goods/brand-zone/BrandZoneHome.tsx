/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Space, Spin, Alert, Tooltip } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { 
  AppstoreOutlined, 
  TagOutlined, 
  ArrowRightOutlined,
  BuildOutlined,
  ClusterOutlined,
  InfoCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import * as api from '../../../services/api';
import type { BrandResponse, CategoryResponse } from '../../../services/api-type';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';


const { Title, Text } = Typography;

interface ModuleStats {
  label: string;
  value: number;
  color: string;
}

interface ModuleAction {
  text: string;
  path: string;
}

interface ModuleInfo {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  stats: ModuleStats[];
  actions: ModuleAction[];
}

const BrandZoneHome: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandStats, setBrandStats] = useState({ total: 0, enabled: 0, disabled: 0 });
  const [categoryStats, setCategoryStats] = useState({ total: 0, enabled: 0, subCategories: 0 });
  
  // 构建路由状态函数
  const buildRouteState = () => {
    return { from: location.pathname };
  };

  // 加载统计数据
  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 并行获取品牌和分类数据
      const [brands, categories] = await Promise.all([
        api.getBrands(),
        api.getCategories()
      ]);

      // 计算品牌统计数据
      const brandData = brands as BrandResponse[];
      const brandEnabled = brandData.filter(b => b.status === '启用').length;
      const brandDisabled = brandData.filter(b => b.status === '禁用' || b.status === '下架').length;
      
      setBrandStats({
        total: brandData.length,
        enabled: brandEnabled,
        disabled: brandDisabled
      });

      // 计算分类统计数据
      const categoryData = categories as CategoryResponse[];
      const categoryEnabled = categoryData.filter(c => c.status === '启用').length;
      const subCategoryCount = categoryData.filter(c => c.parent_id !== null).length;
      
      setCategoryStats({
        total: categoryData.length,
        enabled: categoryEnabled,
        subCategories: subCategoryCount
      });

    } catch (error: any) {
      console.error('加载统计数据失败:', error);
      
      // 使用 GlobalAxiosErrorHandler 统一处理错误
      const errorInfo = globalErrorHandler.parse(error);
      
      // 设置错误信息
      setError(errorInfo.message);
      
      // 显示错误消息
      globalErrorHandler.handle(
        error,
        (msg) => globalMessage.error(msg),
        // 可以传入自定义消息，如果不需要自定义则不传
        // '加载品牌和专区数据失败，请稍后重试'
      );
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    loadStats();
  };

  useEffect(() => {
    loadStats();
  }, []);

  // 模块配置
  const modules: ModuleInfo[] = [
    {
      key: 'brand',
      title: '品牌管理',
      description: '管理商品品牌信息，包括品牌Logo、状态、描述等',
      icon: <TagOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      path: '/goods/brand',
      stats: [
        { label: '品牌总数', value: brandStats.total, color: '#1890ff' },
        { label: '启用中', value: brandStats.enabled, color: '#52c41a' },
        { label: '异常', value: brandStats.disabled, color: '#ff4d4f' }
      ],
      actions: [
        { text: '查看列表', path: '/goods/brand' },
        { text: '新增品牌', path: '/goods/brand/create' }
      ]
    },
    {
      key: 'zone',
      title: '专区管理',
      description: '管理商品专区/分类，支持多级分类和状态管理',
      icon: <ClusterOutlined style={{ fontSize: 36, color: '#722ed1' }} />,
      path: '/goods/zone',
      stats: [
        { label: '专区总数', value: categoryStats.total, color: '#722ed1' },
        { label: '启用中', value: categoryStats.enabled, color: '#52c41a' },
        { label: '子分类', value: categoryStats.subCategories, color: '#fa8c16' }
      ],
      actions: [
        { text: '查看列表', path: '/goods/zone' },
        { text: '新增专区', path: '/goods/zone/create' }
      ]
    }
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 16
      }}>
        <Spin size="large" />
        <Text type="secondary">加载中...</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 错误提示 */}
      {error && (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" onClick={handleRefresh}>
              重试
            </Button>
          }
        />
      )}

      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ marginBottom: 8 }}>
              <Space>
                <AppstoreOutlined />
                品牌·专区管理
              </Space>
            </Title>
            <Text type="secondary">
              管理商品品牌和分类专区，品牌用于标识商品来源，专区用于组织商品分类
            </Text>
          </Col>
          <Col>
            <Tooltip title="刷新数据">
              <Button 
                icon={<SyncOutlined />} 
                onClick={handleRefresh}
                loading={loading}
                size="small"
              >
                刷新
              </Button>
            </Tooltip>
          </Col>
        </Row>
      </div>

      {/* 功能模块卡片 */}
      <Row gutter={[24, 24]}>
        {modules.map(module => (
          <Col xs={24} md={12} key={module.key}>
            <Card
              bordered={false}
              style={{
                height: '100%',
                borderRadius: 8,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: 24 }}
              hoverable
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* 头部 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ marginRight: 16 }}>
                    {module.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Title level={4} style={{ marginBottom: 4 }}>
                      {module.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {module.description}
                    </Text>
                  </div>
                </div>

                {/* 统计信息 */}
                <div style={{ marginBottom: 24 }}>
                  <Row gutter={[12, 12]}>
                    {module.stats.map((stat, index) => (
                      <Col span={8} key={index}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ 
                            fontSize: 20, 
                            fontWeight: 600, 
                            color: stat.color,
                            marginBottom: 4 
                          }}>
                            {stat.value}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {stat.label}
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* 操作按钮 */}
                <div style={{ marginTop: 'auto' }}>
                  <Space>
                    {module.actions.map((action, index) => (
                      <Link 
                        to={action.path} 
                        key={index}
                        state={buildRouteState()}
                      >
                        <Button 
                          type={index === 0 ? 'primary' : 'default'}
                          icon={index === 1 ? <BuildOutlined /> : undefined}
                          size="small"
                        >
                          {action.text}
                          {index === 0 && <ArrowRightOutlined style={{ marginLeft: 4 }} />}
                        </Button>
                      </Link>
                    ))}
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 功能说明 */}
      <Card
        bordered={false}
        style={{ 
          marginTop: 24, 
          borderRadius: 8,
          background: 'linear-gradient(135deg, #f6ffed 0%, #fff7e6 100%)'
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ 
            backgroundColor: '#f6ffed', 
            padding: '8px 12px', 
            borderRadius: 6,
            marginRight: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <InfoCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 14, color: '#333', marginBottom: 8, display: 'block' }}>
              使用提示
            </Text>
            <Text style={{ fontSize: 13, lineHeight: 1.6, color: '#666' }}>
              品牌和专区是商品管理的基础。品牌用于区分商品制造商（如联想、ThinkPad），
              专区用于组织商品分类（如笔记本专区、游戏本专区）。建议先创建品牌和专区，
              然后再创建商品并关联到相应的品牌和专区。
            </Text>
          </div>
        </div>
      </Card>

      {/* 底部操作提示 */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          提示：点击模块卡片或操作按钮进入相应管理页面，返回时会自动回到此页面
        </Text>
      </div>
    </div>
  );
};

export default BrandZoneHome;