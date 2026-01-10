/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  InputNumber, 
  Button, 
  message, 
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Descriptions,
  Tag
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined 
} from '@ant-design/icons';
import { findMockStock, updateMockStock } from '../../../services/cyf-mockData';

const { Title, Text } = Typography;

// 符合API的StockResponse类型
interface StockDetail {
  stock_id: string;
  config_id: string;
  product_id: string;
  product_name: string;
  config1: string;
  config2: string;
  config3: string | null;
  stock_num: number;
  warn_num: number;
  freeze_num: number;
  updated_at: string;
  last_in_time: string;
  last_out_time: string;
}

const StockEditPage: React.FC = () => {
  const { stockId } = useParams<{ stockId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stockDetail, setStockDetail] = useState<StockDetail | null>(null);
  const [configInfo, setConfigInfo] = useState<string>('');

  useEffect(() => {
    if (stockId) {
      fetchStockDetail();
    }
  }, [stockId]);

  const fetchStockDetail = () => {
    setLoading(true);
    try {
      const stock = findMockStock(stockId!);
      if (stock) {
        setStockDetail(stock);
        // 构建配置信息字符串
        const configStr = `${stock.config1} / ${stock.config2}${stock.config3 ? ` / ${stock.config3}` : ''}`;
        setConfigInfo(configStr);
        
        form.setFieldsValue({
          stock_num: stock.stock_num,
          warn_num: stock.warn_num,
        });
      } else {
        message.error('库存记录不存在');
        navigate('/goods/stock');
      }
    } catch (error) {
      message.error('获取库存详情失败');
      console.error('Error fetching stock detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!stockDetail) return;
    
    setLoading(true);
    try {
      // 使用configId调用API
      await updateMockStock(stockDetail.config_id, {
        stock_num: values.stock_num,
        warn_num: values.warn_num,
      });
      
      message.success('库存更新成功');
      
      // 延迟返回列表页
      setTimeout(() => {
        navigate('/goods/stock');
      }, 1000);
    } catch (error) {
      message.error('库存更新失败');
      console.error('Error updating stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (stockDetail) {
      form.setFieldsValue({
        stock_num: stockDetail.stock_num,
        warn_num: stockDetail.warn_num,
      });
    }
  };

  if (!stockDetail) {
    return (
      <Card loading={true}>
        <div style={{ height: 300 }} />
      </Card>
    );
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/goods/stock')}
              >
                返回列表
              </Button>
              <Title level={4} style={{ margin: 0 }}>编辑库存</Title>
            </Space>
            <Space>
              <Button onClick={handleReset}>重置</Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                loading={loading}
                onClick={() => form.submit()}
              >
                保存
              </Button>
            </Space>
          </Space>
        </Card>

        <Row gutter={16}>
          <Col span={8}>
            <Card title="商品信息" loading={loading}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="库存ID">
                  <Text copyable>{stockDetail.stock_id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="配置ID">
                  <Text copyable>{stockDetail.config_id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="商品ID">
                  <Text copyable>{stockDetail.product_id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="商品名称">
                  <Text strong>{stockDetail.product_name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="配置信息">
                  <Tag color="blue">{configInfo}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="配置规格">
                  <div>
                    <Tag color="blue">{stockDetail.config1}</Tag>
                    <Tag color="cyan">{stockDetail.config2}</Tag>
                    {stockDetail.config3 && <Tag>{stockDetail.config3}</Tag>}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="当前冻结">
                  <Text type="secondary">{stockDetail.freeze_num} 件</Text>
                </Descriptions.Item>
                <Descriptions.Item label="最后入库">
                  <Text type="secondary">{new Date(stockDetail.last_in_time).toLocaleString()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="最后出库">
                  <Text type="secondary">{new Date(stockDetail.last_out_time).toLocaleString()}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col span={16}>
            <Card title="库存编辑">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="库存数量"
                      name="stock_num"
                      rules={[
                        { required: true, message: '请输入库存数量' },
                        { type: 'number', min: 0, message: '库存数量不能小于0' },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={999999}
                        style={{ width: '100%' }}
                        placeholder="请输入库存数量"
                        addonAfter="件"
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      label="预警数量"
                      name="warn_num"
                      rules={[
                        { required: true, message: '请输入预警数量' },
                        { type: 'number', min: 0, message: '预警数量不能小于0' },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={999999}
                        style={{ width: '100%' }}
                        placeholder="请输入预警数量"
                        addonAfter="件"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Form.Item>
                  <Space>
                    <Button onClick={handleReset}>重置</Button>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      loading={loading}
                    >
                      保存更改
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            <Card title="库存计算" style={{ marginTop: 16 }}>
              <Descriptions column={3}>
                <Descriptions.Item label="可用库存">
                  <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                    {(form.getFieldValue('stock_num') || 0) - stockDetail.freeze_num}
                  </Text>
                  <Text> 件</Text>
                </Descriptions.Item>
                <Descriptions.Item label="库存状态">
                  <Tag 
                    color={
                      (form.getFieldValue('stock_num') || 0) <= (form.getFieldValue('warn_num') || 0) 
                        ? 'warning' 
                        : 'success'
                    }
                  >
                    {(form.getFieldValue('stock_num') || 0) <= (form.getFieldValue('warn_num') || 0) 
                      ? '需补货' 
                      : '充足'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  <Text type="secondary">
                    {new Date(stockDetail.updated_at).toLocaleString()}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
              
              <Divider />
              
              <Descriptions column={2}>
                <Descriptions.Item label="库存健康度">
                  <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, ((form.getFieldValue('stock_num') || 0) / Math.max((form.getFieldValue('warn_num') || 1), 1)) * 100)}%`, 
                        height: '100%', 
                        background: (form.getFieldValue('stock_num') || 0) > (form.getFieldValue('warn_num') || 0) ? '#52c41a' : '#faad14',
                        borderRadius: 4
                      }} 
                    />
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="预警状态">
                  <Text>
                    {(form.getFieldValue('stock_num') || 0) <= (form.getFieldValue('warn_num') || 0) 
                      ? `低于预警值 ${form.getFieldValue('warn_num') || 0} 件`
                      : `高于预警值 ${(form.getFieldValue('stock_num') || 0) - (form.getFieldValue('warn_num') || 0)} 件`}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default StockEditPage;