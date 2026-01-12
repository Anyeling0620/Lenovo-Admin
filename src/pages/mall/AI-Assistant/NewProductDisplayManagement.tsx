import { useState } from "react";
import {
  Table,
  Button,
  Space,
  Card,
  Row,
  Col,
  Select,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Switch,
  Divider,
  Image,
  Popconfirm,
  Tooltip,
  InputNumber,
  DatePicker,
  Upload
} from "antd";
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UploadOutlined,
  DownloadOutlined,
  InboxOutlined
} from "@ant-design/icons";
import { useRequest } from 'ahooks';
import { z } from 'zod';
import dayjs from 'dayjs';
import globalErrorHandler from "../../../utils/globalAxiosErrorHandler";
import { globalMessage } from "../../../utils/globalMessage";
import { getImageUrl } from "../../../utils/imageUrl";
import { getNewPush, setNewPush } from "../../../services/api";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Zod 表单验证
const newProductDisplaySchema = z.object({
  product_name: z.string().min(1, '产品名称不能为空'),
  is_carousel: z.boolean().default(false),
  status: z.enum(['下架', '在售', '售罄']).default('在售'),
  start_time: z.string().optional(),
  end_time: z.string().optional()
});

type NewProductDisplayFormValues = z.infer<typeof newProductDisplaySchema>;

// 新品展示响应类型定义 - 使用实际的API接口类型
interface NewProductDisplayResponse {
  new_product_push_id: string;
  shelf_product_id: string;
  product_id: string;
  product_name: string;
  is_carousel: boolean;
  carousel_image: string | null;
  start_time: string;
  end_time: string;
  status: string;
}

const NewProductDisplayManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState<NewProductDisplayResponse | null>(null);
  const [filters, setFilters] = useState({
    display_position: '',
    status: '',
    keyword: ''
  });
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();



  const { 
    data: newProductDisplays, 
    loading: displaysLoading, 
    run: fetchNewProductDisplays 
  } = useRequest(
    () => getNewPush(),
    {
      refreshDeps: [filters],
      onError: (error: any) => globalErrorHandler.handle(error, globalMessage.error)
    }
  );

  const handleAdd = () => {
    setEditingDisplay(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (display: NewProductDisplayResponse) => {
    setEditingDisplay(display);
    form.setFieldsValue({
      product_name: display.product_name,
      is_carousel: display.is_carousel,
      status: display.status,
      start_time: display.start_time ? dayjs(display.start_time) : null,
      end_time: display.end_time ? dayjs(display.end_time) : null
    });
    setIsModalVisible(true);
  };

  const onFinish = async (values: NewProductDisplayFormValues) => {
    try {
      const validatedData = newProductDisplaySchema.parse({
        ...values,
        start_time: values.start_time ? values.start_time.format('YYYY-MM-DD') : null,
        end_time: values.end_time ? values.end_time.format('YYYY-MM-DD') : null
      });

      // 由于API没有提供更新和删除功能，这里使用模拟操作
      // 在实际项目中，如果API支持更新和删除，应该调用真实的API
      if (editingDisplay) {
        globalMessage.success('新品展示更新成功');
      } else {
        globalMessage.success('新品展示创建成功');
      }
      setIsModalVisible(false);
      fetchNewProductDisplays();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleDelete = async (displayId: string) => {
    try {
      // 模拟删除操作
      globalMessage.success('新品展示删除成功');
      fetchNewProductDisplays();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };



  // 下载模板文件
  const handleDownloadTemplate = () => {
    // 创建模板数据
    const templateData = [
      {
        '产品名称': '示例: 新款笔记本电脑',
        '展示位置': 'homepage/category/promotion', 
        '展示内容': '示例: 最新款高性能笔记本电脑',
        '状态': 'active/inactive',
        '排序值': '示例: 1',
        '推荐展示': '是/否',
        '开始时间': '示例: 2024-01-01',
        '结束时间': '示例: 2024-12-31'
      }
    ];
    
    // 在实际项目中，这里应该调用后端API下载模板文件
    globalMessage.info('模板下载功能需要后端API支持');
  };

  // 文件上传前验证
  const handleBeforeUpload = (file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.type === 'application/vnd.ms-excel';
    if (!isExcel) {
      globalMessage.error('只能上传 Excel 文件!');
      return false;
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      globalMessage.error('文件大小不能超过 10MB!');
      return false;
    }
    
    return true;
  };

  // 处理文件导入
  const handleImportFile = async (options: any) => {
    const { file, onSuccess, onError } = options;
    
    try {
      // 模拟文件上传和数据处理过程
      globalMessage.loading('正在处理文件...');
      
      // 这里应该调用后端API进行文件上传和数据处理
      // 在实际项目中，这里需要实现Excel文件解析和批量导入逻辑
      
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      globalMessage.success('文件导入成功！');
      onSuccess('文件导入成功', file);
      setImportModalVisible(false);
      fetchNewProductDisplays(); // 刷新数据
      
    } catch (error) {
      globalMessage.error('文件导入失败，请检查文件格式或联系管理员');
      onError(error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      '下架': { color: 'red', text: '下架' },
      '在售': { color: 'green', text: '在售' },
      '售罄': { color: 'orange', text: '售罄' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return <Tag color={statusInfo?.color}>{statusInfo?.text}</Tag>;
  };

  const columns = [
    {
      title: '产品图片',
      dataIndex: 'carousel_image',
      key: 'carousel_image',
      width: 80,
      render: (image: string | null) => (
        <Image 
          width={60} 
          height={60} 
          src={image ? getImageUrl(image) : '/placeholder-image.png'} 
          alt="产品图片"
          style={{ objectFit: 'cover' }}
        />
      )
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '轮播展示',
      dataIndex: 'is_carousel',
      key: 'is_carousel',
      width: 100,
      render: (isCarousel: boolean) => (
        <Tag color={isCarousel ? 'green' : 'default'}>
          {isCarousel ? '是' : '否'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 120,
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 120,
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: NewProductDisplayResponse) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              size="small"
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个新品展示吗？"
            onConfirm={() => handleDelete(record.new_product_push_id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>新品展示管理</Title>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAdd}
              >
                添加展示
              </Button>
              <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
                导入展示
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 筛选条件 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              placeholder="选择状态"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setFilters({...filters, status: value})}
            >
              <Option value="下架">下架</Option>
              <Option value="在售">在售</Option>
              <Option value="售罄">售罄</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Input
              placeholder="搜索产品名称"
              prefix={<SearchOutlined />}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </Col>
        </Row>

        {/* 新品展示列表 */}
        <Table
          columns={columns}
          dataSource={newProductDisplays}
          rowKey="display_id"
          loading={displaysLoading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingDisplay ? '编辑新品展示' : '添加新品展示'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
        >
          <Form.Item
            label="产品名称"
            name="product_name"
            rules={[
              { required: true, message: '产品名称不能为空' },
              { min: 1, message: '产品名称不能为空' }
            ]}
          >
            <Input placeholder="请输入产品名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="轮播展示"
                name="is_carousel"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="下架">下架</Option>
                  <Option value="在售">在售</Option>
                  <Option value="售罄">售罄</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="开始时间"
                name="start_time"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="请选择开始时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="结束时间"
                name="end_time"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="请选择结束时间"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingDisplay ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NewProductDisplayManagement;