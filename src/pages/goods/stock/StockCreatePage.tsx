/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Input, Form, InputNumber, Select,
  Space, Typography, Alert, Divider, Steps,
  Tag, message
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, StockOutlined,
  SearchOutlined, PlusOutlined, CheckOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

// 使用模拟数据
import { findMockConfig, updateMockStock } from '../../../services/cyf-mockData';

interface ProductConfig {
  product_config_id: string;
  product_id: string;
  product_name: string;
  config1: string;
  config2: string;
  config3: string | null;
  sale_price: number;
  original_price: number;
  image?: string | null;
}

interface StockCreateFormData {
  config_id: string;
  stock_num: number;
  warn_num: number;
}

const StockCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedConfig, setSelectedConfig] = useState<ProductConfig | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      message.info('请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    try {
      // 模拟搜索
      const foundConfig = findMockConfig(searchKeyword);
      if (foundConfig) {
        setSelectedConfig(foundConfig);
        form.setFieldValue('config_id', foundConfig.product_config_id);
        setCurrentStep(1);
      } else {
        message.warning('未找到对应的配置');
      }
    } catch (error) {
      console.error('Error searching config:', error);
      message.error('搜索失败');
    } finally {
      setIsSearching(false);
    }
  };

  // 下一步
  const nextStep = () => {
    if (currentStep === 0 && !selectedConfig) {
      message.error('请先选择商品配置');
      return;
    }
    
    if (currentStep === 1) {
      form.validateFields(['stock_num', 'warn_num'])
        .then(() => setCurrentStep(2))
        .catch(() => {
          message.error('请填写完整的库存信息');
        });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  // 上一步
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // 提交创建
  const handleSubmit = async (values: StockCreateFormData) => {
    if (!values.config_id || !selectedConfig) {
      message.error('请先选择商品配置');
      return;
    }

    setIsSubmitting(true);
    try {
      // 调用更新库存API（实际上是设置初始库存）
      await updateMockStock(values.config_id, {
        stock_num: values.stock_num,
        warn_num: values.warn_num,
      });

      message.success('库存创建成功');
      
      // 重置表单并返回
      form.resetFields();
      setSelectedConfig(null);
      setSearchKeyword('');
      setCurrentStep(0);
      
      // 延迟跳转以便用户看到成功消息
      setTimeout(() => {
        navigate('/goods/stock');
      }, 1500);
    } catch (error) {
      message.error('库存创建失败');
      console.error('Error creating stock:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      title: '选择配置',
      description: '通过配置ID选择商品'
    },
    {
      title: '设置库存',
      description: '配置库存数量和预警值'
    },
    {
      title: '确认创建',
      description: '确认信息并创建'
    }
  ];

  return (
    <div style={{ padding: 16, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card size="small" bordered={false} style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="middle">
              <Link to="/goods/stock">
                <Button type="text" icon={<ArrowLeftOutlined />} size="small">
                  返回
                </Button>
              </Link>
              <Title level={4} style={{ margin: 0 }}>
                创建库存记录
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Link to="/goods/stock">
                <Button size="small">取消</Button>
              </Link>
              {currentStep === 2 && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  size="small"
                  loading={isSubmitting}
                  onClick={() => form.submit()}
                >
                  确认创建
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 步骤条 */}
      <Card size="small" bordered={false} style={{ marginBottom: 16 }}>
        <Steps current={currentStep} size="small">
          {steps.map((step, index) => (
            <Step key={index} title={step.title} description={step.description} />
          ))}
        </Steps>
      </Card>

      <Row justify="center">
        <Col span={20}>
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            initialValues={{
              stock_num: 0,
              warn_num: 10,
            }}
          >
            {currentStep === 0 && (
              <Card size="small" bordered={false}>
                <Title level={5} style={{ marginBottom: 16 }}>
                  选择商品配置
                </Title>
                
                <Alert
                  message="提示"
                  description="请输入配置ID（如：config-prod-1000-0）来选择商品配置"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <div style={{ marginBottom: 16 }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      placeholder="输入配置ID，如：config-prod-1000-0"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      size="large"
                      onPressEnter={handleSearch}
                      prefix={<StockOutlined />}
                    />
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={handleSearch}
                      loading={isSearching}
                      size="large"
                    >
                      搜索
                    </Button>
                  </Space.Compact>
                </div>

                <Alert
                  message="说明"
                  description="库存是与商品配置绑定的，每个配置对应一个库存记录。请确保输入的配置ID正确。"
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </Card>
            )}

            {currentStep === 1 && selectedConfig && (
              <Card size="small" bordered={false}>
                <Title level={5} style={{ marginBottom: 16 }}>
                  设置库存参数
                </Title>

                <Alert
                  message="商品信息"
                  description={
                    <div>
                      <Text strong>{selectedConfig.product_name}</Text>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {selectedConfig.config1} / {selectedConfig.config2}
                        {selectedConfig.config3 && ` / ${selectedConfig.config3}`}
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="初始库存量"
                      name="stock_num"
                      rules={[
                        { required: true, message: '请输入初始库存量' },
                        { type: 'number', min: 0, message: '库存量不能为负数' },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={99999}
                        style={{ width: '100%' }}
                        addonAfter="件"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="预警阈值"
                      name="warn_num"
                      rules={[
                        { required: true, message: '请输入预警阈值' },
                        { type: 'number', min: 0, message: '预警阈值不能为负数' },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={9999}
                        style={{ width: '100%' }}
                        addonAfter="件"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="备注" name="remark">
                  <Input.TextArea
                    rows={3}
                    placeholder="可填写创建原因、来源等信息"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>

                {/* 隐藏字段 */}
                <Form.Item name="config_id" hidden>
                  <Input />
                </Form.Item>

                <div style={{ marginTop: 24, textAlign: 'right' }}>
                  <Space>
                    <Button onClick={prevStep}>上一步</Button>
                    <Button type="primary" onClick={nextStep}>
                      下一步
                    </Button>
                  </Space>
                </div>
              </Card>
            )}

            {currentStep === 2 && selectedConfig && (
              <Card size="small" bordered={false}>
                <Title level={5} style={{ marginBottom: 16 }}>
                  确认创建信息
                </Title>

                <Alert
                  message="请确认以下信息"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <div style={{ background: '#fafafa', padding: 16, borderRadius: 4, marginBottom: 16 }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div>
                        <Text type="secondary">商品名称：</Text>
                        <Text strong>{selectedConfig.product_name}</Text>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">配置规格：</Text>
                        <Space size={4}>
                          <Tag color="blue">{selectedConfig.config1}</Tag>
                          <Tag color="cyan">{selectedConfig.config2}</Tag>
                          {selectedConfig.config3 && <Tag>{selectedConfig.config3}</Tag>}
                        </Space>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <Text type="secondary">配置ID：</Text>
                        <Text copyable>{selectedConfig.product_config_id}</Text>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">商品ID：</Text>
                        <Text copyable>{selectedConfig.product_id}</Text>
                      </div>
                    </Col>
                  </Row>
                </div>

                <div style={{ background: '#f6ffed', padding: 16, borderRadius: 4, marginBottom: 16 }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div>
                        <Text type="secondary">初始库存：</Text>
                        <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                          {form.getFieldValue('stock_num') || 0}
                        </Text>
                        <Text> 件</Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <Text type="secondary">预警阈值：</Text>
                        <Text strong style={{ fontSize: 18, color: '#faad14' }}>
                          {form.getFieldValue('warn_num')}
                        </Text>
                        <Text> 件</Text>
                      </div>
                    </Col>
                  </Row>
                </div>

                {form.getFieldValue('remark') && (
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">备注：</Text>
                    <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4 }}>
                      {form.getFieldValue('remark')}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 24, textAlign: 'right' }}>
                  <Space>
                    <Button onClick={prevStep}>上一步</Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={isSubmitting}
                      onClick={() => form.submit()}
                    >
                      确认创建库存记录
                    </Button>
                  </Space>
                </div>
              </Card>
            )}
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default StockCreatePage;