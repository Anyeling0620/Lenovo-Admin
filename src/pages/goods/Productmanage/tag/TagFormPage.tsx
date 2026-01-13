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
  InputNumber,
  Alert,
  Spin,
  message
} from 'antd';
import { 
  ArrowLeftOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import * as api from '../../../../services/api';
import type { TagResponse, TagStatus, TagCreateRequest, TagUpdateRequest } from '../../../../services/api-type';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TagFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tagData, setTagData] = useState<TagResponse | null>(null);

  // 获取来源页面（优先从state，否则使用默认路径）
  const fromPath = location.state?.from || '/goods/tag';
  
  // 加载标签数据（编辑模式）
  const fetchTagData = async (tagId: string) => {
    setLoading(true);
    try {
      // 从API获取所有标签，然后查找指定的标签
      const tags = await api.getTags();
      const tag = tags.find((t: TagResponse) => t.tag_id === tagId);
      
      if (tag) {
        setTagData(tag);
        form.setFieldsValue({
          name: tag.name,
          priority: tag.priority,
          status: tag.status,
          remark: tag.remark || '',
        });
      } else {
        message.error('未找到标签信息');
        navigate(fromPath);
      }
    } catch (error) {
      console.error('获取标签数据失败:', error);
      message.error('获取标签数据失败');
      navigate(fromPath);
    } finally {
      setLoading(false);
    }
  };

  // 根据路由参数判断模式
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchTagData(id);
    } else {
      // 新增模式，设置默认值
      form.setFieldsValue({
        priority: 5,
        status: '启用' as TagStatus
      });
    }
  }, [id]);

  // 表单提交
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      if (isEditMode && id) {
        // 更新标签
        const updateData: TagUpdateRequest = {
          name: values.name,
          priority: values.priority,
          status: values.status as TagStatus,
          remark: values.remark || null
        };
        
        await api.updateTag(id, updateData);
        message.success('标签更新成功');
      } else {
        // 创建标签
        const createData: TagCreateRequest = {
          name: values.name,
          priority: values.priority,
          status: values.status as TagStatus,
          remark: values.remark || null
        };
        
        await api.createTag(createData);
        message.success('标签创建成功');
      }
      
      navigate(fromPath);
    } catch (error: any) {
      console.error('表单提交失败:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error(isEditMode ? '更新标签失败' : '创建标签失败');
      }
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
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                size="small"
                onClick={() => navigate(fromPath)}
              >
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                {isEditMode ? '编辑标签' : '新增标签'}
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
                {isEditMode ? '更新标签' : '创建标签'}
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
        {isEditMode && tagData && (
          <Alert
            message={
              <Space>
                <Text>正在编辑标签：</Text>
                <Text strong>{tagData.name}</Text>
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
                label="标签名称"
                name="name"
                rules={[
                  { required: true, message: '请输入标签名称' },
                  { max: 20, message: '名称不能超过20个字符' }
                ]}
              >
                <Input placeholder="例如：热销爆款、新品上市" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="优先级"
                name="priority"
                rules={[
                  { required: true, message: '请输入优先级' },
                  { type: 'number', min: 1, max: 100, message: '优先级必须在1-100之间' }
                ]}
                extra="数字越小，排序越靠前"
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
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
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="备注"
            name="remark"
            extra="可选的标签说明信息"
          >
            <TextArea 
              rows={3} 
              placeholder="标签说明或使用场景" 
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TagFormPage;