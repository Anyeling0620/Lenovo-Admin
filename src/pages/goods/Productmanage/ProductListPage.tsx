/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import type { 
  BrandResponse, CategoryResponse, ProductStatus 
} from '../../../services/api-type';
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';
import globalErrorHandler from '../../../utils/globalAxiosErrorHandler';
import { 
  getBrands, getCategories, getProducts, updateProductStatus,
  getProductStats as apiGetProductStats
} from '../../../services/api';
// 导入模拟数据
import { 
  mockBrands, mockCategories,
  generateMockProducts, mockProductStats 
} from '../../../services/cyf-mockData';

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
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [stats, setStats] = useState<ProductStats>({ total: 0, normal: 0, off: 0, brands: 0 });
  const [brands, setBrands] = useState<OptionItem[]>([]);
  const [categories, setCategories] = useState<OptionItem[]>([]);

  // 使用模拟数据标志
  const useMockData = true;

  const { control: filterControl, handleSubmit: handleFilterSubmit, reset: resetFilter } = useForm({
    defaultValues: { keyword: '', status: '', brand_id: '', category_id: '' }
  });

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      if (useMockData) {
        setStats({
          total: mockProductStats.total,
          normal: mockProductStats.normal,
          off: mockProductStats.off,
          brands: mockProductStats.brands
        });
      } else {
        const res = await apiGetProductStats();
        // 修复：处理 API 返回数据，确保有 brands 属性
        setStats({
          total: res.total || 0,
          normal: res.normal || 0,
          off: res.off || 0,
          brands: (res as any).brands || 0 // 类型断言，或者根据实际 API 调整
        });
      }
    } catch (error) {
      console.error("加载统计失败", error);
    }
  }, [useMockData]);

  // 加载选项数据
  const loadOptions = useCallback(async () => {
    try {
      if (useMockData) {
        setBrands([
          { label: '全部品牌', value: '' },
          ...mockBrands.map((b: BrandResponse) => ({ label: b.name, value: b.brand_id }))
        ]);
        
        setCategories([
          { label: '全部品类', value: '' },
          ...mockCategories.map((c: CategoryResponse) => ({ label: c.name, value: c.category_id }))
        ]);
      } else {
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
      }
    } catch (error) {
      console.error("加载选项失败", error);
    }
  }, [useMockData]);

  // 加载商品数据
  const loadData = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      if (useMockData) {
        // 使用模拟数据
        let mockProducts = generateMockProducts(25);
        
        // 应用过滤条件
        if (filters.keyword) {
          mockProducts = mockProducts.filter(p => 
            p.name.toLowerCase().includes(filters.keyword.toLowerCase()) || 
            p.product_id.includes(filters.keyword)
          );
        }
        if (filters.brand_id && filters.brand_id !== '') {
          mockProducts = mockProducts.filter(p => p.brand_id === filters.brand_id);
        }
        if (filters.category_id && filters.category_id !== '') {
          mockProducts = mockProducts.filter(p => p.category_id === filters.category_id);
        }
        if (filters.status && filters.status !== '') {
          mockProducts = mockProducts.filter(p => p.status === filters.status);
        }
        
        const total = mockProducts.length;
        const current = page;
        const size = pageSize;
        const start = (current - 1) * size;
        const items = mockProducts.slice(start, start + size);
        
        // 修复：确保数据结构与 API 一致
        setData(items || []);
        setTotal(total || 0);
      } else {
        const response = await getProducts({ 
          ...filters, 
          page, 
          pageSize 
        });
        
        // 修复：根据实际 API 响应结构调整
        // 假设 API 返回 { items: [], total: number }
        if (response && typeof response === 'object') {
          setData(response.items || []);
          setTotal(response.total || 0);
        } else {
          // 如果 API 直接返回数组
          setData(Array.isArray(response) ? response : []);
          setTotal(Array.isArray(response) ? response.length : 0);
        }
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, useMockData]);

  // 刷新所有数据
  const refreshAll = () => {
    loadData({});
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
    setPage(1);
    loadData(filters);
  };

  const onReset = () => { 
    resetFilter(); 
    setPage(1); 
    loadData({}); 
  };

  // 删除商品（模拟）
  const handleDelete = async (id: string) => {
    try {
      globalMessage.loading('正在删除...');
      
      if (useMockData) {
        // 模拟删除
        setData(prev => prev.filter(item => item.product_id !== id));
        globalMessage.success('商品已删除');
      } else {
        await updateProductStatus(id, '删除' as ProductStatus);
        globalMessage.success('商品已删除');
      }
      
      refreshAll();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: `确定删除 ${selectedRowKeys.length} 条商品？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          if (useMockData) {
            // 模拟批量删除
            setData(prev => prev.filter(item => !selectedRowKeys.includes(item.product_id)));
            globalMessage.success('批量删除成功');
          } else {
            await Promise.all(selectedRowKeys.map(id => 
              updateProductStatus(id as string, '删除' as ProductStatus)
            ));
            globalMessage.success('批量删除成功');
          }
          
          setSelectedRowKeys([]);
          refreshAll();
        } catch (err) {
          globalErrorHandler.handle(err, globalMessage.error);
        }
      }
    });
  };

  // 表格列定义
  const columns: ColumnsType<any> = [
    {
      title: 'ID',
      dataIndex: 'product_id',
      width: 120,
      fixed: 'left',
      ellipsis: true,
      render: (id) => <Tooltip title={id}><Text copyable={{ text: id }} style={{ fontSize: 11 }}>{id}</Text></Tooltip>
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
          {record.sub_title && <div style={{ fontSize: 11, color: '#999' }}>{record.sub_title}</div>}
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
          status={status === '正常' ? 'success' : (status === '下架' ? 'warning' : 'default')} 
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
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (t) => <span style={{ fontSize: 11, color: '#888' }}>{dayjs(t).format('YYYY-MM-DD HH:mm')}</span>
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 140,
      sorter: (a, b) => dayjs(a.updated_at).unix() - dayjs(b.updated_at).unix(),
      render: (t) => <span style={{ fontSize: 11, color: '#888' }}>{dayjs(t).format('YYYY-MM-DD HH:mm')}</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        // 当前页面路径
        const currentPath = window.location.pathname + window.location.search;
        
        return (
          <Space size={2}>
            <Tooltip title="查看详情">
              <Link 
                to={{
                  pathname: `/goods/detail/${record.product_id}`,
                  state: { from: currentPath }
                } as any} // 修复：使用类型断言解决 state 类型问题
              >
                <Button type="text" size="small" icon={<EyeOutlined />} />
              </Link>
            </Tooltip>
            
            <Tooltip title="编辑信息">
              <Link 
                to={{
                  pathname: `/goods/manage/edit/${record.product_id}`,
                  state: { from: currentPath }
                } as any}
              >
                <Button type="text" size="small" icon={<EditOutlined />} />
              </Link>
            </Tooltip>
            
            <Tooltip title="SKU规格">
              <Link 
                to={{
                  pathname: `/goods/manage/sku/${record.product_id}`,
                  state: { from: currentPath }
                } as any}
              >
                <Button type="text" size="small" icon={<SettingOutlined />} />
              </Link>
            </Tooltip>
            
            <Tooltip title="图库管理">
              <Link 
                to={{
                  pathname: `/goods/manage/gallery/${record.product_id}`,
                  state: { from: currentPath }
                } as any}
              >
                <Button type="text" size="small" icon={<PictureOutlined />} />
              </Link>
            </Tooltip>
            
            <Divider type="vertical" />
            
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.product_id)} okText="是" cancelText="否">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: 8, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <Card size="small" bordered={false} bodyStyle={{ padding: 12 }}>
            <Statistic 
              title={<span style={{ fontSize: 11 }}>商品总量</span>} 
              value={stats.total} 
              prefix={<AppstoreOutlined />} 
              valueStyle={{ fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered={false} bodyStyle={{ padding: 12 }}>
            <Statistic 
              title={<span style={{ fontSize: 11 }}>在售商品</span>} 
              value={stats.normal} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ fontSize: 20, color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered={false} bodyStyle={{ padding: 12 }}>
            <Statistic 
              title={<span style={{ fontSize: 11 }}>已下架</span>} 
              value={stats.off} 
              prefix={<StopOutlined />} 
              valueStyle={{ fontSize: 20, color: '#faad14' }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered={false} bodyStyle={{ padding: 12 }}>
            <Statistic 
              title={<span style={{ fontSize: 11 }}>合作品牌</span>} 
              value={stats.brands || 0} 
              prefix={<TagsOutlined />} 
              valueStyle={{ fontSize: 20 }} 
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" bordered={false} style={{ marginBottom: 12 }}>
        <Row justify="space-between" align="middle" gutter={[8, 8]}>
          <Col>
            <Space size="small">
              <Link to="/goods/manage/create">
                <Button type="primary" size="small" icon={<PlusOutlined />}>
                  录入商品
                </Button>
              </Link>
              <Button 
                danger 
                size="small" 
                icon={<DeleteOutlined />} 
                disabled={selectedRowKeys.length === 0} 
                onClick={handleBatchDelete}
              >
                批量删除
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
                      <Option value="删除">删除</Option>
                    </Select>
                  )} 
                />
                <Button type="primary" size="small" icon={<SearchOutlined />} htmlType="submit">
                  查询
                </Button>
                <Button size="small" icon={<ReloadOutlined />} onClick={onReset}>
                  重置
                </Button>
              </Space>
            </form>
          </Col>
        </Row>
      </Card>

      <Card size="small" bordered={false} bodyStyle={{ padding: 0 }}>
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