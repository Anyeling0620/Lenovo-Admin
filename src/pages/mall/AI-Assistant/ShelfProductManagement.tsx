import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  Divider,
  Typography,
  Tag,
  Image,
  Popconfirm,
  Tooltip,
  Upload,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  InboxOutlined,
  SettingOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { 
  ShelfProductResponse, 
  CategoryResponse, 
  ProductListItem, 
  ShelfProductStatus,
  ProductConfigResponse,
  ShelfProductItemResponse,
  ProductStatus,
  ShelfProductCreateRequest,
  ShelfFlagsRequest,
  ShelfStatusRequest
} from '../../../services/api-type';
import { 
  getShelfProducts, 
  createShelfProduct, 
  updateShelfFlags, 
  updateShelfStatus, 
  deleteShelfItem, 
  getCategories, 
  getProducts,
  getProductConfigs,
  addShelfItem,
  updateShelfItemQuantity
} from '../../../services/api';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { getImageUrl } from '../../../utils/imageUrl';
import { z } from 'zod';

const { Title, Text } = Typography;
const { Option } = Select;

// Zod 表单验证
const shelfProductSchema = z.object({
  product_id: z.string().min(1, '请选择商品'),
  category_id: z.string().min(1, '请选择分类'),
  is_self_operated: z.boolean().default(false),
  is_customizable: z.boolean().default(false),
  installment: z.number().default(0),
  status: z.enum(['下架', '在售', '售罄']).default('在售')
});

const ShelfProductManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShelfProductResponse | null>(null);
  const [filters, setFilters] = useState({
    category_id: '',
    status: '',
    keyword: ''
  });
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // 商品选择器相关状态
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productFetchLoading, setProductFetchLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productList, setProductList] = useState<ProductListItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);

  // 规格管理相关状态
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [currentShelfProduct, setCurrentShelfProduct] = useState<ShelfProductResponse | null>(null);
  const [productConfigs, setProductConfigs] = useState<ProductConfigResponse[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [itemForm] = Form.useForm();

  // 获取上架商品列表
  const { 
    data: shelfProducts = [], 
    loading: productsLoading, 
    run: fetchShelfProducts 
  } = useRequest(
    () => {
      const params: { category_id?: string; status?: string; keyword?: string } = {};
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.status) params.status = filters.status;
      if (filters.keyword) params.keyword = filters.keyword;
      return getShelfProducts(params);
    },
    {
      refreshDeps: [filters],
      onError: (error) => globalErrorHandler.handle(error, globalMessage.error)
    }
  );

  // 获取分类列表
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
    setSelectedProduct(null);
    form.resetFields();
    form.setFieldsValue({
      status: '在售',
      is_self_operated: false,
      is_customizable: false,
      installment: 0
    });
    setIsModalVisible(true);
  };

  const handleEdit = (product: ShelfProductResponse) => {
    setEditingProduct(product);
    
    // 在编辑模式下，设置已选择的商品信息
    const selectedProductItem: ProductListItem = {
      product_id: product.product_id,
      name: product.product_name,
      brand_name: product.brand_name || '',
      brand_id: '',
      category_id: product.category_id,
      category_name: product.category_name,
      status: '正常' as ProductStatus,
      main_image: product.main_image || null,
      created_at: '',
      sub_title: '',
      updated_at: (): unknown => undefined
    };
    
    setSelectedProduct(selectedProductItem);
    form.setFieldsValue({
      product_id: product.product_id,
      product_name: product.product_name,
      category_id: product.category_id,
      is_self_operated: product.is_self_operated,
      is_customizable: product.is_customizable,
      installment: product.installment,
      status: product.status
    });
    setIsModalVisible(true);
  };

  // 商品选择器相关函数
  const fetchProducts = async () => {
    setProductFetchLoading(true);
    try {
      const res = await getProducts();
      setProductList(res);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      setProductList([]);
    } finally {
      setProductFetchLoading(false);
    }
  };

  const openProductPicker = () => {
    setProductModalOpen(true);
    if (!productList.length) {
      fetchProducts();
    }
  };

  const confirmProduct = () => {
    if (!selectedProduct) return;
    form.setFieldsValue({
      product_id: selectedProduct.product_id,
      product_name: selectedProduct.name,
    });
    setProductModalOpen(false);
  };

  const filteredProducts = productList.filter(product => 
    product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.product_id?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const onFinish = async (values: any) => {
    try {
      const data = shelfProductSchema.parse(values);
      
      if (editingProduct) {
        // 编辑模式：更新标记和状态
        const flagsData: ShelfFlagsRequest = {
          is_self_operated: data.is_self_operated,
          is_customizable: data.is_customizable,
          installment: data.installment
        };
        
        await updateShelfFlags(editingProduct.shelf_product_id, flagsData);
        
        if (data.status !== editingProduct.status) {
          const statusData: ShelfStatusRequest = { status: data.status };
          await updateShelfStatus(editingProduct.shelf_product_id, statusData);
        }
        
        globalMessage.success('商品更新成功');
      } else {
        // 创建模式：创建货架商品并设置标记和状态
        const createData: ShelfProductCreateRequest = {
          product_id: data.product_id,
          category_id: data.category_id
        };
        
        const createResponse = await createShelfProduct(createData);
        
        const flagsData: ShelfFlagsRequest = {
          is_self_operated: data.is_self_operated,
          is_customizable: data.is_customizable,
          installment: data.installment
        };
        
        await updateShelfFlags(createResponse.shelf_product_id, flagsData);
        
        const statusData: ShelfStatusRequest = { status: data.status };
        await updateShelfStatus(createResponse.shelf_product_id, statusData);
        
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
      // 下架商品
      await updateShelfStatus(shelfProductId, { status: '下架' });
      globalMessage.success('商品已下架');
      fetchShelfProducts();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 规格管理相关逻辑
  const handleManageItems = async (product: ShelfProductResponse) => {
    setCurrentShelfProduct(product);
    setItemModalVisible(true);
    setConfigLoading(true);
    try {
      const res = await getProductConfigs(product.product_id);
      setProductConfigs(res);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleAddItem = async (values: any) => {
    if (!currentShelfProduct) return;
    try {
      await addShelfItem({
        shelf_product_id: currentShelfProduct.shelf_product_id,
        config_id: values.config_id,
        shelf_num: values.shelf_num
      });
      globalMessage.success('规格添加成功');
      itemForm.resetFields();
      fetchShelfProducts();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleUpdateItemQuantity = async (itemId: string, num: number) => {
    try {
      await updateShelfItemQuantity(itemId, { shelf_num: num });
      globalMessage.success('数量更新成功');
      fetchShelfProducts();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteShelfItem(itemId);
      globalMessage.success('规格删除成功');
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
      globalMessage.loading('正在处理文件...');
      
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      globalMessage.success('文件导入成功！');
      onSuccess('文件导入成功', file);
      setImportModalVisible(false);
      fetchShelfProducts();
      
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
      key: 'product_image',
      width: 80,
      render: (_: any, record: ShelfProductResponse) => {
        // 优先使用轮播图，如果没有则使用商品主图
        const imageUrl = record.carousel_image || 
                        (record as any).main_image || 
                        (record as any).product_image;
        return (
          <Image 
            width={60} 
            height={60} 
            src={imageUrl ? getImageUrl(imageUrl) : '/placeholder-image.png'} 
            alt={record.product_name}
            style={{ 
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #f0f0f0'
            }}
            fallback={
              <div style={{
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                border: '1px solid #d9d9d9'
              }}>
                <PictureOutlined style={{ fontSize: '20px', color: '#bfbfbf' }} />
              </div>
            }
          />
        );
      }
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '商品ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 100
    },
    {
      title: '品牌',
      dataIndex: 'brand_name',
      key: 'brand_name',
      width: 100,
      render: (brand: string) => (
        <Tag color="cyan">{brand || '未设置'}</Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 100,
      render: (name: string) => (
        <Tag color="blue">{name}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: ShelfProductStatus) => getStatusTag(status)
    },
    {
      title: '自营',
      dataIndex: 'is_self_operated',
      key: 'is_self_operated',
      width: 70,
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
      width: 70,
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
      render: (installment: number) => (
        <Tag color={installment > 0 ? 'purple' : 'default'}>
          {installment > 0 ? `支持(${installment}期)` : '不支持'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: ShelfProductResponse) => (
        <Space size="small">
          <Tooltip title="管理规格">
            <Button 
              type="link" 
              icon={<SettingOutlined />} 
              size="small"
              onClick={() => handleManageItems(record)}
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
            title="确定要下架这个商品吗？"
            onConfirm={() => handleDelete(record.shelf_product_id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="下架">
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

  // 处理搜索
  const handleSearch = (value: string) => {
    setFilters({...filters, keyword: value});
  };

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

        {/* 筛选条件 - 调整为文档一的样式 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              placeholder="全部分类"
              allowClear
              value={filters.category_id}
              onChange={(value) => setFilters({...filters, category_id: value || ''})}
              loading={categoriesLoading}
              style={{ width: '100%' }}
            >
              <Option value="">全部分类</Option>
              {categories.map(cat => (
                <Option key={cat.category_id} value={cat.category_id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择状态"
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({...filters, status: value || ''})}
              style={{ width: '100%' }}
            >
              <Option value="">全部状态</Option>
              <Option value="下架">下架</Option>
              <Option value="在售">上架中</Option>
              <Option value="售罄">售罄</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Input
              placeholder="搜索商品名称"
              prefix={<SearchOutlined />}
              allowClear
              onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
              onChange={(e) => {
                if (e.target.value === '') {
                  handleSearch('');
                }
              }}
              onBlur={(e) => handleSearch(e.target.value)}
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
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="选择商品" required style={{ minWidth: 260 }}>
                <Space>
                  {!editingProduct && (
                    <Button onClick={openProductPicker}>选择商品</Button>
                  )}
                  {(selectedProduct || editingProduct) && (
                    <Space>
                      {selectedProduct?.main_image && (
                        <Image 
                          width={40} 
                          height={40} 
                          src={getImageUrl(selectedProduct.main_image)} 
                          alt={selectedProduct.name}
                          style={{ objectFit: 'cover', borderRadius: '4px' }}
                        />
                      )}
                      <Typography.Text type="secondary">
                        {editingProduct?.product_name || selectedProduct?.name}（ID: {editingProduct?.product_id || selectedProduct?.product_id}）
                      </Typography.Text>
                    </Space>
                  )}
                </Space>
              </Form.Item>
              <Form.Item name="product_id" hidden rules={[{ required: true, message: '请选择商品' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="product_name" hidden>
                <Input />
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
                label="分期期数"
                name="installment"
              >
                <Select placeholder="选择分期">
                  <Option value={0}>不支持分期</Option>
                  <Option value={3}>3期</Option>
                  <Option value={6}>6期</Option>
                  <Option value={12}>12期</Option>
                  <Option value={24}>24期</Option>
                </Select>
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

      {/* 规格管理模态框 */}
      <Modal
        title={`管理规格 - ${currentShelfProduct?.product_name || ''}`}
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 添加规格表单 */}
          <Card size="small" title="添加上架规格">
            <Form
              form={itemForm}
              layout="inline"
              onFinish={handleAddItem}
            >
              <Form.Item 
                name="config_id" 
                rules={[{ required: true, message: '请选择配置' }]} 
                style={{ width: 300 }}
              >
                <Select
                  placeholder="选择商品配置"
                  loading={configLoading}
                  options={productConfigs.map(cfg => ({
                    label: `${cfg.config1} / ${cfg.config2}${cfg.config3 ? ' / ' + cfg.config3 : ''}（原价¥${cfg.original_price}）`,
                    value: cfg.product_config_id,
                  }))}
                />
              </Form.Item>
              <Form.Item 
                name="shelf_num" 
                rules={[{ required: true, message: '请输入上架数量' }]}
              >
                <InputNumber min={0} placeholder="上架数量" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                  添加
                </Button>
              </Form.Item>
            </Form>
          </Card>
          
          <Divider>已上架规格列表</Divider>
          
          {/* 已上架规格列表 */}
          <Table
            dataSource={currentShelfProduct?.items || []}
            rowKey="shelf_product_item_id"
            pagination={false}
            columns={[
              { 
                title: '配置', 
                key: 'config',
                render: (_, record: ShelfProductItemResponse) => (
                  <Space direction="vertical" size={0}>
                    <Text>{record.config1} / {record.config2}</Text>
                    {record.config3 && <Text type="secondary">{record.config3}</Text>}
                  </Space>
                )
              },
              {
                title: '上架数量',
                dataIndex: 'shelf_num',
                key: 'shelf_num',
                render: (num, record) => (
                  <InputNumber 
                    defaultValue={num} 
                    min={0}
                    onBlur={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      if (!isNaN(val) && val !== num) {
                        handleUpdateItemQuantity(record.shelf_product_item_id, val);
                      }
                    }}
                  />
                )
              },
              {
                title: '锁定数量',
                dataIndex: 'lock_num',
                key: 'lock_num',
              },
              {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                  <Popconfirm
                    title="确定要删除该规格吗？"
                    onConfirm={() => handleDeleteItem(record.shelf_product_item_id)}
                  >
                    <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                )
              }
            ]}
          />
        </Space>
      </Modal>

      {/* 商品选择模态框 */}
      <Modal
        open={productModalOpen}
        title="选择商品"
        onCancel={() => setProductModalOpen(false)}
        onOk={confirmProduct}
        okButtonProps={{ disabled: !selectedProduct, loading: productFetchLoading }}
        destroyOnClose
        width={900}
      >
        <Space style={{ marginBottom: 12 }}>
          <Input
            placeholder="输入关键词搜索（名称或ID）"
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Button onClick={fetchProducts} loading={productFetchLoading}>刷新列表</Button>
        </Space>
        <Table
          rowKey="product_id"
          dataSource={filteredProducts}
          loading={productFetchLoading}
          pagination={{ pageSize: 8 }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedProduct ? [selectedProduct.product_id] : [],
            onChange: (_, rows) => setSelectedProduct(rows[0]),
          }}
          columns={[
            { 
              title: '商品图片', 
              dataIndex: 'main_image', 
              width: 80,
              render: (image: string | null) => (
                <Image 
                  width={40} 
                  height={40} 
                  src={image ? getImageUrl(image) : '/placeholder-image.png'} 
                  alt="商品图片"
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              )
            },
            { title: '商品ID', dataIndex: 'product_id', width: 140 },
            { title: '名称', dataIndex: 'name' },
            { title: '品牌', dataIndex: 'brand_name', width: 140 },
            { title: '分类', dataIndex: 'category_name', width: 160 },
            { 
              title: '状态', 
              dataIndex: 'status', 
              width: 100,
              render: (status: ProductStatus) => {
                const statusMap = {
                  '下架': 'red',
                  '正常': 'green',
                  '删除': 'gray'
                };
                return <Tag color={statusMap[status]}>{status}</Tag>;
              }
            },
          ]}
        />
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
              <li>自营、可定制字段请填写：是/否 或 true/false</li>
              <li>分期字段请填写期数：0、3、6、12、24</li>
              <li>每次导入最多支持1000条数据</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShelfProductManagement;