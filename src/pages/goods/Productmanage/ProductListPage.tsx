/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, Card, Row, Col, Button, Input, Select, Space, Tag, 
  Statistic, Popconfirm, Tooltip, Image, Badge, 
  Typography, Divider,
  Modal
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  PlusOutlined, AppstoreOutlined, 
  CheckCircleOutlined, StopOutlined, EyeOutlined, TagsOutlined,
  PictureOutlined, SettingOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import type { 
  BrandResponse, CategoryResponse, ProductStatus, ProductListItem
} from '../../../services/api-type';
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';
import globalErrorHandler from '../../../utils/globalAxiosErrorHandler';
import { 
  getBrands, getCategories, getProducts, updateProductStatus,
  getProductStats as apiGetProductStats
} from '../../../services/api';

const { Text } = Typography;
const { Option } = Select;

// 修复：确保 ProductStats 接口与 API 返回类型一致
interface ProductStats {
  total: number;
  normal: number;
  off: number;
  brands?: number; // 改为可选
}

interface OptionItem { label: string; value: string; }

const ProductListPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [stats, setStats] = useState<ProductStats>({ total: 0, normal: 0, off: 0, brands: 0 });
  const [brands, setBrands] = useState<OptionItem[]>([]);
  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [currentFilters, setCurrentFilters] = useState<any>({}); // 存储当前过滤条件

  const { control: filterControl, handleSubmit: handleFilterSubmit, reset: resetFilter, getValues } = useForm({
    defaultValues: { keyword: '', status: '', brand_id: '', category_id: '' }
  });

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      const res = await apiGetProductStats();
      // 修复：处理 API 返回数据，确保有 brands 属性
      setStats({
        total: res.total || 0,
        normal: res.normal || 0,
        off: res.off || 0,
        brands: (res as any).brands || 0
      });
    } catch (error) {
      console.error("加载统计失败", error);
      globalErrorHandler.handle(error, globalMessage.error);
    }
  }, []);

  // 加载选项数据
  const loadOptions = useCallback(async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        getBrands(),
        getCategories(),
      ]);
      
      setBrands([
        { label: '全部品牌', value: '' },
        ...(brandsRes?.map((b: BrandResponse) => ({ label: b.name, value: b.brand_id })) || [])
      ]);
      
      setCategories([
        { label: '全部品类', value: '' },
        ...(categoriesRes?.map((c: CategoryResponse) => ({ label: c.name, value: c.category_id })) || [])
      ]);
    } catch (error) {
      console.error("加载选项失败", error);
      globalErrorHandler.handle(error, globalMessage.error);
    }
  }, []);

  // 加载商品数据
  const loadData = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      const response = await getProducts({ 
        category_id: filters.category_id,
        brand_id: filters.brand_id,
        status: filters.status
      });
      
      if (response && Array.isArray(response)) {
        let filteredData = response;
        
        // 应用关键词过滤
        if (filters.keyword) {
          const keyword = filters.keyword.toLowerCase();
          filteredData = filteredData.filter(p => 
            p.name.toLowerCase().includes(keyword) || 
            (p.product_id && p.product_id.toLowerCase().includes(keyword))
          );
        }
        
        setTotal(filteredData.length);
        
        // 前端分页
        const current = page;
        const size = pageSize;
        const start = (current - 1) * size;
        const items = filteredData.slice(start, start + size);
        
        setData(items || []);
      } else {
        setData([]);
        setTotal(0);
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  // 刷新所有数据
  const refreshAll = () => {
    const formValues = getValues();
    const filters: any = {};
    if (formValues.keyword) filters.keyword = formValues.keyword;
    if (formValues.status) filters.status = formValues.status;
    if (formValues.brand_id) filters.brand_id = formValues.brand_id;
    if (formValues.category_id) filters.category_id = formValues.category_id;
    
    setCurrentFilters(filters);
    setPage(1);
    loadData(filters);
    loadStats();
  };

  // 初始化加载
  useEffect(() => {
    loadOptions();
    loadStats();
    loadData({});
  }, [loadData, loadOptions, loadStats]);

  // 搜索处理
  const onSearch = (values: any) => { 
    const filters: any = {};
    if (values.keyword) filters.keyword = values.keyword;
    if (values.status) filters.status = values.status;
    if (values.brand_id) filters.brand_id = values.brand_id;
    if (values.category_id) filters.category_id = values.category_id;
    
    setCurrentFilters(filters);
    setPage(1);
    loadData(filters);
  };

  const onReset = () => { 
    resetFilter(); 
    setPage(1); 
    setCurrentFilters({});
    loadData({}); 
  };

  // 删除商品
  const handleDelete = async (id: string) => {
    try {
      globalMessage.loading('正在删除...');
      
      await updateProductStatus(id, '下架' as ProductStatus);
      globalMessage.success('商品已下架');
      
      loadData(currentFilters);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: `确定下架 ${selectedRowKeys.length} 条商品？`,
      content: '下架后商品将不再显示在前台',
      okText: '确认下架',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => 
            updateProductStatus(id as string, '下架' as ProductStatus)
          ));
          globalMessage.success('批量下架成功');
          
          setSelectedRowKeys([]);
          loadData(currentFilters);
        } catch (err) {
          globalErrorHandler.handle(err, globalMessage.error);
        }
      }
    });
  };

  // 导航到详情页，通过URL传递返回路径
  const navigateToDetail = (productId: string, returnPath: string) => {
    navigate(`/goods/detail/${productId}?return=${encodeURIComponent(returnPath)}`);
  };

  // 导航到编辑页
  const navigateToEdit = (productId: string, returnPath: string) => {
    navigate(`/goods/manage/edit/${productId}?return=${encodeURIComponent(returnPath)}`);
  };

  // 导航到SKU页
  const navigateToSku = (productId: string, returnPath: string) => {
    navigate(`/goods/manage/sku/${productId}?return=${encodeURIComponent(returnPath)}`);
  };

  // 导航到图库页
  const navigateToGallery = (productId: string, returnPath: string) => {
    navigate(`/goods/manage/gallery/${productId}?return=${encodeURIComponent(returnPath)}`);
  };

  // 表格列定义
  const columns: ColumnsType<ProductListItem> = [
    {
      title: 'ID',
      dataIndex: 'product_id',
      width: 120,
      fixed: 'left',
      ellipsis: true,
      render: (id) => (
        <Tooltip title={id}>
          <Text 
            copyable={{ text: id }} 
            style={{ fontSize: 11 }}
          >
            {id}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '主图',
      dataIndex: 'main_image',
      width: 80,
      render: (url) => (
        <Image 
          src={getImageUrl(url)} 
          width={40} 
          height={40} 
          style={{ borderRadius: 2 }} 
          fallback="https://via.placeholder.com/40?text=NoImg" 
          preview={{
            mask: '点击预览',
            src: getImageUrl(url)
          }}
        />
      )
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{text}</div>
          {record.sub_title && (
            <div 
              style={{ 
                fontSize: 11, 
                color: '#999' 
              }}
            >
              {record.sub_title}
            </div>
          )}
        </div>
      )
    },
    {
      title: '品牌',
      dataIndex: 'brand_id',
      width: 120,
      render: (brandId) => {
        const brand = brands.find(b => b.value === brandId);
        return <Tag color="blue">{brand?.label || brandId}</Tag>;
      }
    },
    {
      title: '品类',
      dataIndex: 'category_id',
      width: 120,
      render: (catId) => {
        const cat = categories.find(c => c.value === catId);
        return <Tag color="green">{cat?.label || catId}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status) => (
        <Badge 
          status={
            status === '正常' 
              ? 'success' 
              : (status === '下架' ? 'warning' : 'default')
          } 
          text={status} 
          style={{ fontSize: '11px' }} 
        />
      )
    },
    {
      title: '创建人',
      dataIndex: 'creator_id',
      width: 100,
      render: (id) => <span style={{ fontSize: 11 }}>{id}</span>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 140,
      sorter: (a, b) => {
        // 修复：确保传入dayjs的是有效的日期字符串
        const aTime = dayjs(a.created_at as string | number | Date | dayjs.Dayjs | null | undefined).unix();
        const bTime = dayjs(b.created_at as string | number | Date | dayjs.Dayjs | null | undefined).unix();
        return aTime - bTime;
      },
      render: (t) => {
        // 修复：确保传入dayjs的是有效的日期字符串
        const date = dayjs(t as string | number | Date | dayjs.Dayjs | null | undefined);
        return (
          <span 
            style={{ 
              fontSize: 11, 
              color: '#888' 
            }}
          >
            {date.isValid() ? date.format('YYYY-MM-DD HH:mm') : '无效日期'}
          </span>
        );
      }
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 140,
      sorter: (a, b) => {
        // 修复：确保传入dayjs的是有效的日期字符串
        const aTime = dayjs(a.updated_at as unknown as string | number | Date | dayjs.Dayjs | null | undefined).unix();
        const bTime = dayjs(b.updated_at as unknown as string | number | Date | dayjs.Dayjs | null | undefined).unix();
        return aTime - bTime;
      },
      render: (t) => {
        // 修复：确保传入dayjs的是有效的日期字符串
        const date = dayjs(t as string | number | Date | dayjs.Dayjs | null | undefined);
        return (
          <span 
            style={{ 
              fontSize: 11, 
              color: '#888' 
            }}
          >
            {date.isValid() ? date.format('YYYY-MM-DD HH:mm') : '无效日期'}
          </span>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        // 当前页面路径，用于返回时定位
        const currentPath = `${location.pathname}${location.search}`;
        
        return (
          <Space size={2}>
            <Tooltip title="查看详情">
              <Button 
                type="text" 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => navigateToDetail(record.product_id, currentPath)}
              />
            </Tooltip>
            
            <Tooltip title="编辑信息">
              <Button 
                type="text" 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => navigateToEdit(record.product_id, currentPath)}
              />
            </Tooltip>
            
            <Tooltip title="SKU规格">
              <Button 
                type="text" 
                size="small" 
                icon={<SettingOutlined />}
                onClick={() => navigateToSku(record.product_id, currentPath)}
              />
            </Tooltip>
            
            <Tooltip title="图库管理">
              <Button 
                type="text" 
                size="small" 
                icon={<PictureOutlined />}
                onClick={() => navigateToGallery(record.product_id, currentPath)}
              />
            </Tooltip>
            
            <Divider type="vertical" />
            
            <Popconfirm 
              title="确定下架此商品？" 
              description="下架后商品将不再显示在前台"
              onConfirm={() => handleDelete(record.product_id)} 
              okText="确认下架" 
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button 
                type="text" 
                size="small" 
                danger 
                icon={<DeleteOutlined />} 
              />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div 
      style={{ 
        padding: 8, 
        backgroundColor: '#f0f2f5', 
        minHeight: '100vh' 
      }}
    >
      <Row 
        gutter={[12, 12]} 
        style={{ marginBottom: 12 }}
      >
        <Col span={6}>
          <Card 
            size="small" 
            bordered={false} 
            bodyStyle={{ padding: 12 }}
          >
            <Statistic 
              title={<span style={{ fontSize: 11 }}>商品总量</span>} 
              value={stats.total} 
              prefix={<AppstoreOutlined />} 
              valueStyle={{ fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            size="small" 
            bordered={false} 
            bodyStyle={{ padding: 12 }}
          >
            <Statistic 
              title={<span style={{ fontSize: 11 }}>在售商品</span>} 
              value={stats.normal} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ 
                fontSize: 20, 
                color: '#52c41a' 
              }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            size="small" 
            bordered={false} 
            bodyStyle={{ padding: 12 }}
          >
            <Statistic 
              title={<span style={{ fontSize: 11 }}>已下架</span>} 
              value={stats.off} 
              prefix={<StopOutlined />} 
              valueStyle={{ 
                fontSize: 20, 
                color: '#faad14' 
              }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            size="small" 
            bordered={false} 
            bodyStyle={{ padding: 12 }}
          >
            <Statistic 
              title={<span style={{ fontSize: 11 }}>合作品牌</span>} 
              value={stats.brands || 0} 
              prefix={<TagsOutlined />} 
              valueStyle={{ fontSize: 20 }} 
            />
          </Card>
        </Col>
      </Row>

      <Card 
        size="small" 
        bordered={false} 
        style={{ marginBottom: 12 }}
      >
        <Row 
          justify="space-between" 
          align="middle" 
          gutter={[8, 8]}
        >
          <Col>
            <Space size="small">
              <Button 
                type="primary" 
                size="small" 
                icon={<PlusOutlined />}
                onClick={() => {
                  const currentPath = `${location.pathname}${location.search}`;
                  navigate(`/goods/manage/create?return=${encodeURIComponent(currentPath)}`);
                }}
              >
                录入商品
              </Button>
              <Button 
                danger 
                size="small" 
                icon={<DeleteOutlined />} 
                disabled={selectedRowKeys.length === 0} 
                onClick={handleBatchDelete}
              >
                批量下架
              </Button>
              <Button 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={refreshAll}
              >
                刷新
              </Button>
            </Space>
          </Col>
          <Col>
            <form onSubmit={handleFilterSubmit(onSearch)}>
              <Space size="small">
                <Controller 
                  name="keyword" 
                  control={filterControl}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      placeholder="名称/编码" 
                      size="small" 
                      style={{ width: 150 }} 
                      onPressEnter={handleFilterSubmit(onSearch)} 
                    />
                  )} 
                />
                <Controller 
                  name="brand_id" 
                  control={filterControl}
                  render={({ field }) => (
                    <Select 
                      {...field} 
                      placeholder="全部品牌" 
                      size="small" 
                      style={{ width: 100 }} 
                      allowClear 
                      showSearch 
                      optionFilterProp="label" 
                      options={brands} 
                    />
                  )} 
                />
                <Controller 
                  name="category_id" 
                  control={filterControl}
                  render={({ field }) => (
                    <Select 
                      {...field} 
                      placeholder="全部品类" 
                      size="small" 
                      style={{ width: 100 }} 
                      allowClear 
                      showSearch 
                      optionFilterProp="label" 
                      options={categories} 
                    />
                  )} 
                />
                <Controller 
                  name="status" 
                  control={filterControl}
                  defaultValue="" 
                  render={({ field }) => (
                    <Select 
                      {...field} 
                      placeholder="全部状态" 
                      size="small" 
                      style={{ width: 100 }} 
                      allowClear
                    >
                      <Option value="">全部状态</Option>
                      <Option value="正常">在售</Option>
                      <Option value="下架">下架</Option>
                    </Select>
                  )} 
                />
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<SearchOutlined />} 
                  htmlType="submit"
                >
                  查询
                </Button>
                <Button 
                  size="small" 
                  icon={<ReloadOutlined />} 
                  onClick={onReset}
                >
                  重置
                </Button>
              </Space>
            </form>
          </Col>
        </Row>
      </Card>

      <Card 
        size="small" 
        bordered={false} 
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="product_id"
          loading={loading}
          size="small"
          scroll={{ x: 1350 }}
          rowSelection={{ 
            selectedRowKeys, 
            onChange: (keys) => setSelectedRowKeys(keys) 
          }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              if (newPageSize) {
                setPageSize(newPageSize);
              }
            },
            showSizeChanger: true,
            showQuickJumper: true,
            size: 'small',
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>
    </div>
  );
};

export default ProductListPage;