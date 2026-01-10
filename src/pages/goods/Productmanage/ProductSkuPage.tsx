/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Input, Select, Space, Form, Table, Tag,
  Typography, Upload, InputNumber, Tabs, message, Modal, Image
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, UploadOutlined, LoadingOutlined,
  StockOutlined, InfoCircleOutlined, ClockCircleOutlined, SaveOutlined
} from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { ProductConfigResponse, ProductConfigStatus } from '../../../services/api-type';
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { getProductConfigs, addProductConfig, getProductDetail, updateStock } from '../../../services/api';
// 导入模拟数据
import { generateMockProductConfigs, findMockProductDetail } from '../../../services/cyf-mockData';

const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Zod Schema
const productConfigSchema = z.object({
  config1: z.string().min(1, '配置1必填'),
  config2: z.string().min(1, '配置2必填'),
  config3: z.string().optional(),
  sale_price: z.number().min(0, '价格不能为负'),
  original_price: z.number().min(0, '价格不能为负'),
  config_image: z.string().optional(),
  status: z.nativeEnum({正常: '正常', 下架: '下架'}),
});

type ProductConfigFormData = z.infer<typeof productConfigSchema>;

const ProductSkuPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [configImageUploading, setConfigImageUploading] = useState(false);
  const [productConfigs, setProductConfigs] = useState<ProductConfigResponse[]>([]);
  const [productDetail, setProductDetail] = useState<any>(null);
  const [stockForm] = Form.useForm();

  // 使用模拟数据标志
  const useMockData = true;
  const fromPath = (location.state as any)?.from || '/goods/manage/list';
  const { 
    control: configControl, 
    handleSubmit: handleConfigSubmit,
    reset: resetConfigForm,
  } = useForm<ProductConfigFormData>({
    resolver: zodResolver(productConfigSchema),
    defaultValues: { 
      status: '正常' as ProductConfigStatus,
      sale_price: 0,
      original_price: 0,
      config1: '',
      config2: '',
      config3: '',
      config_image: ''
    }
  });

  // 加载商品详情和配置
  useEffect(() => {
    if (id) {
      loadProductDetail();
      loadProductConfigs();
    }
  }, [id]);

  const loadProductDetail = async () => {
    try {
      if (useMockData) {
        // 使用模拟数据
        const detail = findMockProductDetail(id!);
        setProductDetail(detail);
      } else {
        const detail = await getProductDetail(id!);
        setProductDetail(detail);
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const loadProductConfigs = async () => {
    try {
      if (useMockData) {
        // 使用模拟数据
        const configs = generateMockProductConfigs(id!);
        setProductConfigs(configs);
      } else {
        const configs = await getProductConfigs(id!);
        setProductConfigs(Array.isArray(configs) ? configs : []);
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 图片上传处理
  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件');
        reject(new Error('只能上传图片文件'));
        return;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片大小不能超过5MB');
        reject(new Error('图片大小不能超过5MB'));
        return;
      }
      
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          message.success('图片上传成功');
          resolve(result);
        };
        reader.onerror = () => {
          message.error('图片读取失败');
          reject(new Error('图片读取失败'));
        };
        reader.readAsDataURL(file);
      }, 800);
    });
  };

  const handleConfigImageUpload = async (file: File) => {
    setConfigImageUploading(true);
    try {
      const imageUrl = await handleImageUpload(file);
      return imageUrl;
    } catch (error) {
      console.error('配置图片上传失败:', error);
      return '';
    } finally {
      setConfigImageUploading(false);
    }
  };

  // 配置提交
  const onConfigSubmit = async (values: ProductConfigFormData) => {
    if (!id) return;
    try {
      globalMessage.loading('保存配置中...');
      
      // 构建配置数据
      const configData = {
        product_id: id,
        config1: values.config1,
        config2: values.config2,
        config3: values.config3,
        sale_price: values.sale_price,
        original_price: values.original_price,
        config_image: values.config_image,
      };
      
      if (useMockData) {
        // 模拟添加配置
        const newConfig: ProductConfigResponse = {
          product_config_id: `config-${id}-${Date.now()}`,
          product_id: id,
          config1: values.config1,
          config2: values.config2,
          config3: values.config3 || null,
          sale_price: values.sale_price,
          original_price: values.original_price,
          status: values.status,
          image: values.config_image || null,
          stock: {
            stock_id: `stock-${id}-${Date.now()}`,
            stock_num: 0,
            warn_num: 10,
            freeze_num: 0
          }
        };
        
        setProductConfigs(prev => [...prev, newConfig]);
        globalMessage.success('商品配置保存成功');
      } else {
        await addProductConfig(id, configData);
        globalMessage.success('商品配置保存成功');
      }
      
      await loadProductConfigs();
      resetConfigForm();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 库存更新
  const handleStockSubmit = async (configId: string, values: any) => {
    try {
      if (useMockData) {
        // 模拟更新库存
        setProductConfigs(prev => prev.map(config => {
          if (config.product_config_id === configId) {
            return {
              ...config,
              stock: {
                ...config.stock!,
                stock_num: values.stock_num,
                warn_num: values.warn_num
              }
            };
          }
          return config;
        }));
        globalMessage.success('库存更新成功');
      } else {
        await updateStock(configId, {
          stock_num: values.stock_num,
          warn_num: values.warn_num,
        });
        globalMessage.success('库存更新成功');
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <Card size="small" bordered={false} title={
        <Space>
          <Button 
            size="small" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(fromPath)} // 使用来源页面
          />
          SKU 规格与价格管理
        </Space>
      }>
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fafafa', borderRadius: 4 }}>
          <Text type="secondary">正在管理商品: </Text>
          <Text strong>{productDetail?.name}</Text>
        </div>
        
        <Tabs defaultActiveKey="configs">
          <TabPane tab="规格配置" key="configs">
            <Card size="small" title="新增规格配置" style={{ marginBottom: 16 }}>
              <Form layout="vertical" size="small" onFinish={handleConfigSubmit(onConfigSubmit)}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item label="配置1 (如颜色)" required>
                      <Controller 
                        name="config1" 
                        control={configControl}
                        render={({ field }) => <Input {...field} placeholder="如：黑色" />} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="配置2 (如内存)" required>
                      <Controller 
                        name="config2" 
                        control={configControl}
                        render={({ field }) => <Input {...field} placeholder="如：16GB" />} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="配置3 (如尺寸)">
                      <Controller 
                        name="config3" 
                        control={configControl}
                        render={({ field }) => <Input {...field} placeholder="如：15.6寸" />} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="状态">
                      <Controller 
                        name="status" 
                        control={configControl}
                        render={({ field }) => (
                          <Select {...field}>
                            <Option value="正常">上架</Option>
                            <Option value="下架">下架</Option>
                          </Select>
                        )} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item label="售价 (¥)" required>
                      <Controller 
                        name="sale_price" 
                        control={configControl}
                        render={({ field }) => (
                          <InputNumber 
                            {...field} 
                            style={{ width: '100%' }} 
                            min={0} 
                            onChange={(value) => field.onChange(value)}
                          />
                        )} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="原价 (¥)" required>
                      <Controller 
                        name="original_price" 
                        control={configControl}
                        render={({ field }) => (
                          <InputNumber 
                            {...field} 
                            style={{ width: '100%' }} 
                            min={0} 
                            onChange={(value) => field.onChange(value)}
                          />
                        )} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="配置图片">
                      <Controller 
                        name="config_image" 
                        control={configControl}
                        render={({ field }) => (
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <Upload
                              maxCount={1} 
                              accept="image/*" 
                              showUploadList={false}
                              beforeUpload={async (file) => { 
                                const url = await handleConfigImageUpload(file); 
                                if (url) {
                                  field.onChange(url);
                                }
                                return false; 
                              }}
                              disabled={configImageUploading}
                            >
                              <Button 
                                icon={configImageUploading ? <LoadingOutlined /> : <UploadOutlined />}
                                loading={configImageUploading}
                              >
                                选择图片
                              </Button>
                            </Upload>
                            {field.value && (
                              <>
                                <Image 
                                src={field.value.startsWith('data:image') ? field.value : getImageUrl(field.value)} 
                                alt="配置图片"
                                width={60} 
                                height={60} 
                                style={{ 
                                    borderRadius: 4, 
                                    objectFit: 'contain',
                                    border: '1px solid #f0f0f0'
                                }}
                                preview={{
                                    mask: '点击预览',
                                    src: field.value.startsWith('data:image') ? field.value : getImageUrl(field.value)
                                }}
                                />
                                 <Button 
                                  type="link" 
                                  size="small" 
                                  onClick={() => field.onChange('')} 
                                  danger
                                >
                                  删除
                                </Button>
                              </>
                            )}
                          </div>
                        )} 
                      />
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        配置专属图片（如特定颜色的商品图）
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                    添加规格
                  </Button>
                </Form.Item>
              </Form>
            </Card>
            
            <Table 
              size="small" 
              pagination={false} 
              dataSource={productConfigs} 
              rowKey="product_config_id" 
              columns={[
                { 
                  title: '配置图片', 
                  key: 'image', 
                  width: 80,
                  render: (_, record) => (
                    record.image ? (
                      <Image 
                        src={getImageUrl(record.image)} 
                        width={40} 
                        height={40}
                        style={{ borderRadius: 4 }}
                        preview={{
                          mask: '预览',
                          src: getImageUrl(record.image)
                        }}
                      />
                    ) : <span style={{ color: '#999' }}>无图片</span>
                  )
                },
                { 
                  title: '规格组合', 
                  key: 'config', 
                  render: (_, record) => (
                    <div>
                      <div><strong>{record.config1} / {record.config2}</strong></div>
                      {record.config3 && (
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {record.config3}
                        </div>
                      )}
                    </div>
                  )
                },
                { 
                  title: '售价', 
                  dataIndex: 'sale_price', 
                  render: (price) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{price}</span>
                },
                { 
                  title: '原价', 
                  dataIndex: 'original_price', 
                  render: (price) => <span style={{ textDecoration: 'line-through', color: '#999' }}>¥{price}</span>
                },
                { 
                  title: '库存', 
                  key: 'stock',
                  render: (_, record) => (
                    <div>
                      <div>总库存: {record.stock?.stock_num || 0}</div>
                      <div style={{ fontSize: '11px', color: record.stock?.stock_num <= (record.stock?.warn_num || 0) ? '#ff4d4f' : '#52c41a' }}>
                        预警: {record.stock?.warn_num || 0}
                      </div>
                    </div>
                  )
                },
                { 
                  title: '状态', 
                  dataIndex: 'status',
                  render: (status) => (
                    <Tag color={status === '正常' ? 'green' : 'orange'}>
                      {status}
                    </Tag>
                  )
                },
                { 
                  title: '操作', 
                  key: 'op', 
                  width: 120,
                  render: (_, record) => (
                    <Space>
                      <Button type="link" size="small">编辑</Button>
                      <Button type="link" size="small" danger>删除</Button>
                    </Space>
                  ) 
                }
              ]} 
            />
          </TabPane>
          
          <TabPane tab="库存初始化" key="stock">
            <Card size="small" title="库存初始化 (SKU级别)" style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 12, color: '#888', fontSize: '12px' }}>
                <InfoCircleOutlined /> 此处仅用于商品上架时的库存初始化。日常出入库操作请前往【库存管理】页面。
              </div>
              
              {productConfigs.map(config => (
                <Card 
                  key={config.product_config_id} 
                  size="small" 
                  style={{ marginBottom: 12 }}
                  title={
                    <Space>
                      {config.image && (
                        <Image 
                          src={getImageUrl(config.image)} 
                          width={30} 
                          height={30}
                          style={{ borderRadius: 2 }}
                          preview={{
                            mask: '预览',
                            src: getImageUrl(config.image)
                          }}
                        />
                      )}
                      <span>{config.config1} / {config.config2} {config.config3 ? `(${config.config3})` : ''}</span>
                    </Space>
                  }
                >
                  <Form 
                    form={stockForm}
                    layout="vertical" 
                    size="small" 
                    onFinish={(values) => handleStockSubmit(config.product_config_id, values)}
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item 
                          label="库存数量" 
                          name="stock_num" 
                          initialValue={config.stock?.stock_num || 0}
                          rules={[{ required: true, message: '请输入库存数量' }]}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} addonAfter={<StockOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item 
                          label="预警阈值" 
                          name="warn_num" 
                          initialValue={config.stock?.warn_num || 10}
                          rules={[{ required: true, message: '请输入预警数量' }]}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} addonAfter={<InfoCircleOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item 
                          label="冻结数量" 
                          name="freeze_num" 
                          initialValue={config.stock?.freeze_num || 0}
                        >
                          <InputNumber min={0} disabled style={{ width: '100%' }} addonAfter={<ClockCircleOutlined />} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                          保存库存设置
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>
              ))}
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ProductSkuPage;