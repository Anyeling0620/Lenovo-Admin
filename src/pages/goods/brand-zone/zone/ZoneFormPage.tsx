/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Form,
  Alert,
  Spin,
  TreeSelect
} from 'antd';
import { 
  ArrowLeftOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { globalMessage } from '../../../../utils/globalMessage';
import * as api from '../../../../services/api';
import type { CategoryResponse, CategoryStatus } from '../../../../services/api-type';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 模拟分类数据
const generateMockCategories = (): CategoryResponse[] => {
  return [
    {
      category_id: 'cat_001',
      name: '笔记本专区',
      code: 'ZONE01',
      parent_id: null,
      status: '启用',
    },
    {
      category_id: 'cat_002',
      name: '游戏本专区',
      code: 'ZONE02',
      parent_id: null,
      status: '启用',
    },
    {
      category_id: 'cat_003',
      name: '商务本专区',
      code: 'ZONE03',
      parent_id: null,
      status: '启用',
    },
    {
      category_id: 'cat_011',
      name: '笔记本专区 - 入门级',
      code: 'ZONE01_SUB01',
      parent_id: 'cat_001',
      status: '启用',
    },
    {
      category_id: 'cat_012',
      name: '笔记本专区 - 性能级',
      code: 'ZONE01_SUB02',
      parent_id: 'cat_001',
      status: '启用',
    },
  ];
};

const ZoneFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);

  // 构建树形选择数据
  const buildTreeSelectData = (catList: CategoryResponse[]) => {
    const map = new Map();
    const result: any[] = [];
    
    catList.forEach(cat => {
      map.set(cat.category_id, {
        value: cat.category_id,
        title: `${cat.name} (${cat.code})`,
        disabled: cat.category_id === id, // 不能选择自己作为父级
        children: []
      });
    });
    
    catList.forEach(cat => {
      const node = map.get(cat.category_id);
      if (cat.parent_id) {
        const parent = map.get(cat.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        result.push(node);
      }
    });
    
    return result;
  };

  // 根据路由参数判断模式
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchCategoryData(id);
    } else {
      // 新增模式，设置默认值
      form.setFieldsValue({
        status: '启用'
      });
    }
    fetchCategories();
  }, [id]);

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      let catList = response?.data || [];
      
      if (catList.length === 0) {
        catList = generateMockCategories();
      }
      
      setCategories(catList);
      setTreeData(buildTreeSelectData(catList));
    } catch (error) {
      console.error('获取分类列表失败:', error);
      const mockCategories = generateMockCategories();
      setCategories(mockCategories);
      setTreeData(buildTreeSelectData(mockCategories));
    }
  };

  // 获取专区数据（编辑模式）
  const fetchCategoryData = async (categoryId: string) => {
    setLoading(true);
    try {
      // 从API获取所有分类，然后查找指定的分类
      const response = await api.getCategories();
      const categories = response?.data || [];
      const category = categories.find(c => c.category_id === categoryId);
      
      if (category) {
        setCategoryData(category);
        form.setFieldsValue({
          name: category.name,
          code: category.code,
          parent_id: category.parent_id,
          status: category.status,
        });
      } else {
        // 使用模拟数据
        const mockCategories = generateMockCategories();
        const mockCategory = mockCategories.find(c => c.category_id === categoryId);
        if (mockCategory) {
          setCategoryData(mockCategory);
          form.setFieldsValue({
            name: mockCategory.name,
            code: mockCategory.code,
            parent_id: mockCategory.parent_id,
            status: mockCategory.status,
          });
        } else {
          globalMessage.error('未找到专区信息');
          navigate('/goods/zone');
        }
      }
    } catch (error) {
      console.error('获取专区数据失败:', error);
      // 使用模拟数据
      const mockCategories = generateMockCategories();
      const mockCategory = mockCategories.find(c => c.category_id === categoryId);
      if (mockCategory) {
        setCategoryData(mockCategory);
        form.setFieldsValue({
          name: mockCategory.name,
          code: mockCategory.code,
          parent_id: mockCategory.parent_id,
          status: mockCategory.status,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 表单提交
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isEditMode && id) {
        globalMessage.success('专区更新成功');
      } else {
        globalMessage.success('专区创建成功');
      }
      
      navigate('/goods/zone');
    } catch (error) {
      console.error('表单验证失败:', error);
      globalMessage.error('请检查表单数据');
    } finally {
      setSubmitting(false);
    }
  };

  // 生成专区编码
  const generateZoneCode = () => {
    const maxCode = categories.reduce((max, cat) => {
      const match = cat.code.match(/ZONE(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    
    const newCode = `ZONE${(maxCode + 1).toString().padStart(2, '0')}`;
    form.setFieldsValue({ code: newCode });
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
              <Link to="/goods/zone">
                <Button type="text" icon={<ArrowLeftOutlined />} size="small">
                </Button>
              </Link>
              <Title level={4} style={{ margin: 0 }}>
                {isEditMode ? '编辑专区' : '新增专区'}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Link to="/goods/zone">
                <Button size="small">取消</Button>
              </Link>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                size="small"
                loading={submitting}
                onClick={handleSubmit}
              >
                {isEditMode ? '更新专区' : '创建专区'}
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
        {isEditMode && categoryData && (
          <Alert
            message={
              <Space>
                <Text>正在编辑专区：</Text>
                <Text strong>{categoryData.name}</Text>
                <Text type="secondary">（编码：{categoryData.code}）</Text>
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
                label="专区名称"
                name="name"
                rules={[
                  { required: true, message: '请输入专区名称' },
                  { max: 50, message: '名称不能超过50个字符' }
                ]}
              >
                <Input placeholder="输入专区名称，如：笔记本专区" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="专区编码"
                name="code"
                rules={[
                  { required: true, message: '请输入专区编码' },
                  { max: 20, message: '编码不能超过20个字符' },
                  {
                    pattern: /^[A-Z0-9_]+$/,
                    message: '编码只能包含大写字母、数字和下划线'
                  }
                ]}
                extra={
                  !isEditMode && (
                    <Button type="link" size="small" onClick={generateZoneCode}>
                      自动生成编码
                    </Button>
                  )
                }
              >
                <Input 
                  placeholder="如：ZONE01" 
                  disabled={isEditMode}
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="父级专区"
                name="parent_id"
              >
                <TreeSelect
                  treeData={treeData}
                  placeholder="选择父级专区（不选则为一级专区）"
                  allowClear
                  style={{ width: '100%' }}
                  treeDefaultExpandAll
                  dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="启用">启用</Option>
                  <Option value="禁用">禁用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {isEditMode && categoryData && (
            <div style={{ marginTop: 20, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text type="secondary">创建时间：</Text>
                    <Text style={{ marginLeft: 8 }}>
                      {new Date().toLocaleDateString()} {/* 模拟时间 */}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text type="secondary">最后更新：</Text>
                    <Text style={{ marginLeft: 8 }}>
                      {new Date().toLocaleDateString()} {/* 模拟时间 */}
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f6ffed', borderRadius: 4 }}>
            <Text type="success" style={{ fontSize: 13 }}>
              💡 说明：
            </Text>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
              1. 一级专区用于组织商品的主要分类（如笔记本专区、游戏本专区）<br />
              2. 二级分类可用于细分（如笔记本专区下的入门级、性能级）<br />
              3. 编码建议使用大写字母和数字，如 ZONE01、ZONE01_SUB01<br />
              4. 禁用的专区将不在前台展示
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ZoneFormPage;