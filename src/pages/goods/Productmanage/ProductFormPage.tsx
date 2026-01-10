/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Button, Input, Select, Space, Form, Typography,Tag,
  Divider, Upload, message,Modal, Image
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, UploadOutlined, LoadingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import {
  getBrands, getCategories, getTags, getProductDetail,
  createProduct, updateProduct
} from '../../../services/api';
// 导入模拟数据
import { mockBrands, mockCategories, mockTags, findMockProductDetail } from '../../../services/cyf-mockData';

const { Option } = Select;
const { TextArea } = Input;

// Zod Schema
const productSchema = z.object({
  name: z.string().min(1, '商品名称必填').max(100),
  brand_id: z.string().min(1, '请选择品牌'),
  category_id: z.string().min(1, '请选择品类'),
  sub_title: z.string().max(200, '副标题过长').optional().or(z.literal('')),
  description: z.string().max(5000, '描述内容过长').optional().or(z.literal('')),
  main_image: z.string().optional().or(z.literal('')),
  status: z.nativeEnum({正常: '正常', 下架: '下架', 删除: '删除'}),
  tag_ids: z.array(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// 图片上传处理函数
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

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [brands, setBrands] = useState<{ label: string; value: string }[]>([]);
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  const [tags, setTags] = useState<{ label: string; value: string }[]>([]);
  const [productDetail, setProductDetail] = useState<any>(null); 
  // 使用模拟数据标志
  const useMockData = true;
  const fromPath = (location.state as any)?.from || '/goods/manage/list';
  const { 
    control, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { 
      status: '正常' as ProductStatus, 
      tag_ids: [],
      sub_title: '',
      description: '',
      main_image: ''
    }
  });

  // 加载选项数据
  const loadOptions = useCallback(async () => {
    try {
      if (useMockData) {
        // 使用模拟数据
        setBrands(mockBrands.map((b: BrandResponse) => ({ label: b.name, value: b.brand_id })));
        setCategories(mockCategories.map((c: CategoryResponse) => ({ label: c.name, value: c.category_id })));
        setTags(mockTags.map((t: TagResponse) => ({ label: t.name, value: t.tag_id })));
      } else {
        const [brandsRes, categoriesRes, tagsRes] = await Promise.all([
          getBrands(),
          getCategories(),
          getTags(),
        ]);
        
        setBrands(brandsRes?.map((b: BrandResponse) => ({ label: b.name, value: b.brand_id })) || []);
        setCategories(categoriesRes?.map((c: CategoryResponse) => ({ label: c.name, value: c.category_id })) || []);
        setTags(tagsRes?.map((t: TagResponse) => ({ label: t.name, value: t.tag_id })) || []);
      }
    } catch (error) {
      console.error("加载选项失败", error);
    }
  }, [useMockData]);

  // 加载商品详情（编辑模式）
  const loadProductDetail = useCallback(async (productId: string) => {
    try {
      let detail;
      
      if (useMockData) {
        // 使用模拟数据
        detail = findMockProductDetail(productId);
      } else {
        detail = await getProductDetail(productId);
      }
      
      if (detail) {
        setProductDetail(detail); // 保存完整的商品详情
        reset({
          name: detail.name || '',
          brand_id: detail.brand_id || '',
          category_id: detail.category_id || '',
          sub_title: detail.sub_title || '',
          description: detail.description || '',
          main_image: detail.main_image || '',
          status: (detail.status as ProductStatus) || '正常',
          tag_ids: detail.tags ? detail.tags.map((t: any) => t.tag_id) : []
        });
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  }, [reset, useMockData]);

  // 初始化
  useEffect(() => {
    loadOptions();
    if (id) {
      loadProductDetail(id);
    }
  }, [id, loadOptions, loadProductDetail]);

  // 主图上传处理
  const handleMainImageUpload = async (file: File) => {
    setMainImageUploading(true);
    try {
      const imageUrl = await handleImageUpload(file);
      setValue('main_image', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('主图上传失败:', error);
      return '';
    } finally {
      setMainImageUploading(false);
    }
  };

  // 表单提交
  const onSubmit = async (values: ProductFormData) => {
    setLoading(true);
    try {
      globalMessage.loading('提交中...');
      
      if (isEditMode && id) {
        // 构建更新请求数据
        const updateData: ProductUpdateRequest = {
          name: values.name,
          brand_id: values.brand_id,
          category_id: values.category_id,
          sub_title: values.sub_title,
          description: values.description,
          main_image: values.main_image,
          status: values.status,
        };
        
        if (useMockData) {
          // 模拟更新
          globalMessage.success('商品信息更新成功');
        } else {
          await updateProduct(id, updateData);
          globalMessage.success('商品信息更新成功');
        }
      } else {
        // 构建创建请求数据
        const createData: ProductCreateRequest = {
          brand_id: values.brand_id,
          category_id: values.category_id,
          name: values.name,
          sub_title: values.sub_title,
          description: values.description,
          main_image: values.main_image,
        };
        
        if (useMockData) {
          // 模拟创建
          globalMessage.success('商品录入成功');
        } else {
          await createProduct(createData);
          globalMessage.success('商品录入成功');
        }
      }
      
      // 返回原页面
      navigate(fromPath);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 12, backgroundColor: '#f0f2f5', minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card size="small" bordered={false} title={
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Button 
                size="small" 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(fromPath)} // 修改返回逻辑
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
                    render={({ field }) => <Input {...field} />} 
                  />
                </Form.Item>
                <Form.Item label="营销副标题">
                  <Controller 
                    name="sub_title" 
                    control={control}
                    render={({ field }) => <Input {...field} />} 
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
                        options={brands}
                        dropdownRender={(menu) => (
                        <>
                            {menu}
                            <Divider style={{ margin: '8px 0' }} />
                            <Button 
                            type="text" 
                            icon={<PlusOutlined />} 
                            block
                            onClick={() => navigate('/goods/brand/create')}
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
                        options={categories}
                        dropdownRender={(menu) => (
                            <>
                            {menu}
                            <Divider style={{ margin: '8px 0' }} />
                            <Button 
                                type="text" 
                                icon={<PlusOutlined />} 
                                block
                                onClick={() => navigate('/goods/category/add')}
                            >
                                添加新品类
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
                  <Controller 
                    name="main_image" 
                    control={control}
                    render={({ field }) => (
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <Upload
                          maxCount={1}
                          accept="image/*"
                          showUploadList={{ showRemoveIcon: true }}
                          fileList={field.value ? [{ 
                            uid: '-1', 
                            name: 'main_image.png', 
                            status: 'done', 
                            url: field.value 
                          }] : []}
                          beforeUpload={async (file) => {
                            const url = await handleMainImageUpload(file);
                            if (url) {
                              field.onChange(url);
                            }
                            return false;
                          }}
                          onRemove={() => {
                            field.onChange('');
                          }}
                          disabled={mainImageUploading}
                        >
                          <Button 
                            icon={mainImageUploading ? <LoadingOutlined /> : <UploadOutlined />}
                            loading={mainImageUploading}
                          >
                            选择主图
                          </Button>
                        </Upload>
                        {field.value && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Image 
                            src={field.value.startsWith('data:image') ? field.value : getImageUrl(field.value)} 
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
                                        src={field.value.startsWith('data:image') ? field.value : getImageUrl(field.value)} 
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
                            <span style={{ fontSize: 12, color: '#999', marginTop: 4 }}>点击预览</span>
                        </div>
                        )}
                      </div>
                    )} 
                  />
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
                    options={tags}
                    dropdownRender={(menu) => (
                        <>
                        {menu}
                        <Divider style={{ margin: '8px 0' }} />
                        <Button 
                            type="text" 
                            icon={<PlusOutlined />} 
                            block
                            onClick={() => navigate('/goods/tag/add')}
                        >
                            添加新标签
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
                    <Option value="正常">正常 (NORMAL)</Option>
                    <Option value="下架">下架 (OFF)</Option>
                    <Option value="删除">删除 (DELETED)</Option>
                  </Select>
                )} 
              />
            </Form.Item>
            
            <Form.Item label="详细图文描述">
              <Controller 
                name="description" 
                control={control}
                render={({ field }) => <TextArea {...field} rows={6} />} 
              />
            </Form.Item>
            
            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Link to="/goods/manage/list">
                <Button size="small">取消</Button>
              </Link>
              <Button 
                type="primary" 
                size="small" 
                htmlType="submit" 
                icon={<SaveOutlined />} 
                loading={loading || isSubmitting}
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