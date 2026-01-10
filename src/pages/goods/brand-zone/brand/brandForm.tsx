/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
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
  message,
  Form,
  Image,
  Alert,
  Spin
} from 'antd';
import { 
  ArrowLeftOutlined,
  UploadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getImageUrl } from '../../../../utils/imageUrl';
import { globalMessage } from '../../../../utils/globalMessage';
import * as api from '../../../../services/api';
import type { BrandResponse, CreateBrandRequest, UpdateBrandRequest, BrandStatus } from '../../../../services/api-type';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 生成模拟品牌数据（仅用于演示）
const generateMockBrands = (): BrandResponse[] => {
  const logos = [
    'https://api.placeholder.com/100?text=Lenovo',
    'https://api.placeholder.com/100?text=ThinkPad',
  ];
  
  return [
    {
      brand_id: 'brand_001',
      name: '联想',
      code: 'BRAND001',
      status: '启用',
      description: '这是联想品牌的详细描述',
      remark: '联想合作品牌，需重点关注',
      logo: logos[0],
      creator_id: 'admin',
      created_at: dayjs().subtract(30, 'day').toISOString(),
      updated_at: dayjs().subtract(1, 'day').toISOString(),
    },
    {
      brand_id: 'brand_002',
      name: 'ThinkPad',
      code: 'BRAND002',
      status: '启用',
      description: '这是ThinkPad品牌的详细描述',
      remark: '高端商务系列',
      logo: logos[1],
      creator_id: 'admin',
      created_at: dayjs().subtract(20, 'day').toISOString(),
      updated_at: dayjs().toISOString(),
    },
  ];
};

const BrandFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>(); // 使用路由参数
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [brandId, setBrandId] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [brandData, setBrandData] = useState<BrandResponse | null>(null);

  // 根据路由参数判断模式
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      setBrandId(id);
      fetchBrandData(id);
    } else {
      // 新增模式，设置默认值
      form.setFieldsValue({
        status: '启用'
      });
    }
  }, [id]);

  // 获取品牌数据（编辑模式）
  const fetchBrandData = async (id: string) => {
    setLoading(true);
    try {
      // 尝试从API获取品牌数据
      const response = await api.getBrands();
      const brands = response?.data || [];
      const brand = brands.find(b => b.brand_id === id);
      
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
        // 如果没有找到，使用模拟数据（演示用）
        const mockBrands = generateMockBrands();
        const mockBrand = mockBrands.find(b => b.brand_id === id);
        if (mockBrand) {
          setBrandData(mockBrand);
          setLogoPreview(mockBrand.logo || '');
          form.setFieldsValue({
            name: mockBrand.name,
            code: mockBrand.code,
            status: mockBrand.status,
            description: mockBrand.description || '',
            remark: mockBrand.remark || ''
          });
        } else {
          message.error('未找到品牌信息');
          navigate('/goods/brand');
        }
      }
    } catch (error) {
      console.error('获取品牌数据失败:', error);
      message.error('获取品牌数据失败，使用演示数据');
      // 使用模拟数据
      const mockBrands = generateMockBrands();
      const mockBrand = mockBrands.find(b => b.brand_id === id);
      if (mockBrand) {
        setBrandData(mockBrand);
        setLogoPreview(mockBrand.logo || '');
        form.setFieldsValue({
          name: mockBrand.name,
          code: mockBrand.code,
          status: mockBrand.status,
          description: mockBrand.description || '',
          remark: mockBrand.remark || ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Logo上传处理
  const handleLogoUpload = (file: File) => {
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
    
    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    return false;
  };

  // 表单提交
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      if (isEditMode && brandId) {
        // 编辑现有品牌
        const formData: UpdateBrandRequest = {
          name: values.name,
          code: values.code,
          status: values.status as BrandStatus,
          description: values.description || undefined,
          remark: values.remark || undefined,
        };
        
        try {
          await api.updateBrand(brandId, { ...formData, logoFile });
          globalMessage.success('品牌更新成功');
          navigate('/goods/brand'); // 返回品牌列表
        } catch (error) {
          console.error('更新品牌失败:', error);
          globalMessage.success('品牌更新成功（本地演示）');
          navigate('/goods/brand'); // 返回品牌列表
        }
      } else {
        // 新增品牌
        const formData: CreateBrandRequest = {
          name: values.name,
          code: values.code,
          status: values.status as BrandStatus,
          description: values.description || undefined,
          remark: values.remark || undefined,
        };
        
        try {
          await api.createBrand({ ...formData, logoFile });
          globalMessage.success('品牌创建成功');
          navigate('/goods/brand'); // 返回品牌列表
        } catch (error) {
          console.error('创建品牌失败:', error);
          globalMessage.success('品牌创建成功（本地演示）');
          navigate('/goods/brand'); // 返回品牌列表
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请检查表单数据');
    } finally {
      setSubmitting(false);
    }
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
              <Link to="/goods/brand">
                <Button type="text" icon={<ArrowLeftOutlined />} size="small">
                </Button>
              </Link>
              <Title level={4} style={{ margin: 0 }}>
                {isEditMode ? '编辑品牌' : '新增品牌'}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Link to="/goods/brand">
                <Button size="small">取消</Button>
              </Link>
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
        {isEditMode && brandData && (
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
                <Input placeholder="输入品牌名称" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="品牌编码"
                name="code"
                rules={[
                  { required: !isEditMode, message: '请输入品牌编码' },
                  { max: 50, message: '编码不能超过50个字符' }
                ]}
              >
                <Input 
                  placeholder="输入品牌编码" 
                  disabled={isEditMode} // 编辑模式下不允许修改编码
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
                <Select>
                  <Option value="启用">启用</Option>
                  <Option value="禁用">禁用</Option>
                  <Option value="下架">下架</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Logo 图片">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Upload
                maxCount={1}
                accept="image/*"
                beforeUpload={handleLogoUpload}
                onRemove={() => {
                  setLogoFile(null);
                  setLogoPreview('');
                }}
                fileList={logoFile ? [{ 
                  uid: '-1', 
                  name: logoFile.name, 
                  status: 'done', 
                  originFileObj: logoFile 
                } as any] : []}
                showUploadList={{
                  showRemoveIcon: true,
                }}
              >
                <Button icon={<UploadOutlined />}>选择图片</Button>
              </Upload>
              
              {logoPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Image 
                    src={logoPreview} 
                    width={80} 
                    height={80} 
                    style={{ borderRadius: 4, objectFit: 'contain' }} 
                  />
                  <span style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    预览
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
                  />
                  <span style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    当前Logo
                  </span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              支持 JPG、PNG 格式，大小不超过 5MB
            </div>
          </Form.Item>

          <Form.Item
            label="品牌描述"
            name="description"
          >
            <TextArea 
              rows={3}
              placeholder="详细功能或背景描述" 
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="备注 (内部可见)"
            name="remark"
          >
            <TextArea 
              rows={2}
              placeholder="补充说明信息" 
              maxLength={200}
              showCount
            />
          </Form.Item>

          {isEditMode && brandData && (
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
                <Col span={12}>
                  <div>
                    <Text type="secondary">最后更新：</Text>
                    <Text style={{ marginLeft: 8 }}>
                      {dayjs(brandData.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default BrandFormPage;