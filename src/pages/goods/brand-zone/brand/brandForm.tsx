/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  Upload, 
  Form,
  Image,
  Alert,
  Spin,
  message
} from 'antd';
import { 
  ArrowLeftOutlined,
  UploadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { getImageUrl } from '../../../../utils/imageUrl';
import { globalMessage } from '../../../../utils/globalMessage';
import * as api from '../../../../services/api';
import type { BrandResponse, BrandStatus, CreateBrandRequest } from '../../../../services/api-type';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface BrandFormData {
  name: string;
  code: string;
  status: BrandStatus;
  description?: string;
  remark?: string;
  logoFile?: File;
}

const BrandFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  
  // 获取来源页面（优先从state，否则使用默认路径）
  const fromPath = location.state?.from || '/goods/brand';
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [brandData, setBrandData] = useState<BrandResponse | null>(null);
  const [brandCodeExists, setBrandCodeExists] = useState<string[]>([]);

  // 获取所有品牌编码用于验证
  const fetchAllBrands = useCallback(async () => {
    try {
      const brands = await api.getBrands();
      const codes = brands.map((b: BrandResponse) => b.code);
      setBrandCodeExists(codes);
    } catch (error) {
      console.error('获取品牌列表失败:', error);
    }
  }, []);

  // 获取品牌数据（编辑模式）
  const fetchBrandData = useCallback(async (brandId: string) => {
    setLoading(true);
    try {
      // 从API获取所有品牌，然后查找特定品牌
      const brands = await api.getBrands();
      const brand = brands.find((b: BrandResponse) => b.brand_id === brandId);
      
      if (brand) {
        setBrandData(brand);
        setLogoPreview(brand.logo || '');
        form.setFieldsValue({
          name: brand.name,
          code: brand.code,
          status: brand.status,
          description: brand.description || '',
          remark: brand.remark || ''
        });
      } else {
        globalMessage.error('未找到品牌信息');
        navigate(fromPath);
      }
    } catch (error: any) {
      console.error('获取品牌数据失败:', error);
      const errorMessage = error.response?.data?.message || '获取品牌数据失败';
      globalMessage.error(errorMessage);
      navigate(fromPath);
    } finally {
      setLoading(false);
    }
  }, [form, navigate, fromPath]);

  // 根据路由参数判断模式
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchBrandData(id);
    } else {
      // 新增模式，设置默认值
      form.setFieldsValue({
        status: '启用'
      });
      // 获取所有品牌编码用于验证
      fetchAllBrands();
    }
  }, [id, fetchBrandData, form, fetchAllBrands]);

  // Logo上传处理
  const handleLogoUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return Upload.LIST_IGNORE;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB');
      return Upload.LIST_IGNORE;
    }
    
    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    return false; // 阻止自动上传
  };

  // Logo移除处理
  const handleLogoRemove = () => {
    setLogoFile(undefined);
    setLogoPreview('');
    return true;
  };

  // 验证品牌编码唯一性
  const validateBrandCode = async (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    
    // 编辑模式下，如果编码没有改变，则不需要验证
    if (isEditMode && brandData && value === brandData.code) {
      return Promise.resolve();
    }
    
    // 检查编码是否已存在
    if (brandCodeExists.includes(value)) {
      return Promise.reject(new Error('品牌编码已存在'));
    }
    
    // 检查编码格式
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      return Promise.reject(new Error('品牌编码只能包含字母、数字、下划线和连字符'));
    }
    
    return Promise.resolve();
  };

  // 表单提交
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      if (isEditMode && id) {
        // 编辑现有品牌
        const updateData: Partial<CreateBrandRequest> & { logoFile?: File } = {
          name: values.name,
          code: values.code,
          status: values.status as BrandStatus,
          description: values.description || undefined,
          //remark: values.remark || undefined,
          logoFile: logoFile
        };
        
        try {
          // 移除undefined字段
          Object.keys(updateData).forEach(key => {
            if (updateData[key as keyof typeof updateData] === undefined) {
              delete updateData[key as keyof typeof updateData];
            }
          });
          
          await api.updateBrand(id, updateData);
          globalMessage.success('品牌更新成功');
          navigate(fromPath);
        } catch (error: any) {
          console.error('更新品牌失败:', error);
          const errorMessage = error.response?.data?.message || '更新品牌失败';
          globalMessage.error(errorMessage);
        }
      } else {
        // 新增品牌
        const createData: CreateBrandRequest & { logoFile?: File } = {
          name: values.name,
          code: values.code,
          status: values.status as BrandStatus,
          description: values.description || undefined,
          logoFile: logoFile
        };
        
        try {
          await api.createBrand(createData);
          globalMessage.success('品牌创建成功');
          navigate(fromPath);
        } catch (error: any) {
          console.error('创建品牌失败:', error);
          const errorMessage = error.response?.data?.message || '创建品牌失败';
          globalMessage.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      globalMessage.error('请检查表单数据');
    } finally {
      setSubmitting(false);
    }
  };

  // 计算是否显示品牌信息
  const showBrandInfo = isEditMode && brandData;

  // 处理返回
  const handleBack = () => {
    navigate(fromPath);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 16, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 头部标题和返回按钮 */}
      <Card 
        size="small" 
        bordered={false}
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="middle">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                size="small"
                onClick={handleBack}
              />
              <Title level={4} style={{ margin: 0 }}>
                {isEditMode ? '编辑品牌' : '新增品牌'}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                size="small" 
                onClick={handleBack}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                size="small"
                loading={submitting}
                onClick={handleSubmit}
              >
                {isEditMode ? '更新品牌' : '创建品牌'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 表单区域 */}
      <Card 
        size="small" 
        bordered={false}
        bodyStyle={{ padding: 20 }}
      >
        {showBrandInfo && (
          <Alert
            message={
              <Space>
                <Text>正在编辑品牌：</Text>
                <Text strong>{brandData.name}</Text>
                <Text type="secondary">（编码：{brandData.code}）</Text>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          size="middle"
          initialValues={{
            status: '启用'
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="品牌名称"
                name="name"
                rules={[
                  { required: true, message: '请输入品牌名称' },
                  { max: 50, message: '名称不能超过50个字符' }
                ]}
              >
                <Input 
                  placeholder="输入品牌名称" 
                  maxLength={50}
                  allowClear
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="品牌编码"
                name="code"
                rules={[
                  { required: true, message: '请输入品牌编码' },
                  { validator: validateBrandCode }
                ]}
              >
                <Input 
                  placeholder="输入品牌编码" 
                  maxLength={50}
                  allowClear
                  disabled={isEditMode}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="启用">启用</Option>
                  <Option value="禁用">禁用</Option>
                  <Option value="下架">下架</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            label="Logo 图片"
            required={!isEditMode}
            extra="支持 JPG、PNG 格式，大小不超过 5MB"
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Upload
                maxCount={1}
                accept="image/*"
                beforeUpload={handleLogoUpload}
                onRemove={handleLogoRemove}
                fileList={logoFile ? [{ 
                  uid: '-1', 
                  name: logoFile.name, 
                  status: 'done'
                }] : []}
                showUploadList={{
                  showRemoveIcon: true,
                  showPreviewIcon: false
                }}
                listType="picture-card"
              >
                {!logoFile && !(isEditMode && brandData?.logo) && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传Logo</div>
                  </div>
                )}
              </Upload>
              
              {logoPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Image 
                    src={logoPreview} 
                    width={80} 
                    height={80} 
                    style={{ borderRadius: 4, objectFit: 'contain' }} 
                    preview={false}
                  />
                  <span style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    新Logo预览
                  </span>
                </div>
              )}
              
              {!logoPreview && isEditMode && brandData?.logo && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Image 
                    src={getImageUrl(brandData.logo)} 
                    width={80} 
                    height={80} 
                    style={{ borderRadius: 4, objectFit: 'contain' }} 
                    fallback="https://api.placeholder.com/80?text=LOGO"
                    preview={false}
                  />
                  <span style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    当前Logo
                  </span>
                </div>
              )}
            </div>
          </Form.Item>

          <Form.Item
            label="品牌描述"
            name="description"
            extra="最多500个字符"
          >
            <TextArea 
              rows={3}
              placeholder="详细功能或背景描述" 
              maxLength={500}
              showCount
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="备注 (内部可见)"
            name="remark"
            extra="最多200个字符"
          >
            <TextArea 
              rows={2}
              placeholder="补充说明信息" 
              maxLength={200}
              showCount
              allowClear
            />
          </Form.Item>

          {showBrandInfo && (
            <div style={{ marginTop: 20, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text type="secondary">创建者：</Text>
                    <Text style={{ marginLeft: 8 }}>{brandData.creator_id || '-'}</Text>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">创建时间：</Text>
                    <Text style={{ marginLeft: 8 }}>
                      {dayjs(brandData.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </div>
                </Col>
                {brandData.updated_at && (
                  <Col span={12}>
                    <div>
                      <Text type="secondary">最后更新：</Text>
                      <Text style={{ marginLeft: 8 }}>
                        {dayjs(brandData.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                      </Text>
                    </div>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default BrandFormPage;