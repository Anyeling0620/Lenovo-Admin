/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import dayjs from 'dayjs';
import { getStocks, updateStock } from '../../../services/api';
import type { StockResponse } from '../../../services/api-type';

const { Title, Text } = Typography;

// 修复的 StockResponse 类型（根据 API 文档，updated_at 应该是字符串）
interface FixedStockResponse extends Omit<StockResponse, 'updated_at' | 'last_in_time' | 'last_out_time'> {
  updated_at: string;
  last_in_time: string | null;
  last_out_time: string | null;
}

// 用于表单编辑的类型
interface StockEditFormData {
  stock_num: number;
  warn_num: number;
}

const StockEditPage: React.FC = () => {
  const { stockId } = useParams<{ stockId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stockDetail, setStockDetail] = useState<FixedStockResponse | null>(null);
  const [configInfo, setConfigInfo] = useState<string>('');
  
  // 从location.state获取返回路径，如果没有则使用默认路径
  const fromPath = location.state?.from || '/goods/stock';

  useEffect(() => {
    if (stockId) {
      fetchStockDetail();
    }
  }, [stockId]);

  const fetchStockDetail = async () => {
    setLoading(true);
    try {
      // 使用真实 API 调用获取库存列表
      const response = await getStocks();
      
      if (response && Array.isArray(response)) {
        // 查找指定 stockId 的库存记录
        const stock = response.find(item => item.stock_id === stockId) as unknown as FixedStockResponse;
        
        if (stock) {
          // 修复类型问题
          const fixedStock: FixedStockResponse = {
            ...stock,
            updated_at: typeof stock.updated_at === 'function' 
              ? new Date().toISOString() 
              : (stock.updated_at as any as string) || new Date().toISOString(),
            last_in_time: stock.last_in_time || null,
            last_out_time: stock.last_out_time || null,
          };
          
          setStockDetail(fixedStock);
          
          // 构建配置信息字符串
          const configStr = `${fixedStock.config1} / ${fixedStock.config2}${fixedStock.config3 ? ` / ${fixedStock.config3}` : ''}`;
          setConfigInfo(configStr);
          
          form.setFieldsValue({
            stock_num: fixedStock.stock_num,
            warn_num: fixedStock.warn_num,
          });
        } else {
          message.error('库存记录不存在');
          navigate(fromPath);
        }
      } else {
        message.error('获取库存列表失败');
        navigate(fromPath);
      }
    } catch (error) {
      console.error('Error fetching stock detail:', error);
      message.error('获取库存详情失败');
      navigate(fromPath);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: StockEditFormData) => {
    if (!stockDetail) return;
    
    setLoading(true);
    try {
      // 使用真实 API 调用更新库存
      await updateStock(stockDetail.config_id, {
        stock_num: values.stock_num,
        warn_num: values.warn_num,
      });
      
      message.success('库存更新成功');
      
      // 延迟返回列表页
      setTimeout(() => {
        navigate(fromPath);
      }, 1000);
    } catch (error) {
      console.error('Error updating stock:', error);
      message.error('库存更新失败');
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

  // 计算可用库存
  const getAvailableStock = () => {
    const stockNum = form.getFieldValue('stock_num') || stockDetail.stock_num;
    return stockNum - stockDetail.freeze_num;
  };

  // 计算库存状态
  const getStockStatus = () => {
    const stockNum = form.getFieldValue('stock_num') || stockDetail.stock_num;
    const warnNum = form.getFieldValue('warn_num') || stockDetail.warn_num;
    
    return stockNum <= warnNum ? '需补货' : '充足';
  };

  // 计算库存健康度百分比
  const getStockHealthPercent = () => {
    const stockNum = form.getFieldValue('stock_num') || stockDetail.stock_num;
    const warnNum = Math.max(form.getFieldValue('warn_num') || stockDetail.warn_num, 1);
    
    return Math.min(100, (stockNum / warnNum) * 100);
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate(fromPath)}
              >
                返回列表
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                编辑库存
              </Title>
            </Space>
            <Space>
              <Button onClick={handleReset}>
                重置
              </Button>
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
                  <Text copyable>
                    {stockDetail.stock_id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="配置ID">
                  <Text copyable>
                    {stockDetail.config_id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="商品ID">
                  <Text copyable>
                    {stockDetail.product_id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="商品名称">
                  <Text strong>
                    {stockDetail.product_name}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="配置信息">
                  <Tag color="blue">
                    {configInfo}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="配置规格">
                  <div>
                    <Tag color="blue">
                      {stockDetail.config1}
                    </Tag>
                    <Tag color="cyan">
                      {stockDetail.config2}
                    </Tag>
                    {stockDetail.config3 && (
                      <Tag>
                        {stockDetail.config3}
                      </Tag>
                    )}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="当前冻结">
                  <Text type="secondary">
                    {stockDetail.freeze_num} 件
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="最后入库">
                  <Text type="secondary">
                    {stockDetail.last_in_time 
                      ? dayjs(stockDetail.last_in_time).format('YYYY-MM-DD HH:mm:ss')
                      : '暂无记录'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="最后出库">
                  <Text type="secondary">
                    {stockDetail.last_out_time 
                      ? dayjs(stockDetail.last_out_time).format('YYYY-MM-DD HH:mm:ss')
                      : '暂无记录'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  <Text type="secondary">
                    {dayjs(stockDetail.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Text>
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
                    <Button onClick={handleReset}>
                      重置
                    </Button>
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

            <Card 
              title="库存计算" 
              style={{ marginTop: 16 }}
            >
              <Descriptions column={3}>
                <Descriptions.Item label="可用库存">
                  <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                    {getAvailableStock()}
                  </Text>
                  <Text> 件</Text>
                </Descriptions.Item>
                <Descriptions.Item label="库存状态">
                  <Tag 
                    color={getStockStatus() === '需补货' ? 'warning' : 'success'}
                  >
                    {getStockStatus()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  <Text type="secondary">
                    {dayjs(stockDetail.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
              
              <Divider />
              
              <Descriptions column={2}>
                <Descriptions.Item label="库存健康度">
                  <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                    <div 
                      style={{ 
                        width: `${getStockHealthPercent()}%`, 
                        height: '100%', 
                        background: getStockStatus() === '充足' ? '#52c41a' : '#faad14',
                        borderRadius: 4
                      }} 
                    />
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                    {getStockHealthPercent().toFixed(1)}% （当前库存 / 预警阈值）
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="预警状态">
                  <Text>
                    {getStockStatus() === '需补货' 
                      ? `低于预警值 ${form.getFieldValue('warn_num') || stockDetail.warn_num} 件`
                      : `高于预警值 ${(form.getFieldValue('stock_num') || stockDetail.stock_num) - (form.getFieldValue('warn_num') || stockDetail.warn_num)} 件`}
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