import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Upload
} from "antd";
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  UploadOutlined,
  DownloadOutlined,
  InboxOutlined
} from "@ant-design/icons";
import { useRequest } from 'ahooks';
import { z } from 'zod';
import { 
  getShelfProducts, 
  getCategories, 
  createShelfProduct, 
  updateShelfFlags, 
  updateShelfStatus,
  deleteShelfItem
} from "../../../services/api";
import globalErrorHandler from "../../../utils/globalAxiosErrorHandler";
import { globalMessage } from "../../../utils/globalMessage";
import { getImageUrl } from "../../../utils/imageUrl";
import type { 
  ShelfProductResponse, 
  CategoryResponse, 
  ShelfProductStatus 
} from "../../../services/api-type";

const { Title } = Typography;
const { Option } = Select;

// Zod 表单验证
const shelfProductSchema = z.object({
  product_id: z.string().min(1, '请选择商品'),
  category_id: z.string().min(1, '请选择分类'),
  is_self_operated: z.boolean().default(false),
  is_customizable: z.boolean().default(false),
  installment: z.boolean().default(false),
  status: z.enum(['下架', '在售', '售罄']).default('在售')
});



const ShelfProductManagement = () => {
  const navigate = useNavigate();
  
  // 会话验证 - 只在会话确实不存在时才跳转
  useEffect(() => {
    const checkSession = () => {
      const sessionId = localStorage.getItem('admin_sessionId');
      if (!sessionId) {
        console.log('未找到管理员会话，跳转到登录页面');
        globalMessage.error('未找到管理员会话，请重新登录');
        navigate('/login', { replace: true });
        return false;
      }
      console.log('找到有效会话:', sessionId.substring(0, 10) + '...');
      return true;
    };
    
    // 延迟检查，避免在页面加载时立即跳转
    const timer = setTimeout(() => {
      checkSession();
    }, 100);
    
    // 监听会话过期事件
    const handleSessionExpired = () => {
      globalMessage.error('会话已过期，请重新登录');
      navigate('/login', { replace: true });
    };
    
    window.addEventListener('SESSION_EXPIRED', handleSessionExpired);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('SESSION_EXPIRED', handleSessionExpired);
    };
  }, [navigate]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShelfProductResponse | null>(null);
  const [filters, setFilters] = useState({
    category_id: '',
    status: '',
    keyword: ''
  });
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { 
    data: shelfProducts = [], 
    loading: productsLoading, 
    run: fetchShelfProducts 
  } = useRequest(
    () => getShelfProducts(filters),
    {
      refreshDeps: [filters],
      onError: (error) => globalErrorHandler.handle(error, globalMessage.error)
    }
  );

  const { 
    data: categories = [], 
    loading: categoriesLoading 
  } = useRequest(
    () => getCategories(),
    {
      onError: (error) => globalErrorHandler.handle(error, globalMessage.error)
    }
  );

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (product: ShelfProductResponse) => {
    setEditingProduct(product);
    form.setFieldsValue({
      product_id: product.product_id,
      category_id: product.category_id,
      is_self_operated: product.is_self_operated,
      is_customizable: product.is_customizable,
      installment: product.installment > 0,
      status: product.status
    });
    setIsModalVisible(true);
  };

  const onFinish = async (values: any) => {
    try {
      const data = shelfProductSchema.parse(values);
      if (editingProduct) {
        await updateShelfFlags(editingProduct.shelf_product_id, {
          is_self_operated: data.is_self_operated,
          is_customizable: data.is_customizable,
          installment: data.installment ? 1 : 0,
        });
        await updateShelfStatus(editingProduct.shelf_product_id, { status: data.status });
        globalMessage.success('商品更新成功');
      } else {
        const createResponse = await createShelfProduct({
          product_id: data.product_id,
          category_id: data.category_id
        });
        
        await updateShelfFlags(createResponse.shelf_product_id, {
          is_self_operated: data.is_self_operated,
          is_customizable: data.is_customizable,
          installment: data.installment ? 1 : 0,
        });
        await updateShelfStatus(createResponse.shelf_product_id, { status: data.status });
        
        globalMessage.success('商品上架成功');
      }
      setIsModalVisible(false);
      fetchShelfProducts();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleDelete = async (shelfProductId: string) => {
    try {
      await deleteShelfItem(shelfProductId);
      globalMessage.success('商品删除成功');
      fetchShelfProducts();
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
      fetchShelfProducts(); // 刷新数据
      
    } catch (error) {
      globalMessage.error('文件导入失败，请检查文件格式或联系管理员');
      onError(error);
    }
  };

  const getStatusTag = (status: ShelfProductStatus) => {
    const statusMap = {
      '下架': { color: 'red', text: '已下架' },
      '在售': { color: 'green', text: '上架中' },
      '售罄': { color: 'orange', text: '已售罄' },
    };
    const statusInfo = statusMap[status];
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const columns = [
    {
      title: '商品图片',
      dataIndex: 'product_image',
      key: 'product_image',
      width: 80,
      render: (image: string) => (
        <Image 
          width={60} 
          height={60} 
          src={getImageUrl(image)} 
          alt="商品图片"
          style={{ objectFit: 'cover' }}
        />
      )
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
      ellipsis: true
    },
    {
      title: '商品ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 120
    },
    {
      title: '分类',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string) => (
        <Tag color="blue">{name}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ShelfProductStatus) => getStatusTag(status)
    },
    {
      title: '自营',
      dataIndex: 'is_self_operated',
      key: 'is_self_operated',
      width: 80,
      render: (isSelfOperated: boolean) => (
        <Tag color={isSelfOperated ? 'blue' : 'default'}>
          {isSelfOperated ? '是' : '否'}
        </Tag>
      )
    },
    {
      title: '可定制',
      dataIndex: 'is_customizable',
      key: 'is_customizable',
      width: 80,
      render: (isCustomizable: boolean) => (
        <Tag color={isCustomizable ? 'green' : 'default'}>
          {isCustomizable ? '是' : '否'}
        </Tag>
      )
    },
    {
      title: '分期',
      dataIndex: 'installment',
      key: 'installment',
      width: 80,
      render: (installment: boolean) => (
        <Tag color={installment ? 'purple' : 'default'}>
          {installment ? '支持' : '不支持'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ShelfProductResponse) => (
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
            title="确定要删除这个商品吗？"
            onConfirm={() => handleDelete(record.shelf_product_id)}
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
            <Title level={4} style={{ margin: 0 }}>上架商品管理</Title>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAdd}
              >
                上架商品
              </Button>
              <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
                导入商品
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 筛选条件 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              placeholder="选择分类"
              style={{ width: '100%' }}
              allowClear
              loading={categoriesLoading}
              onChange={(value) => setFilters({...filters, category_id: value})}
            >
              {categories.map((category: CategoryResponse) => (
                <Option key={category.category_id} value={category.category_id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择状态"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setFilters({...filters, status: value})}
            >
              <Option value="在售">上架中</Option>
              <Option value="下架">已下架</Option>
              <Option value="售罄">已售罄</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Input
              placeholder="搜索商品名称或ID"
              prefix={<SearchOutlined />}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </Col>
        </Row>

        {/* 商品列表 */}
        <Table
          columns={columns}
          dataSource={shelfProducts}
          rowKey="shelf_product_id"
          loading={productsLoading}
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
        title={editingProduct ? '编辑商品' : '上架商品'}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="商品ID"
                name="product_id"
                rules={[{ required: true, message: '请选择商品' }]}
              >
                <Input
                  placeholder="请输入商品ID"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="商品分类"
                name="category_id"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select
                  placeholder="请选择分类"
                  loading={categoriesLoading}
                >
                  {categories.map((category: CategoryResponse) => (
                    <Option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="自营商品"
                name="is_self_operated"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="可定制"
                name="is_customizable"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="支持分期"
                name="installment"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="商品状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="请选择状态"
            >
              <Option value="在售">上架中</Option>
              <Option value="下架">已下架</Option>
              <Option value="售罄">已售罄</Option>
            </Select>
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? '更新' : '上架'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入商品模态框 */}
      <Modal
        title="导入商品"
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
              <li>商品ID和分类ID必须为有效值</li>
              <li>状态字段只能填写：在售、下架、售罄</li>
              <li>自营、可定制、分期字段请填写：是/否 或 true/false</li>
              <li>每次导入最多支持1000条数据</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShelfProductManagement;