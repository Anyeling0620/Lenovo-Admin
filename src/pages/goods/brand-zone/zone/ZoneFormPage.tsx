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
  Form,
  Alert,
  Spin,
  TreeSelect
} from 'antd';
import { 
  ArrowLeftOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { globalMessage } from '../../../../utils/globalMessage';
import * as api from '../../../../services/api';
import type { CategoryResponse, CategoryStatus } from '../../../../services/api-type';

const { Title, Text } = Typography;
const { Option } = Select;

interface CategoryFormData {
  name: string;
  code: string;
  parent_id?: string | null;
  status: CategoryStatus;
}

const ZoneFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);

  // 获取来源页面（优先从state，否则使用默认路径）
  const fromPath = location.state?.from || '/goods/zone';
  
  // 构建树形选择数据
  const buildTreeSelectData = useCallback((catList: CategoryResponse[]) => {
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
  }, [id]);

  // 获取分类列表
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      // 调用真实API获取分类列表
      const catList = await api.getCategories();
      setCategories(catList);
      setTreeData(buildTreeSelectData(catList));
    } catch (error) {
      console.error('获取分类列表失败:', error);
      globalMessage.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  }, [buildTreeSelectData]);

  // 获取专区数据（编辑模式）
  const fetchCategoryData = useCallback(async (categoryId: string) => {
    setLoading(true);
    try {
      // 从API获取所有分类，然后查找指定的分类
      const categories = await api.getCategories();
      const category = categories.find((c: CategoryResponse) => c.category_id === categoryId);
      
      if (category) {
        setCategoryData(category);
        form.setFieldsValue({
          name: category.name,
          code: category.code,
          parent_id: category.parent_id,
          status: category.status,
        });
      } else {
        globalMessage.error('未找到专区信息');
        navigate(fromPath);
      }
    } catch (error) {
      console.error('获取专区数据失败:', error);
      globalMessage.error('获取专区数据失败');
      navigate(fromPath);
    } finally {
      setLoading(false);
    }
  }, [form, navigate, fromPath]);

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
  }, [id, form, fetchCategoryData, fetchCategories]);

  // 表单提交
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      // 准备API数据
      const apiData: CategoryFormData = {
        name: values.name,
        code: values.code,
        parent_id: values.parent_id || null,
        status: values.status
      };
      
      // 调用API
      if (isEditMode && id) {
        // 更新分类
        await api.updateCategory(id, apiData);
        globalMessage.success('专区更新成功');
      } else {
        // 创建分类
        await api.createCategory(apiData);
        globalMessage.success('专区创建成功');
      }
      
      navigate(fromPath);
    } catch (error: any) {
      console.error('表单提交失败:', error);
      if (error.response?.data?.message) {
        globalMessage.error(error.response.data.message);
      } else {
        globalMessage.error(isEditMode ? '更新专区失败' : '创建专区失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 生成专区编码
  const generateZoneCode = () => {
    // 过滤出顶级分类（parent_id为null或undefined）
    const topLevelCategories = categories.filter(cat => !cat.parent_id);
    const maxCode = topLevelCategories.reduce((max, cat) => {
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
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                size="small"
                onClick={() => navigate(fromPath)}
              >
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                {isEditMode ? '编辑专区' : '新增专区'}
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