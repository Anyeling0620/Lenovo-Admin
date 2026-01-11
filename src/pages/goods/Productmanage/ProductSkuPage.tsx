/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Button, Input, Select, Space, Form, Table, Tag,
  Typography, Upload, InputNumber, Tabs, message, Image, Modal, Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, UploadOutlined, LoadingOutlined,
  StockOutlined, InfoCircleOutlined, ClockCircleOutlined, SaveOutlined,
  EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { 
  ProductConfigResponse, 
  ProductConfigStatus,
  ProductConfigCreateRequest,
  ProductConfigUpdateRequest,
  StockUpdateRequest
} from '../../../services/api-type';
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { 
  getProductConfigs, 
  addProductConfig, 
  getProductDetail, 
  updateStock,
  updateProductConfig,
  deleteProductConfig,
  updateProductConfigStatus
} from '../../../services/api';

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
  configImageFile: z.any().optional(),
  status: z.enum(['正常', '下架']),
});

type ProductConfigFormData = z.infer<typeof productConfigSchema>;

const ProductSkuPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [configImageUploading, setConfigImageUploading] = useState(false);
  const [productConfigs, setProductConfigs] = useState<ProductConfigResponse[]>([]);
  const [productDetail, setProductDetail] = useState<any>(null);
  const [stockForm] = Form.useForm();
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [configImageFile, setConfigImageFile] = useState<File | null>(null);
  
  // 从URL参数获取返回路径，如果没有则使用默认路径
  const searchParams = new URLSearchParams(location.search);
  const fromPath = searchParams.get('return') || '/goods/manage/list';
  
  const { 
    control: configControl, 
    handleSubmit: handleConfigSubmit,
    reset: resetConfigForm,
    setValue: setConfigValue,
  } = useForm<ProductConfigFormData>({
    resolver: zodResolver(productConfigSchema),
    defaultValues: { 
      status: '正常' as ProductConfigStatus,
      sale_price: 0,
      original_price: 0,
      config1: '',
      config2: '',
      config3: '',
    }
  });

  // 加载商品详情
  const loadProductDetail = useCallback(async () => {
    if (!id) return;
    
    try {
      const detail = await getProductDetail(id);
      setProductDetail(detail);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  }, [id]);

  // 加载商品配置
  const loadProductConfigs = useCallback(async () => {
    if (!id) return;
    
    try {
      const configs = await getProductConfigs(id);
      setProductConfigs(Array.isArray(configs) ? configs : []);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  }, [id]);

  // 初始化加载
  useEffect(() => {
    loadProductDetail();
    loadProductConfigs();
  }, [loadProductDetail, loadProductConfigs]);

  // 图片上传处理
  const handleImageUpload = async (file: File): Promise<File> => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      throw new Error('只能上传图片文件');
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB');
      throw new Error('图片大小不能超过5MB');
    }
    
    return file;
  };

  // 配置图片上传
  const handleConfigImageUpload = async (file: File) => {
    setConfigImageUploading(true);
    try {
      const uploadedFile = await handleImageUpload(file);
      setConfigImageFile(uploadedFile);
      message.success('图片上传成功');
      return uploadedFile;
    } catch (error) {
      console.error('配置图片上传失败:', error);
      return null;
    } finally {
      setConfigImageUploading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    resetConfigForm();
    setConfigImageFile(null);
    setEditingConfigId(null);
  };

  // 配置提交
  const onConfigSubmit = async (values: ProductConfigFormData) => {
    if (!id) return;
    
    try {
      globalMessage.loading('保存配置中...');
      
      if (editingConfigId) {
        // 编辑现有配置
        const updateData: ProductConfigUpdateRequest & { configImageFile?: File } = {
          config1: values.config1,
          config2: values.config2,
          config3: values.config3 || null,  // 修复：将 undefined 转换为 null
          sale_price: Number(values.sale_price),  // 修复：确保是数字类型
          original_price: Number(values.original_price),  // 修复：确保是数字类型
          status: values.status,
          configImageFile: configImageFile || undefined
        };
        
        await updateProductConfig(editingConfigId, updateData);
        globalMessage.success('配置更新成功');
      } else {
        // 新增配置
        const createData: ProductConfigCreateRequest & { configImageFile?: File } = {
          product_id: id,
          config1: values.config1,
          config2: values.config2,
          config3: values.config3 || '',  // 修复：将 undefined 转换为空字符串
          sale_price: Number(values.sale_price),  // 修复：确保是数字类型
          original_price: Number(values.original_price),  // 修复：确保是数字类型
          configImageFile: configImageFile || undefined
        };
        
        await addProductConfig(id, createData);
        globalMessage.success('配置添加成功');
      }
      
      await loadProductConfigs();
      resetForm();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 编辑配置
  const handleEditConfig = (config: ProductConfigResponse) => {
    setEditingConfigId(config.product_config_id);
    setConfigValue('config1', config.config1);
    setConfigValue('config2', config.config2);
    setConfigValue('config3', config.config3 || '');
    setConfigValue('sale_price', Number(config.sale_price));  // 修复：确保转换为数字
    setConfigValue('original_price', Number(config.original_price));  // 修复：确保转换为数字
    setConfigValue('status', config.status);
    setConfigImageFile(null); // 重置图片文件，如果需要重新上传
  };

  // 删除配置
  const handleDeleteConfig = async (configId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除此配置吗？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProductConfig(configId);
          message.success('配置已删除');
          await loadProductConfigs();
        } catch (error) {
          globalErrorHandler.handle(error, globalMessage.error);
        }
      }
    });
  };

  // 更新配置状态
  const handleUpdateConfigStatus = async (configId: string, status: ProductConfigStatus) => {
    try {
      await updateProductConfigStatus(configId, status);
      message.success(`配置已${status === '正常' ? '上架' : '下架'}`);
      await loadProductConfigs();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 库存更新
  const handleStockSubmit = async (configId: string, values: any) => {
    try {
      const updateData: StockUpdateRequest = {
        stock_num: Number(values.stock_num),  // 修复：确保是数字类型
        warn_num: Number(values.warn_num),  // 修复：确保是数字类型
      };
      
      await updateStock(configId, updateData);
      globalMessage.success('库存更新成功');
      await loadProductConfigs();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 处理图片显示
  const renderImage = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return <span style={{ color: '#999' }}>无图片</span>;
    
    return (
      <Image 
        src={getImageUrl(imageUrl as string)} 
        width={40} 
        height={40}
        style={{ borderRadius: 4 }}
        preview={{
          mask: '预览',
          src: getImageUrl(imageUrl as string)
        }}
      />
    );
  };

  return (
    <div style={{ padding: 12 }}>
      <Card 
        size="small" 
        bordered={false} 
        title={
          <Space>
            <Button 
              size="small" 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(fromPath)}
            />
            SKU 规格与价格管理
          </Space>
        }
      >
        <div 
          style={{ 
            marginBottom: 12, 
            padding: '8px 12px', 
            background: '#fafafa', 
            borderRadius: 4 
          }}
        >
          <Text type="secondary">正在管理商品: </Text>
          <Text strong>{productDetail?.name}</Text>
        </div>
        
        <Tabs defaultActiveKey="configs">
          <TabPane tab="规格配置" key="configs">
            <Card 
              size="small" 
              title={editingConfigId ? "编辑规格配置" : "新增规格配置"} 
              style={{ marginBottom: 16 }}
            >
              <Form 
                layout="vertical" 
                size="small" 
                onFinish={handleConfigSubmit(onConfigSubmit)}
              >
                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item label="配置1 (如颜色)" required>
                      <Controller 
                        name="config1" 
                        control={configControl}
                        render={({ field, fieldState }) => (
                          <>
                            <Input 
                              {...field} 
                              placeholder="如：黑色" 
                            />
                            {fieldState.error && (
                              <div style={{ color: '#ff4d4f', fontSize: 12 }}>
                                {fieldState.error.message}
                              </div>
                            )}
                          </>
                        )} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="配置2 (如内存)" required>
                      <Controller 
                        name="config2" 
                        control={configControl}
                        render={({ field, fieldState }) => (
                          <>
                            <Input 
                              {...field} 
                              placeholder="如：16GB" 
                            />
                            {fieldState.error && (
                              <div style={{ color: '#ff4d4f', fontSize: 12 }}>
                                {fieldState.error.message}
                              </div>
                            )}
                          </>
                        )} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="配置3 (如尺寸)">
                      <Controller 
                        name="config3" 
                        control={configControl}
                        render={({ field }) => (
                          <Input 
                            {...field} 
                            placeholder="如：15.6寸" 
                          />
                        )} 
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
                        render={({ field, fieldState }) => (
                          <>
                            <InputNumber 
                              {...field} 
                              style={{ width: '100%' }} 
                              min={0} 
                              onChange={(value) => field.onChange(value)}
                            />
                            {fieldState.error && (
                              <div style={{ color: '#ff4d4f', fontSize: 12 }}>
                                {fieldState.error.message}
                              </div>
                            )}
                          </>
                        )} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="原价 (¥)" required>
                      <Controller 
                        name="original_price" 
                        control={configControl}
                        render={({ field, fieldState }) => (
                          <>
                            <InputNumber 
                              {...field} 
                              style={{ width: '100%' }} 
                              min={0} 
                              onChange={(value) => field.onChange(value)}
                            />
                            {fieldState.error && (
                              <div style={{ color: '#ff4d4f', fontSize: 12 }}>
                                {fieldState.error.message}
                              </div>
                            )}
                          </>
                        )} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="配置图片">
                      <div 
                        style={{ 
                          display: 'flex', 
                          gap: 16, 
                          alignItems: 'center' 
                        }}
                      >
                        <Upload
                          maxCount={1} 
                          accept="image/*" 
                          showUploadList={false}
                          beforeUpload={async (file) => { 
                            await handleConfigImageUpload(file);
                            return false; 
                          }}
                          disabled={configImageUploading}
                        >
                          <Button 
                            icon={
                              configImageUploading 
                                ? <LoadingOutlined /> 
                                : <UploadOutlined />
                            }
                            loading={configImageUploading}
                          >
                            选择图片
                          </Button>
                        </Upload>
                        {configImageFile && (
                          <div>
                            <Image 
                              src={URL.createObjectURL(configImageFile)} 
                              width={40} 
                              height={40}
                              style={{ borderRadius: 4 }}
                              preview={{
                                mask: '预览',
                                src: URL.createObjectURL(configImageFile)
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div 
                        style={{ 
                          fontSize: 12, 
                          color: '#999', 
                          marginTop: 4 
                        }}
                      >
                        配置专属图片（如特定颜色的商品图）
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={editingConfigId ? <SaveOutlined /> : <PlusOutlined />}
                    >
                      {editingConfigId ? "保存修改" : "添加规格"}
                    </Button>
                    {editingConfigId && (
                      <Button onClick={resetForm}>
                        取消编辑
                      </Button>
                    )}
                  </Space>
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
                  render: (_, record) => renderImage(record.image)
                },
                { 
                  title: '规格组合', 
                  key: 'config', 
                  render: (_, record) => (
                    <div>
                      <div>
                        <strong>
                          {record.config1} / {record.config2}
                        </strong>
                      </div>
                      {record.config3 && (
                        <div 
                          style={{ 
                            fontSize: '11px', 
                            color: '#999' 
                          }}
                        >
                          {record.config3}
                        </div>
                      )}
                    </div>
                  )
                },
                { 
                  title: '售价', 
                  dataIndex: 'sale_price', 
                  render: (price) => (
                    <span 
                      style={{ 
                        color: '#ff4d4f', 
                        fontWeight: 'bold' 
                      }}
                    >
                      ¥{Number(price)}
                    </span>
                  )
                },
                { 
                  title: '原价', 
                  dataIndex: 'original_price', 
                  render: (price) => (
                    <span 
                      style={{ 
                        textDecoration: 'line-through', 
                        color: '#999' 
                      }}
                    >
                      ¥{Number(price)}
                    </span>
                  )
                },
                { 
                  title: '库存', 
                  key: 'stock',
                  render: (_, record) => {
                    const stockNum = record.stock?.stock_num ?? 0;
                    const warnNum = record.stock?.warn_num ?? 0;
                    
                    return (
                      <div>
                        <div>总库存: {Number(stockNum)}</div>
                        <div 
                          style={{ 
                            fontSize: '11px', 
                            color: stockNum <= warnNum 
                              ? '#ff4d4f' 
                              : '#52c41a' 
                          }}
                        >
                          预警: {Number(warnNum)}
                        </div>
                      </div>
                    );
                  }
                },
                { 
                  title: '状态', 
                  dataIndex: 'status',
                  render: (status, record) => (
                    <Popconfirm
                      title={`确定${status === '正常' ? '下架' : '上架'}此配置吗？`}
                      onConfirm={() => handleUpdateConfigStatus(
                        record.product_config_id, 
                        status === '正常' ? '下架' : '正常'
                      )}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Tag 
                        color={status === '正常' ? 'green' : 'orange'}
                        style={{ cursor: 'pointer' }}
                      >
                        {status}
                      </Tag>
                    </Popconfirm>
                  )
                },
                { 
                  title: '操作', 
                  key: 'op', 
                  width: 120,
                  render: (_, record) => (
                    <Space>
                      <Button 
                        type="link" 
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditConfig(record)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定删除此配置吗？"
                        onConfirm={() => handleDeleteConfig(record.product_config_id)}
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <Button 
                          type="link" 
                          size="small" 
                          danger
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  ) 
                }
              ]} 
            />
          </TabPane>
          
          <TabPane tab="库存初始化" key="stock">
            <Card 
              size="small" 
              title="库存初始化 (SKU级别)" 
              style={{ marginTop: 16 }}
            >
              <div 
                style={{ 
                  marginBottom: 12, 
                  color: '#888', 
                  fontSize: '12px' 
                }}
              >
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
                          src={getImageUrl(config.image as string)} 
                          width={30} 
                          height={30}
                          style={{ borderRadius: 2 }}
                          preview={{
                            mask: '预览',
                            src: getImageUrl(config.image as string)
                          }}
                        />
                      )}
                      <span>
                        {config.config1} / {config.config2} 
                        {config.config3 ? `(${config.config3})` : ''}
                      </span>
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
                          initialValue={Number(config.stock?.stock_num ?? 0)}
                          rules={[{ required: true, message: '请输入库存数量' }]}
                        >
                          <InputNumber 
                            min={0} 
                            style={{ width: '100%' }} 
                            addonAfter={<StockOutlined />} 
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item 
                          label="预警阈值" 
                          name="warn_num" 
                          initialValue={Number(config.stock?.warn_num ?? 10)}
                          rules={[{ required: true, message: '请输入预警数量' }]}
                        >
                          <InputNumber 
                            min={0} 
                            style={{ width: '100%' }} 
                            addonAfter={<InfoCircleOutlined />} 
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item 
                          label="冻结数量" 
                          name="freeze_num" 
                          initialValue={Number(config.stock?.freeze_num ?? 0)}
                        >
                          <InputNumber 
                            min={0} 
                            disabled 
                            style={{ width: '100%' }} 
                            addonAfter={<ClockCircleOutlined />} 
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item>
                      <Space>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          icon={<SaveOutlined />}
                        >
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