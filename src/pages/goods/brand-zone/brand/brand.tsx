/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table, 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Statistic,
  Modal,
  Popconfirm,
  Tooltip,
  Descriptions,
  Image,
  Badge,
  Typography} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Link, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { getImageUrl } from '../../../../utils/imageUrl';
import { globalMessage } from '../../../../utils/globalMessage';
import * as api from '../../../../services/api';
import type { BrandResponse, BrandStatus } from '../../../../services/api-type';

const { Text } = Typography;
const { Option } = Select;

interface TableFilter {
  keyword?: string;
  status?: string;
}

const BrandListPage: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BrandResponse[]>([]);
  const [filteredData, setFilteredData] = useState<BrandResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);

  // 搜索表单状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('');

  // 加载数据 - 使用真实API
  const loadData = useCallback(async (filters: TableFilter = {}) => {
    setLoading(true);
    try {
      // 调用真实API获取品牌数据
      const brands = await api.getBrands(filters.status);
      setData(brands);
      setFilteredData(brands);
      setTotal(brands.length);
      setSelectedRowKeys([]);
    } catch (error: any) { 
      console.error('获取品牌数据失败:', error);
      const errorMessage = error.response?.data?.message || '获取品牌数据失败';
      globalMessage.error(errorMessage);
    } finally { 
      setLoading(false); 
    }
  }, []);

  // 应用过滤条件
  const applyFilters = useCallback((brands: BrandResponse[], filters: TableFilter) => {
    let filtered = [...brands];
    
    if (filters.status && filters.status !== '') {
      filtered = filtered.filter(brand => brand.status === filters.status);
    }
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(brand => 
        (brand.name && brand.name.toLowerCase().includes(keyword)) || 
        (brand.code && brand.code.toLowerCase().includes(keyword))
      );
    }
    
    setFilteredData(filtered);
    setTotal(filtered.length);
  }, [searchKeyword]);

  // 搜索处理
  const handleSearch = (values: TableFilter) => {
    setSearchKeyword(values.keyword || '');
    setSearchStatus(values.status || '');
    setPage(1);
    loadData({ status: values.status });
  };

  // 重置搜索
  const handleReset = () => {
    setSearchKeyword('');
    setSearchStatus('');
    setPage(1);
    loadData(); // 重新加载所有数据
  };

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  useEffect(() => {
    applyFilters(data, { status: searchStatus });
  }, [data, searchStatus, applyFilters]);

  // 获取当前页数据
  const getCurrentPageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, page, pageSize]);

  // 单行删除（下架）
  const handleDelete = async (id: string) => {
    try {
      // 使用真实API更新品牌状态为"下架"
      await api.updateBrand(id, { status: '下架' as BrandStatus });
      globalMessage.success('品牌已下架');
      
      // 更新本地数据
      setData(prev => prev.map(brand => 
        brand.brand_id === id ? { ...brand, status: '下架' as BrandStatus } : brand
      ));
      
      // 重新加载数据以确保数据一致性
      loadData({ status: searchStatus });
    } catch (error: any) { 
      console.error('下架品牌失败:', error);
      const errorMessage = error.response?.data?.message || '下架品牌失败';
      globalMessage.error(errorMessage);
    }
  };

  // 批量删除（下架）
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    
    Modal.confirm({
      title: `确认下架 ${selectedRowKeys.length} 个品牌吗？`,
      content: '下架后这些品牌将不再显示在前台',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 批量下架品牌
          const promises = selectedRowKeys.map(id => 
            api.updateBrand(String(id), { status: '下架' as BrandStatus })
          );
          
          await Promise.all(promises);
          globalMessage.success(`成功下架 ${selectedRowKeys.length} 个品牌`);
          
          // 重新加载数据
          loadData({ status: searchStatus });
          setSelectedRowKeys([]);
        } catch (error: any) { 
          console.error('批量下架品牌失败:', error);
          const errorMessage = error.response?.data?.message || '批量下架品牌失败';
          globalMessage.error(errorMessage);
        }
      }
    });
  };

  // 获取当前路径和查询参数
  const getCurrentLocationState = useMemo(() => {
    return {
      pathname: location.pathname,
      search: location.search
    };
  }, [location]);

  // 构建编辑链接
  const buildEditLink = (brandId: string) => {
    return {
      pathname: `/goods/brand/edit/${brandId}`,
      state: getCurrentLocationState
    };
  };

  // 构建新增链接
  const buildCreateLink = () => {
    return {
      pathname: "/goods/brand/create",
      state: getCurrentLocationState
    };
  };

  // 处理状态筛选器变化
  const handleStatusChange = (value: string) => {
    setSearchStatus(value);
    loadData({ status: value });
  };

  // --- 表格列定义 ---
  const columns: ColumnsType<BrandResponse> = [
    { 
      title: 'Logo', 
      dataIndex: 'logo', 
      key: 'logo', 
      width: 60, 
      render: (logo: string | null) => (
        <Image 
          src={logo ? getImageUrl(logo) : 'https://api.placeholder.com/30?text=LOGO'} 
          width={30} 
          height={30} 
          style={{ objectFit: 'contain', borderRadius: 4 }} 
          fallback="https://api.placeholder.com/30?text=LOGO" 
        />
      ) 
    },
    { 
      title: '品牌名称', 
      dataIndex: 'name', 
      key: 'name', 
      width: 100,
      render: (name: string, record: BrandResponse) => (
        <div style={{ fontSize: '12px' }}>
          <Text strong>{name}</Text>
          <div style={{ fontSize: '10px', color: '#999' }}>{record.code}</div>
        </div>
      ) 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 80, 
      render: (status: BrandStatus) => {
        const statusConfig: Record<BrandStatus, { color: string, text: string }> = {
          '启用': { color: 'success', text: '启用' },
          '禁用': { color: 'warning', text: '禁用' },
          '下架': { color: 'error', text: '下架' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Badge status={config.color as any} text={config.text} style={{ fontSize: '11px' }} />;
      } 
    },
    { 
      title: '品牌描述', 
      dataIndex: 'description', 
      key: 'description', 
      width: 180, 
      render: (desc: string | null | undefined) => (
        <Tooltip title={desc || '-'}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
            {desc || '-'}
          </div>
        </Tooltip>
      ) 
    },
    { 
      title: '备注', 
      dataIndex: 'remark', 
      key: 'remark', 
      width: 120, 
      render: (remark: string | null | undefined) => (
        <div style={{ fontSize: 11, color: '#faad14' }}>
          {remark || '-'}
        </div>
      ) 
    },
    { 
      title: '创建者', 
      dataIndex: 'creator_id', 
      key: 'creator', 
      width: 80, 
      render: (creator: string | undefined) => (
        <div style={{ fontSize: 11 }}>
          {creator || '-'}
        </div>
      ) 
    },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'createdAt', 
      width: 140, 
      render: (created_at: string) => created_at ? dayjs(created_at).format('YYYY-MM-DD HH:mm') : '-' 
    },
    { 
      title: '更新时间', 
      dataIndex: 'updated_at', 
      key: 'updatedAt', 
      width: 140, 
      render: (updated_at: string | undefined) => updated_at ? dayjs(updated_at).format('YYYY-MM-DD HH:mm') : '-' 
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      fixed: 'right',
      render: (_: any, record: BrandResponse) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => { 
                setSelectedBrand(record); 
                setDetailModalVisible(true); 
              }} 
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Link 
              to={buildEditLink(record.brand_id)}
            >
              <Button 
                type="text" 
                size="small" 
                icon={<EditOutlined />}
              />
            </Link>
          </Tooltip>
          {record.status !== '下架' && (
            <Popconfirm 
              title="确定下架该品牌吗？" 
              onConfirm={() => handleDelete(record.brand_id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  // 计算统计信息
  const stats = useMemo(() => {
    const enabledCount = data.filter(item => item.status === '启用').length;
    const disabledCount = data.filter(item => item.status === '禁用').length;
    const offCount = data.filter(item => item.status === '下架').length;
    const recentCount = data.filter(item => 
      item.created_at && dayjs(item.created_at).isAfter(dayjs().subtract(7, 'day'))
    ).length;
    
    return { enabledCount, disabledCount, offCount, recentCount };
  }, [data]);

  // 处理分页变化
  const handlePaginationChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage);
    if (newPageSize) {
      setPageSize(newPageSize);
    }
  };

  return (
    <div style={{ padding: 8, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 统计卡片 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>品牌总数</span>} 
              value={total} 
              prefix={<AppstoreOutlined />} 
              valueStyle={{ color: '#1890ff', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>启用中</span>} 
              value={stats.enabledCount} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>新增品牌(7天)</span>}
              value={stats.recentCount}
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>已下架</span>} 
              value={stats.offCount} 
              prefix={<InfoCircleOutlined />} 
              valueStyle={{ color: '#ff4d4f', fontSize: 20 }} 
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索 + 批量操作 */}
      <Card size="small" bordered={false} style={{ marginBottom: 12 }}>
        <Row justify="space-between" align="middle" style={{ width: '100%' }}>
          <Col>
            <Space size="small">
              <Link 
                to={buildCreateLink()}
              >
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                >
                  新增品牌
                </Button>
              </Link>
              <Button 
                danger 
                size="small" 
                disabled={selectedRowKeys.length === 0} 
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
              >
                批量下架
              </Button>
            </Space>
          </Col>
          <Col>
            <Space size="small">
              <Input 
                placeholder="品牌名称/编码" 
                size="small" 
                style={{ width: 150, fontSize: 12 }}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
                onPressEnter={() => handleSearch({ keyword: searchKeyword, status: searchStatus })}
              />
              <Select 
                placeholder="状态"
                size="small" 
                style={{ width: 100, fontSize: 12 }}
                value={searchStatus}
                onChange={handleStatusChange}
                allowClear
              >
                <Option value="">全部</Option>
                <Option value="启用">启用</Option>
                <Option value="禁用">禁用</Option>
                <Option value="下架">下架</Option>
              </Select>
              <Button 
                type="primary" 
                size="small" 
                icon={<SearchOutlined />} 
                onClick={() => handleSearch({ keyword: searchKeyword, status: searchStatus })}
              >
                查询
              </Button>
              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 表格 */}
      <Card size="small" bordered={false}>
        <Table
          columns={columns}
          dataSource={getCurrentPageData}
          rowKey="brand_id"
          loading={loading}
          size="small"
          rowSelection={{ 
            selectedRowKeys, 
            onChange: (keys) => setSelectedRowKeys(keys) 
          }}
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: handlePaginationChange,
            showSizeChanger: true,
            showQuickJumper: true,
            size: 'small',
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal 
        title="品牌详细档案" 
        open={detailModalVisible} 
        onCancel={() => setDetailModalVisible(false)} 
        footer={<Button size="small" onClick={() => setDetailModalVisible(false)}>关闭</Button>} 
        width={700}
      >
        {selectedBrand && (
          <Descriptions 
            bordered 
            size="small" 
            column={2} 
            labelStyle={{ width: '120px', fontSize: '12px' }} 
            contentStyle={{ fontSize: '12px' }}
          >
            <Descriptions.Item label="品牌名称" span={2}>
              <Text strong>{selectedBrand.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="品牌编码">
              {selectedBrand.code}
            </Descriptions.Item>
            <Descriptions.Item label="业务状态">
              <Tag color={
                selectedBrand.status === '启用' ? 'green' : 
                selectedBrand.status === '禁用' ? 'orange' : 'red'
              }>
                {selectedBrand.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="品牌Logo" span={2}>
              {selectedBrand.logo ? (
                <Image 
                  src={getImageUrl(selectedBrand.logo)} 
                  width={60} 
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="品牌描述">
              {selectedBrand.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="内部备注">
              {selectedBrand.remark || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="系统标识 (UUID)" span={2}>
              <Text copyable style={{ fontSize: '11px', color: '#888' }}>
                {selectedBrand.brand_id || '-'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="创建者">
              {selectedBrand.creator_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {selectedBrand.created_at ? dayjs(selectedBrand.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="最后更新时间" span={2}>
              <Text type="warning">
                {selectedBrand.updated_at ? dayjs(selectedBrand.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default BrandListPage;