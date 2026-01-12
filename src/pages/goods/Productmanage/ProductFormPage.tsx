/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Button, Input, Select, Space, Form, Typography, Tag,
  Divider, Upload, message, Modal, Image
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, UploadOutlined, 
  PlusOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import type { 
  BrandResponse, CategoryResponse, TagResponse, 
  ProductStatus, ProductUpdateRequest, ProductCreateRequest 
} from '../../../services/api-type';
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';
import {
  getBrands, getCategories, getTags, getProductDetail,
  createProduct, updateProduct
} from '../../../services/api';

const { Option } = Select;
const { TextArea } = Input;

// Zod Schema
const productSchema = z.object({
  name: z.string().min(1, '商品名称必填').max(100),
  brand_id: z.string().min(1, '请选择品牌'),
  category_id: z.string().min(1, '请选择品类'),
  sub_title: z.string().max(200, '副标题过长').optional().or(z.literal('')),
  description: z.string().max(5000, '描述内容过长').optional().or(z.literal('')),
  status: z.enum(['正常', '下架', '删除']).default('正常'),
  tag_ids: z.array(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [productDetail, setProductDetail] = useState<any>(null); 
  
  // 获取来源页面 - 优先从URL参数获取，其次从location.state获取
  const searchParams = new URLSearchParams(location.search);
  const returnParam = searchParams.get('return');
  const fromPath = returnParam || (location.state as any)?.from || '/goods/manage/list';
  
  const { 
    control, 
    handleSubmit, 
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { 
      status: '正常' as ProductStatus, 
      tag_ids: [],
      sub_title: '',
      description: '',
    }
  });

  // 加载选项数据
  const loadOptions = useCallback(async () => {
    try {
      // 使用真实API获取数据，不传递status参数，与ProductListPage保持一致
      const [brandsRes, categoriesRes, tagsRes] = await Promise.all([
        getBrands(), // 获取所有品牌
        getCategories(), // 获取所有品类
        getTags(), // 获取所有标签
      ]);

      // 处理品牌数据，前端筛选启用状态
      setBrands(brandsRes?.filter(brand => brand.status === '启用') || []);

      // 处理分类数据，前端筛选启用状态
      setCategories(categoriesRes?.filter(category => category.status === '启用') || []);

      // 处理标签数据，前端筛选启用状态
      setTags(tagsRes?.filter(tag => tag.status === '启用') || []);
    } catch (error) {
      console.error("加载选项失败", error);
      globalMessage.error('加载选项数据失败');
    }
  }, []);

  // 加载商品详情（编辑模式）
  const loadProductDetail = useCallback(async (productId: string) => {
    try {
      const detail = await getProductDetail(productId);
      
      if (detail) {
        setProductDetail(detail);
        
        // 如果有主图，设置预览
        if (detail.main_image) {
          setMainImagePreview(detail.main_image);
        }
        
        // 重置表单值
        reset({
          name: detail.name || '',
          brand_id: detail.brand_id || '',
          category_id: detail.category_id || '',
          sub_title: detail.sub_title || '',
          description: detail.description || '',
          status: detail.status || '正常',
          tag_ids: detail.tags ? detail.tags.map((t: any) => t.tag_id) : []
        });
      }
    } catch (error) {
      console.error('加载商品详情失败:', error);
      globalMessage.error('加载商品详情失败');
    }
  }, [reset]);

  // 初始化
  useEffect(() => {
    loadOptions();
    if (id) {
      loadProductDetail(id);
    }
  }, [id, loadOptions, loadProductDetail]);

  // 主图上传处理
  const handleMainImageUpload = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return false;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB');
      return false;
    }
    
    // 生成预览URL
    const previewUrl = URL.createObjectURL(file);
    setMainImagePreview(previewUrl);
    setMainImageFile(file);
    
    return false; // 阻止默认上传行为
  };

  // 移除主图
  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview('');
  };

  // 表单提交
  const onSubmit = async (values: ProductFormData) => {
    setLoading(true);
    try {
      if (isEditMode && id) {
        // 构建更新请求数据
        const updateData: ProductUpdateRequest & { mainImageFile?: File } = {
          name: values.name,
          brand_id: values.brand_id,
          category_id: values.category_id,
          sub_title: values.sub_title,
          description: values.description,
          status: values.status,
          mainImageFile: mainImageFile || undefined,
        };
        
        await updateProduct(id, updateData);
        globalMessage.success('商品信息更新成功');
      } else {
        // 构建创建请求数据
        const createData: ProductCreateRequest & { mainImageFile?: File } = {
          brand_id: values.brand_id,
          category_id: values.category_id,
          name: values.name,
          sub_title: values.sub_title,
          description: values.description,
          mainImageFile: mainImageFile || undefined,
        };
        
        await createProduct(createData);
        globalMessage.success('商品录入成功');
      }
      
      // 返回原页面
      navigate(fromPath);
    } catch (error: any) {
      console.error('表单提交失败:', error);
      const errorMsg = error?.response?.data?.message || '提交失败，请检查网络连接';
      globalMessage.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 品牌选项
  const brandOptions = brands.map(brand => ({
    label: brand.name,
    value: brand.brand_id
  }));

  // 品类选项
  const categoryOptions = categories.map(category => ({
    label: category.name,
    value: category.category_id
  }));

  // 标签选项
  const tagOptions = tags.map(tag => ({
    label: tag.name,
    value: tag.tag_id
  }));

  return (
    <div style={{ padding: 12, backgroundColor: '#f0f2f5', minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card size="small" bordered={false} title={
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Button 
                size="small" 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(fromPath)}
              />
              <Typography.Text strong>
                {isEditMode ? '编辑商品档案' : '录入新商品'}
              </Typography.Text>
            </Space>
            {isEditMode && id && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                正在编辑商品ID: 
                <Typography.Text copyable code style={{ marginLeft: 4 }}>
                  {id}
                </Typography.Text>
              </Typography.Text>
            )}
          </Space>
        }>
          {/* 商品信息概览卡片 - 只在编辑模式显示 */}
          {isEditMode && productDetail && (
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16, 
                backgroundColor: '#fafafa',
                borderLeft: '4px solid #1890ff'
              }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              <Row gutter={16} align="middle">
                <Col>
                  <Space>
                    <Typography.Text strong style={{ fontSize: 13 }}>
                      商品信息概览
                    </Typography.Text>
                    <Tag color={
                      productDetail.status === '正常' ? 'green' : 
                      productDetail.status === '下架' ? 'orange' : 'red'
                    }>
                      {productDetail.status}
                    </Tag>
                  </Space>
                </Col>
                <Col>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    ID: 
                  </Typography.Text>
                  <Typography.Text copyable code style={{ fontSize: 11, marginLeft: 4 }}>
                    {productDetail.product_id}
                  </Typography.Text>
                </Col>
                <Col>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    创建: 
                  </Typography.Text>
                  <Typography.Text style={{ fontSize: 11, marginLeft: 4 }}>
                    {dayjs(productDetail.created_at).format('YYYY-MM-DD')}
                  </Typography.Text>
                </Col>
                <Col>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    更新: 
                  </Typography.Text>
                  <Typography.Text style={{ fontSize: 11, marginLeft: 4 }}>
                    {dayjs(productDetail.updated_at).format('YYYY-MM-DD HH:mm')}
                  </Typography.Text>
                </Col>
                {productDetail.creator_name && (
                  <Col>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      创建人: 
                    </Typography.Text>
                    <Typography.Text style={{ fontSize: 11, marginLeft: 4 }}>
                      {productDetail.creator_name}
                    </Typography.Text>
                  </Col>
                )}
              </Row>
            </Card>
          )}

          {/* 新建商品提示 - 只在创建模式显示 */}
          {!isEditMode && (
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16, 
                backgroundColor: '#f6ffed',
                borderLeft: '4px solid #52c41a'
              }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              <Space>
                <Typography.Text type="secondary">
                  💡 提示：商品ID将在保存后由系统自动生成
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  （无需填写，系统会自动创建唯一标识）
                </Typography.Text>
              </Space>
            </Card>
          )}

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)} size="small">
            <Row gutter={24}>
              <Col span={16}>
                <Form.Item 
                  label="商品全称" 
                  required 
                  validateStatus={errors.name ? 'error' : ''} 
                  help={errors.name?.message}
                >
                  <Controller 
                    name="name" 
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="请输入商品名称" />} 
                  />
                </Form.Item>
                <Form.Item label="营销副标题">
                  <Controller 
                    name="sub_title" 
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="请输入商品副标题" />} 
                  />
                </Form.Item>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item 
                      label="所属品牌" 
                      required 
                      validateStatus={errors.brand_id ? 'error' : ''} 
                      help={errors.brand_id?.message}
                    >
                      <Controller 
                        name="brand_id" 
                        control={control}
                        render={({ field }) => (
                          <Select 
                            {...field} 
                            placeholder="选择品牌" 
                            showSearch 
                            optionFilterProp="label"
                            options={brandOptions}
                            dropdownRender={(menu) => (
                              <>
                                {menu}
                                <Divider style={{ margin: '8px 0' }} />
                                <Button 
                                  type="text" 
                                  icon={<PlusOutlined />} 
                                  block
                                  onClick={() => navigate('/goods/brand/create', {
                                    state: { from: window.location.pathname + window.location.search }
                                  })}
                                >
                                  添加新品牌
                                </Button>
                              </>
                            )}
                          />
                        )} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      label="商品类目" 
                      required 
                      validateStatus={errors.category_id ? 'error' : ''} 
                      help={errors.category_id?.message}
                    >
                      <Controller 
                        name="category_id" 
                        control={control}
                        render={({ field }) => (
                          <Select 
                            {...field} 
                            placeholder="选择类目" 
                            showSearch 
                            optionFilterProp="label"
                            options={categoryOptions}
                            dropdownRender={(menu) => (
                              <>
                                {menu}
                                <Divider style={{ margin: '8px 0' }} />
                                <Button 
                                  type="text" 
                                  icon={<PlusOutlined />} 
                                  block
                                  onClick={() => navigate('/goods/zone', {
                                    state: { from: window.location.pathname + window.location.search }
                                  })}
                                >
                                  管理品类
                                </Button>
                              </>
                            )}
                          />
                        )} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
              <Col span={8}>
                <Form.Item label="商品主图">
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <Upload
                      maxCount={1}
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={handleMainImageUpload}
                      disabled={loading}
                    >
                      <Button 
                        icon={<UploadOutlined />}
                      >
                        选择主图
                      </Button>
                    </Upload>
                    {mainImagePreview && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Image 
                          src={mainImagePreview.startsWith('blob:') ? mainImagePreview : getImageUrl(mainImagePreview)} 
                          alt="主图预览"
                          width={80} 
                          height={80} 
                          style={{ 
                            cursor: 'pointer', 
                            borderRadius: 4, 
                            objectFit: 'contain' 
                          }}
                          onClick={() => {
                            Modal.info({
                              title: '图片预览',
                              content: (
                                <div style={{ textAlign: 'center' }}>
                                  <Image 
                                    src={mainImagePreview.startsWith('blob:') ? mainImagePreview : getImageUrl(mainImagePreview)} 
                                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                                  />
                                </div>
                              ),
                              icon: null,
                              width: 600,
                              maskClosable: true
                            });
                          }}
                        />
                        <Button 
                          type="link" 
                          size="small" 
                          danger
                          onClick={handleRemoveMainImage}
                          style={{ marginTop: 4 }}
                        >
                          移除
                        </Button>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                    支持 JPG、PNG 格式，大小不超过 5MB。建议尺寸 800x800px
                  </div>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item label="商品标签">
              <Controller 
                name="tag_ids" 
                control={control}
                render={({ field }) => (
                  <Select 
                    {...field} 
                    mode="multiple" 
                    placeholder="选择标签" 
                    options={tagOptions}
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: '8px 0' }} />
                        <Button 
                          type="text" 
                          icon={<PlusOutlined />} 
                          block
                          onClick={() => navigate('/goods/tag', {
                            state: { from: window.location.pathname + window.location.search }
                          })}
                        >
                          管理标签
                        </Button>
                      </>
                    )}
                  />
                )} 
              />
            </Form.Item>
            
            <Form.Item label="业务状态">
              <Controller 
                name="status" 
                control={control}
                render={({ field }) => (
                  <Select {...field} style={{ width: 200 }}>
                    <Option value="正常">正常</Option>
                    <Option value="下架">下架</Option>
                    <Option value="删除">删除</Option>
                  </Select>
                )} 
              />
            </Form.Item>
            
            <Form.Item label="详细图文描述">
              <Controller 
                name="description" 
                control={control}
                render={({ field }) => (
                  <TextArea 
                    {...field} 
                    rows={6} 
                    placeholder="请输入商品详细描述" 
                    showCount 
                    maxLength={5000}
                  />
                )} 
              />
            </Form.Item>
            
            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button 
                size="small" 
                onClick={() => navigate(fromPath)}
                disabled={loading}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                size="small" 
                htmlType="submit" 
                icon={<SaveOutlined />} 
                loading={loading}
              >
                提交
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default ProductFormPage;