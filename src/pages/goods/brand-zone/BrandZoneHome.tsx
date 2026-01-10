/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Card, Row, Col, Typography, Button, Space } from 'antd';
import { Link } from 'react-router-dom';
import { 
  AppstoreOutlined, 
  TagOutlined, 
  ArrowRightOutlined,
  BuildOutlined,
  ClusterOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const BrandZoneHome: React.FC = () => {
  const modules = [
    {
      key: 'brand',
      title: '品牌管理',
      description: '管理商品品牌信息，包括品牌Logo、状态、描述等',
      icon: <TagOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      path: '/goods/brand',
      stats: [
        { label: '品牌总数', value: '28', color: '#1890ff' },
        { label: '启用中', value: '24', color: '#52c41a' },
        { label: '异常', value: '4', color: '#ff4d4f' }
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
        { label: '专区总数', value: '12', color: '#722ed1' },
        { label: '启用中', value: '10', color: '#52c41a' },
        { label: '子分类', value: '45', color: '#fa8c16' }
      ],
      actions: [
        { text: '查看列表', path: '/goods/zone' },
        { text: '新增专区', path: '/goods/zone/create' }
      ]
    }
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          <Space>
            <AppstoreOutlined />
            品牌·专区管理
          </Space>
        </Title>
        <Text type="secondary">
          管理商品品牌和分类专区，品牌用于标识商品来源，专区用于组织商品分类
        </Text>
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
                boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.08)'
              }}
              bodyStyle={{ padding: 24 }}
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
                      <Link to={action.path} key={index}>
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
        style={{ marginTop: 24, borderRadius: 8 }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ 
            backgroundColor: '#f6ffed', 
            padding: 12, 
            borderRadius: 6,
            marginRight: 16 
          }}>
            <Text type="success">💡 使用提示</Text>
          </div>
          <div>
            <Text style={{ fontSize: 13, lineHeight: 4 }}>
              品牌和专区是商品管理的基础。品牌用于区分商品制造商（如联想、ThinkPad），
              专区用于组织商品分类（如笔记本专区、游戏本专区）。建议先创建品牌和专区，
              然后再创建商品并关联到相应的品牌和专区。
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BrandZoneHome;