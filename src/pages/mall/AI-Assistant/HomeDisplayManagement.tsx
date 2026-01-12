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
  message,
  Upload
} from "antd";
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UploadOutlined,
  DownloadOutlined,
  InboxOutlined
} from "@ant-design/icons";
import { useRequest } from 'ahooks';
import { z } from 'zod';
import globalErrorHandler from "../../../utils/globalAxiosErrorHandler";
import { globalMessage } from "../../../utils/globalMessage";
import { getImageUrl } from "../../../utils/imageUrl";
import { getHomePush, HomePushResponse } from "../../../services/api";

const { Title } = Typography;
const { Option } = Select;

// Zod 表单验证
const homeDisplaySchema = z.object({
  display_name: z.string().min(1, '展示名称不能为空'),
  display_type: z.enum(['banner', 'category', 'product', 'promotion']).default('banner'),
  display_content: z.string().min(1, '展示内容不能为空'),
  status: z.enum(['active', 'inactive']).default('active'),
  sort_order: z.number().min(0, '排序值不能小于0').default(0),
  target_url: z.string().optional(),
  is_external: z.boolean().default(false)
});

type HomeDisplayFormValues = z.infer<typeof homeDisplaySchema>;

const HomeDisplayManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState<HomeDisplayResponse | null>(null);
  const [filters, setFilters] = useState({
    display_type: '',
    status: '',
    keyword: ''
  });
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();



  const { 
    data: homeDisplays, 
    loading: displaysLoading, 
    run: fetchHomeDisplays 
  } = useRequest(
    () => getHomePush(),
    {
      refreshDeps: [filters],
      onError: (error) => globalErrorHandler.handle(error, globalMessage.error)
    }
  );

  const handleAdd = () => {
    setEditingDisplay(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (display: HomeDisplayResponse) => {
    setEditingDisplay(display);
    form.setFieldsValue({
      display_name: display.display_name,
      display_type: display.display_type,
      display_content: display.display_content,
      status: display.status,
      sort_order: display.sort_order,
      target_url: display.target_url,
      is_external: display.is_external
    });
    setIsModalVisible(true);
  };

  const onFinish = async (values: HomeDisplayFormValues) => {
    try {
      // 模拟API调用，实际项目中应该调用真实的API
      if (editingDisplay) {
        globalMessage.success('首页展示更新成功');
      } else {
        globalMessage.success('首页展示创建成功');
      }
      setIsModalVisible(false);
      fetchHomeDisplays();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleDelete = async (displayId: string) => {
    try {
      // 模拟删除操作
      globalMessage.success('首页展示删除成功');
      fetchHomeDisplays();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleMoveUp = async (displayId: string, currentOrder: number) => {
    try {
      // 模拟排序操作
      globalMessage.success('排序更新成功');
      fetchHomeDisplays();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleMoveDown = async (displayId: string, currentOrder: number) => {
    try {
      // 模拟排序操作
      globalMessage.success('排序更新成功');
      fetchHomeDisplays();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 下载模板文件
  const handleDownloadTemplate = () => {
    // 创建模板数据
    const templateData = [
      {
        '展示名称': '示例: 首页轮播图1',
        '展示类型': 'banner/category/product/promotion', 
        '展示内容': '示例: 轮播图内容1',
        '状态': 'active/inactive',
        '排序值': '示例: 1',
        '外部链接': '是/否',
        '目标链接': '示例: /products/1'
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
      fetchHomeDisplays(); // 刷新数据
      
    } catch (error) {
      globalMessage.error('文件导入失败，请检查文件格式或联系管理员');
      onError(error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: 'green', text: '启用' },
      inactive: { color: 'red', text: '禁用' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return <Tag color={statusInfo?.color}>{statusInfo?.text}</Tag>;
  };

  const getDisplayTypeTag = (type: string) => {
    const typeMap = {
      banner: { color: 'blue', text: '轮播图' },
      category: { color: 'green', text: '分类' },
      product: { color: 'orange', text: '商品' },
      promotion: { color: 'red', text: '促销' }
    };
    const typeInfo = typeMap[type as keyof typeof typeMap];
    return <Tag color={typeInfo?.color}>{typeInfo?.text}</Tag>;
  };

  const columns = [
    {
      title: '展示图片',
      dataIndex: 'display_image',
      key: 'display_image',
      width: 80,
      render: (image: string) => (
        <Image 
          width={60} 
          height={60} 
          src={getImageUrl(image)} 
          alt="展示图片"
          style={{ objectFit: 'cover' }}
        />
      )
    },
    {
      title: '展示名称',
      dataIndex: 'display_name',
      key: 'display_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '展示类型',
      dataIndex: 'display_type',
      key: 'display_type',
      width: 100,
      render: (type: string) => getDisplayTypeTag(type)
    },
    {
      title: '展示内容',
      dataIndex: 'display_content',
      key: 'display_content',
      width: 200,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: (a: HomeDisplayResponse, b: HomeDisplayResponse) => a.sort_order - b.sort_order
    },
    {
      title: '外部链接',
      dataIndex: 'is_external',
      key: 'is_external',
      width: 100,
      render: (isExternal: boolean) => (
        <Tag color={isExternal ? 'purple' : 'default'}>
          {isExternal ? '是' : '否'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: HomeDisplayResponse) => (
        <Space size="small">
          <Tooltip title="上移">
            <Button 
              type="link" 
              icon={<ArrowUpOutlined />} 
              size="small"
              onClick={() => handleMoveUp(record.display_id, record.sort_order)}
              disabled={record.sort_order <= 1}
            />
          </Tooltip>
          <Tooltip title="下移">
            <Button 
              type="link" 
              icon={<ArrowDownOutlined />} 
              size="small"
              onClick={() => handleMoveDown(record.display_id, record.sort_order)}
            />
          </Tooltip>
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
            title="确定要删除这个首页展示吗？"
            onConfirm={() => handleDelete(record.display_id)}
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
            <Title level={4} style={{ margin: 0 }}>首页展示管理</Title>
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
              placeholder="选择展示类型"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setFilters({...filters, display_type: value})}
            >
              <Option value="banner">轮播图</Option>
              <Option value="category">分类</Option>
              <Option value="product">商品</Option>
              <Option value="promotion">促销</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择状态"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setFilters({...filters, status: value})}
            >
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Input
              placeholder="搜索展示名称"
              prefix={<SearchOutlined />}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </Col>
        </Row>

        {/* 首页展示列表 */}
        <Table
          columns={columns}
          dataSource={homeDisplays}
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
        title={editingDisplay ? '编辑首页展示' : '添加首页展示'}
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
            label="展示名称"
            name="display_name"
            rules={[
              { required: true, message: '展示名称不能为空' },
              { min: 1, message: '展示名称不能为空' }
            ]}
          >
            <Input placeholder="请输入展示名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="展示类型"
                name="display_type"
                rules={[{ required: true, message: '请选择展示类型' }]}
              >
                <Select placeholder="请选择展示类型">
                  <Option value="banner">轮播图</Option>
                  <Option value="category">分类</Option>
                  <Option value="product">商品</Option>
                  <Option value="promotion">促销</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="active">启用</Option>
                  <Option value="inactive">禁用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="展示内容"
            name="display_content"
            rules={[
              { required: true, message: '展示内容不能为空' },
              { min: 1, message: '展示内容不能为空' }
            ]}
          >
            <Input.TextArea placeholder="请输入展示内容" rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="排序值"
                name="sort_order"
                rules={[
                  { required: true, message: '排序值不能为空' },
                  { type: 'number', min: 0, message: '排序值不能小于0' }
                ]}
              >
                <InputNumber
                  placeholder="请输入排序值"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="外部链接"
                name="is_external"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="目标链接"
            name="target_url"
          >
            <Input placeholder="请输入目标链接" />
          </Form.Item>

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

      {/* 导入展示模态框 */}
      <Modal
        title="导入首页展示"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 20 }}>
            <Typography.Text type="secondary">
              支持导入 Excel 文件，请下载模板文件并按格式填写数据
            </Typography.Text>
          </div>
          
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载模板文件
            </Button>
            
            <Upload.Dragger
              name="file"
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={handleBeforeUpload}
              customRequest={handleImportFile}
              style={{ padding: '20px' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">
                支持 .xlsx 和 .xls 格式文件，文件大小不超过 10MB
              </p>
            </Upload.Dragger>
          </Space>
          
          <Divider />
          
          <div style={{ textAlign: 'left' }}>
            <Title level={5}>导入说明：</Title>
            <ul style={{ paddingLeft: 20, color: '#666' }}>
              <li>请使用下载的模板文件进行数据填写</li>
              <li>展示类型只能填写：banner（轮播图）、category（分类）、product（商品）、promotion（促销）</li>
              <li>状态字段只能填写：active（启用）或 inactive（禁用）</li>
              <li>外部链接字段请填写：是/否 或 true/false</li>
              <li>排序值必须为数字，不能小于0</li>
              <li>每次导入最多支持1000条数据</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomeDisplayManagement;