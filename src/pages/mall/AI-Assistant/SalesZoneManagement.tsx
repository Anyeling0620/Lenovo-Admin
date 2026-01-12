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
  DatePicker,
  InputNumber,
  Upload
} from "antd";
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
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

// 售货专区响应类型定义（模拟数据）
interface SalesZoneResponse {
  sales_zone_id: string;
  zone_name: string;
  description: string;
  status: 'active' | 'inactive';
  is_featured: boolean;
  sort_order: number;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

// 售货专区创建请求类型
interface SalesZoneCreateRequest {
  zone_name: string;
  description: string;
  status: 'active' | 'inactive';
  is_featured: boolean;
  sort_order: number;
  start_time?: string;
  end_time?: string;
}

// 售货专区更新请求类型
interface SalesZoneUpdateRequest {
  zone_name?: string;
  description?: string;
  status?: 'active' | 'inactive';
  is_featured?: boolean;
  sort_order?: number;
  start_time?: string;
  end_time?: string;
}

// 模拟API函数
const getSalesZones = async (): Promise<SalesZoneResponse[]> => {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return []; // 返回空数组，实际使用时可以添加模拟数据
};

const createSalesZone = async (data: SalesZoneCreateRequest): Promise<{ sales_zone_id: string }> => {
  console.log('创建售货专区:', data);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { sales_zone_id: Date.now().toString() };
};

const updateSalesZone = async (salesZoneId: string, data: SalesZoneUpdateRequest): Promise<null> => {
  console.log('更新售货专区:', salesZoneId, data);
  await new Promise(resolve => setTimeout(resolve, 500));
  return null;
};

const deleteSalesZone = async (salesZoneId: string): Promise<null> => {
  console.log('删除售货专区:', salesZoneId);
  await new Promise(resolve => setTimeout(resolve, 500));
  return null;
};

const { Title } = Typography;
const { Option } = Select;

// Zod 表单验证
const salesZoneSchema = z.object({
  zone_name: z.string().min(1, '专区名称不能为空'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  is_featured: z.boolean().default(false),
  sort_order: z.number().min(0, '排序值不能小于0').default(0),
  start_time: z.string().optional(),
  end_time: z.string().optional()
});





const SalesZoneManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingZone, setEditingZone] = useState<SalesZoneResponse | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    keyword: ''
  });
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 售货专区数据获取
  const { 
    data: salesZones = [], 
    loading: zonesLoading, 
    run: fetchSalesZones 
  } = useRequest(
    () => getSalesZones(),
    {
      onError: (error) => {
        globalErrorHandler.handle(error, globalMessage.error);
      }
    }
  );

  const handleAdd = () => {
    setEditingZone(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (zone: SalesZoneResponse) => {
    setEditingZone(zone);
    form.setFieldsValue({
      zone_name: zone.zone_name,
      description: zone.description,
      status: zone.status,
      is_featured: zone.is_featured,
      sort_order: zone.sort_order,
      start_time: zone.start_time ? dayjs(zone.start_time) : null,
      end_time: zone.end_time ? dayjs(zone.end_time) : null
    });
    setIsModalVisible(true);
  };

  const onFinish = async (values: any) => {
    try {
      const validatedData = salesZoneSchema.parse({
        ...values,
        start_time: values.start_time ? values.start_time.format('YYYY-MM-DD') : undefined,
        end_time: values.end_time ? values.end_time.format('YYYY-MM-DD') : undefined
      });

      if (editingZone) {
        // 更新售货专区
        await updateSalesZone(editingZone.sales_zone_id, {
          zone_name: validatedData.zone_name,
          description: validatedData.description || '',
          status: validatedData.status,
          is_featured: validatedData.is_featured,
          sort_order: validatedData.sort_order,
          start_time: validatedData.start_time,
          end_time: validatedData.end_time
        });
        globalMessage.success('售货专区更新成功');
      } else {
        // 创建售货专区
        await createSalesZone({
          zone_name: validatedData.zone_name,
          description: validatedData.description || '',
          status: validatedData.status,
          is_featured: validatedData.is_featured,
          sort_order: validatedData.sort_order,
          start_time: validatedData.start_time,
          end_time: validatedData.end_time
        });
        globalMessage.success('售货专区创建成功');
      }
      setIsModalVisible(false);
      fetchSalesZones();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleDelete = async (salesZoneId: string) => {
    try {
      // 删除售货专区
      await deleteSalesZone(salesZoneId);
      globalMessage.success('售货专区删除成功');
      fetchSalesZones();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 下载模板文件
  const handleDownloadTemplate = () => {
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
      fetchSalesZones(); // 刷新数据
      
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

  const getFeaturedTag = (isFeatured: boolean) => {
    return (
      <Tag color={isFeatured ? 'gold' : 'default'}>
        {isFeatured ? '推荐' : '普通'}
      </Tag>
    );
  };

  const columns = [
    {
      title: '专区图片',
      dataIndex: 'zone_image',
      key: 'zone_image',
      width: 80,
      render: (image: string) => (
        <Image 
          width={60} 
          height={60} 
          src={getImageUrl(image)} 
          alt="专区图片"
          style={{ objectFit: 'cover' }}
        />
      )
    },
    {
      title: '专区名称',
      dataIndex: 'zone_name',
      key: 'zone_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
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
      title: '推荐',
      dataIndex: 'is_featured',
      key: 'is_featured',
      width: 80,
      render: (isFeatured: boolean) => getFeaturedTag(isFeatured)
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: (a: SalesZoneResponse, b: SalesZoneResponse) => a.sort_order - b.sort_order
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 120,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD') : '-'
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 120,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: SalesZoneResponse) => (
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
            title="确定要删除这个售货专区吗？"
            onConfirm={() => handleDelete(record.sales_zone_id)}
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
            <Title level={4} style={{ margin: 0 }}>售货专区管理</Title>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAdd}
              >
                创建专区
              </Button>
              <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
                导入专区
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
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Input
              placeholder="搜索专区名称"
              prefix={<SearchOutlined />}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </Col>
        </Row>

        {/* 售货专区列表 */}
        <Table
          columns={columns}
          dataSource={salesZones}
          rowKey="sales_zone_id"
          loading={zonesLoading}
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
        title={editingZone ? '编辑售货专区' : '创建售货专区'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="专区名称"
            name="zone_name"
            rules={[{ required: true, message: '请输入专区名称' }]}
          >
            <Input placeholder="请输入专区名称" />
          </Form.Item>

          <Form.Item
            label="专区描述"
            name="description"
          >
            <Input.TextArea 
              placeholder="请输入专区描述"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item
                label="推荐专区"
                name="is_featured"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="排序值"
                name="sort_order"
                rules={[{ required: true, message: '请输入排序值' }]}
              >
                <InputNumber 
                  min={0} 
                  placeholder="排序值" 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="有效时间"
          >
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="start_time">
                  <DatePicker 
                    placeholder="开始时间" 
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="end_time">
                  <DatePicker 
                    placeholder="结束时间" 
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingZone ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入专区模态框 */}
      <Modal
        title="导入售货专区"
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
              <li>状态字段只能填写：active（启用）或 inactive（禁用）</li>
              <li>推荐专区字段请填写：是/否 或 true/false</li>
              <li>排序值必须为数字，不能小于0</li>
              <li>时间格式必须为：YYYY-MM-DD</li>
              <li>每次导入最多支持1000条数据</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalesZoneManagement;