
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Card, Row, Col, Button, Input, Form, InputNumber, Steps,
  Space, Typography, Alert, message,
  Tag} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, StockOutlined,
  SearchOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

// 使用真实API
import { getStocks, updateStock } from '../../../services/api';
import type { StockResponse } from '../../../services/api-type';

// 修复的 StockResponse 类型
interface FixedStockResponse extends Omit<StockResponse, 'updated_at' | 'last_in_time' | 'last_out_time'> {
  updated_at: string;
  last_in_time: string | null;
  last_out_time: string | null;
}

interface StockCreateFormData {
  config_id: string;
  stock_num: number;
  warn_num: number;
  remark?: string;
}

const StockCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStock, setSelectedStock] = useState<FixedStockResponse | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 从location.state获取返回路径
  const fromPath = location.state?.from || '/goods/stock';

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      message.info('请输入配置ID');
      return;
    }

    setIsSearching(true);
    try {
      // 使用真实API获取库存列表
      const response = await getStocks();
      
      if (response && Array.isArray(response)) {
        // 查找匹配配置ID的库存记录
        const foundStock = response.find(item => item.config_id === searchKeyword.trim()) as unknown as FixedStockResponse;
        
        if (foundStock) {
          // 修复类型问题
          const fixedStock: FixedStockResponse = {
            ...foundStock,
            updated_at: typeof foundStock.updated_at === 'function' 
              ? new Date().toISOString() 
              : (foundStock.updated_at as any as string) || new Date().toISOString(),
            last_in_time: foundStock.last_in_time || null,
            last_out_time: foundStock.last_out_time || null,
          };
          
          setSelectedStock(fixedStock);
          form.setFieldValue('config_id', fixedStock.config_id);
          
          // 如果库存已有数量，则设置为表单初始值
          if (fixedStock.stock_num > 0 || fixedStock.warn_num > 0) {
            form.setFieldsValue({
              stock_num: fixedStock.stock_num,
              warn_num: fixedStock.warn_num,
            });
            message.info('已找到现有库存记录，可进行更新');
          } else {
            form.setFieldsValue({
              stock_num: 0,
              warn_num: 10,
            });
          }
          
          setCurrentStep(1);
        } else {
          message.warning('未找到该配置的库存记录。请检查配置ID是否正确，或该配置尚未初始化库存。');
        }
      } else {
        message.error('获取库存列表失败');
      }
    } catch (error) {
      console.error('Error searching stock:', error);
      message.error('搜索失败');
    } finally {
      setIsSearching(false);
    }
  };

  // 下一步
  const nextStep = () => {
    if (currentStep === 0 && !selectedStock) {
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

  // 提交创建/更新
  const handleSubmit = async (values: StockCreateFormData) => {
    if (!values.config_id) {
      message.error('配置ID不能为空');
      return;
    }

    setIsSubmitting(true);
    try {
      // 使用真实API更新库存
      await updateStock(values.config_id, {
        stock_num: values.stock_num,
        warn_num: values.warn_num,
      });

      message.success(selectedStock ? '库存更新成功' : '库存初始化成功');
      
      // 重置表单并返回
      form.resetFields();
      setSelectedStock(null);
      setSearchKeyword('');
      setCurrentStep(0);
      
      // 延迟跳转以便用户看到成功消息
      setTimeout(() => {
        navigate(fromPath);
      }, 1500);
    } catch (error) {
      console.error('Error updating stock:', error);
      message.error('库存操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepItems = [
    {
      title: '查找配置',
      description: '通过配置ID查找库存记录'
    },
    {
      title: '设置库存',
      description: '配置库存数量和预警值'
    },
    {
      title: '确认操作',
      description: '确认信息并保存'
    }
  ];

  return (
    <div 
      style={{ 
        padding: 16, 
        backgroundColor: '#f0f2f5', 
        minHeight: '100vh' 
      }}
    >
      <Card 
        size="small" 
        bordered={false} 
        style={{ marginBottom: 16 }}
      >
        <Row 
          justify="space-between" 
          align="middle"
        >
          <Col>
            <Space size="middle">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                size="small"
                onClick={() => navigate(fromPath)}
              >
                返回
              </Button>
              <Title 
                level={4} 
                style={{ margin: 0 }}
              >
                {selectedStock ? '更新库存' : '初始化库存'}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                size="small"
                onClick={() => navigate(fromPath)}
              >
                取消
              </Button>
              {currentStep === 2 && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  size="small"
                  loading={isSubmitting}
                  onClick={() => form.submit()}
                >
                  {selectedStock ? '确认更新' : '确认初始化'}
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 步骤条 */}
      <Card 
        size="small" 
        bordered={false} 
        style={{ marginBottom: 16 }}
      >
        <Steps 
          current={currentStep} 
          size="small"
          items={stepItems}
        />
      </Card>

      <Row justify="center">
        <Col span={20}>
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
          >
            {currentStep === 0 && (
              <Card 
                size="small" 
                bordered={false}
              >
                <Title 
                  level={5} 
                  style={{ marginBottom: 16 }}
                >
                  查找库存配置
                </Title>
                
                <Alert
                  message="重要提示"
                  description={
                    <div>
                      <p>库存是与商品配置绑定的，每个配置对应一个库存记录。</p>
                      <p>此功能用于为已有配置初始化或更新库存数据。</p>
                      <p>请输入配置ID（可从商品配置页面或库存列表页面复制）。</p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <div style={{ marginBottom: 16 }}>
                  <Space.Compact 
                    style={{ width: '100%' }}
                  >
                    <Input
                      placeholder="输入配置ID，例如：config-prod-1000-0"
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
                      查找
                    </Button>
                  </Space.Compact>
                </div>

                <Alert
                  message="操作说明"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      <li>输入正确的配置ID后点击"查找"按钮</li>
                      <li>如果找到匹配的库存记录，将显示库存详情</li>
                      <li>如果未找到，说明该配置尚未初始化库存</li>
                      <li>您仍然可以继续操作来初始化库存</li>
                    </ul>
                  }
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </Card>
            )}

            {currentStep === 1 && (
              <Card 
                size="small" 
                bordered={false}
              >
                <Title 
                  level={5} 
                  style={{ marginBottom: 16 }}
                >
                  设置库存参数
                </Title>

                {selectedStock ? (
                  <Alert
                    message="找到库存记录"
                    description={
                      <div>
                        <Text strong>{selectedStock.product_name}</Text>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          配置规格：{selectedStock.config1} / {selectedStock.config2}
                          {selectedStock.config3 && ` / ${selectedStock.config3}`}
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          当前库存：{selectedStock.stock_num} 件，预警值：{selectedStock.warn_num} 件
                        </div>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                ) : (
                  <Alert
                    message="未找到现有库存记录"
                    description="将为此配置初始化新的库存数据"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="库存数量"
                      name="stock_num"
                      rules={[
                        { required: true, message: '请输入库存数量' },
                        { type: 'number', min: 0, message: '库存数量不能为负数' },
                      ]}
                      initialValue={0}
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
                      initialValue={10}
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

                <Form.Item 
                  label="备注" 
                  name="remark"
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="可填写更新原因、来源等信息"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>

                {/* 隐藏字段 */}
                <Form.Item 
                  name="config_id" 
                  hidden
                >
                  <Input />
                </Form.Item>

                <div 
                  style={{ 
                    marginTop: 24, 
                    textAlign: 'right' 
                  }}
                >
                  <Space>
                    <Button 
                      onClick={prevStep}
                    >
                      上一步
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={nextStep}
                    >
                      下一步
                    </Button>
                  </Space>
                </div>
              </Card>
            )}

            {currentStep === 2 && (
              <Card 
                size="small" 
                bordered={false}
              >
                <Title 
                  level={5} 
                  style={{ marginBottom: 16 }}
                >
                  确认操作信息
                </Title>

                <Alert
                  message={selectedStock ? "确认更新库存信息" : "确认初始化库存信息"}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                {selectedStock && (
                  <div 
                    style={{ 
                      background: '#fafafa', 
                      padding: 16, 
                      borderRadius: 4, 
                      marginBottom: 16 
                    }}
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <div>
                          <Text type="secondary">商品名称：</Text>
                          <Text strong>
                            {selectedStock.product_name}
                          </Text>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">配置规格：</Text>
                          <Space size={4}>
                            <Tag color="blue">
                              {selectedStock.config1}
                            </Tag>
                            <Tag color="cyan">
                              {selectedStock.config2}
                            </Tag>
                            {selectedStock.config3 && (
                              <Tag>
                                {selectedStock.config3}
                              </Tag>
                            )}
                          </Space>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div>
                          <Text type="secondary">配置ID：</Text>
                          <Text copyable>
                            {selectedStock.config_id}
                          </Text>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">库存ID：</Text>
                          <Text copyable>
                            {selectedStock.stock_id}
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}

                <div 
                  style={{ 
                    background: '#f6ffed', 
                    padding: 16, 
                    borderRadius: 4, 
                    marginBottom: 16 
                  }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div>
                        <Text type="secondary">{selectedStock ? '更新后库存' : '初始库存'}：</Text>
                        <Text 
                          strong 
                          style={{ 
                            fontSize: 18, 
                            color: '#52c41a' 
                          }}
                        >
                          {form.getFieldValue('stock_num') || 0}
                        </Text>
                        <Text> 件</Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <Text type="secondary">预警阈值：</Text>
                        <Text 
                          strong 
                          style={{ 
                            fontSize: 18, 
                            color: '#faad14' 
                          }}
                        >
                          {form.getFieldValue('warn_num') || 10}
                        </Text>
                        <Text> 件</Text>
                      </div>
                    </Col>
                  </Row>
                </div>

                {selectedStock && (
                  <div style={{ marginBottom: 16, padding: 12, background: '#fffbe6', borderRadius: 4 }}>
                    <Space>
                      <InfoCircleOutlined style={{ color: '#faad14' }} />
                      <Text type="warning">
                        注意：此操作将更新现有库存记录，原有库存数据将被覆盖。
                      </Text>
                    </Space>
                  </div>
                )}

                {form.getFieldValue('remark') && (
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">备注：</Text>
                    <div 
                      style={{ 
                        marginTop: 8, 
                        padding: 8, 
                        background: '#fff', 
                        borderRadius: 4 
                      }}
                    >
                      {form.getFieldValue('remark')}
                    </div>
                  </div>
                )}

                <div 
                  style={{ 
                    marginTop: 24, 
                    textAlign: 'right' 
                  }}
                >
                  <Space>
                    <Button 
                      onClick={prevStep}
                    >
                      上一步
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={isSubmitting}
                      onClick={() => form.submit()}
                    >
                      {selectedStock ? '确认更新库存' : '确认初始化库存'}
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