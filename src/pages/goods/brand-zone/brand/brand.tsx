/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Typography,
  Upload,
  message,
  Form as AntdForm
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { getImageUrl } from '../../../../utils/imageUrl';
import { globalMessage } from '../../../../utils/globalMessage';

import * as api from '../../../../services/api';
import type { BrandResponse, CreateBrandRequest, UpdateBrandRequest, BrandStatus } from '../../../../services/api-type';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// --- 使用 API 定义的状态枚举 ---
enum BrandStatusEnum {
  ENABLED = '启用',
  DISABLED = '禁用',
  OFFLINE = '下架',
}

// --- 模拟数据生成函数 ---
const generateMockData = (): BrandResponse[] => {
  const brands: BrandResponse[] = [];
  const statuses: BrandStatus[] = ['启用', '禁用', '下架'];
  const logos = [
    'https://api.placeholder.com/100?text=Lenovo',
    'https://api.placeholder.com/100?text=ThinkPad',
    'https://api.placeholder.com/100?text=Legion',
    'https://api.placeholder.com/100?text=IdeaPad',
    'https://api.placeholder.com/100?text=YOGA',
    'https://api.placeholder.com/100?text=Apple',
    'https://api.placeholder.com/100?text=Dell',
    'https://api.placeholder.com/100?text=HP',
    'https://api.placeholder.com/100?text=Asus',
    'https://api.placeholder.com/100?text=Acer'
  ];
  
  const names = [
    '联想', 'ThinkPad', '拯救者', '小新', 'YOGA', 'IdeaPad', 
    'ThinkBook', '昭阳', '扬天', '启天', 'ThinkStation', 'ThinkCentre',
    '苹果', '戴尔', '惠普', '华硕', '宏碁', '微软', 
    '华为', '小米', '三星', 'LG', '索尼', '东芝',
    '雷神', '机械革命', '微星', '外星人', '雷蛇', '技嘉'
  ];
  
  const creators = ['admin', 'system', 'manager', 'lenovo_admin', 'store_manager'];
  
  for (let i = 1; i <= 30; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const logo = Math.random() > 0.3 ? logos[Math.floor(Math.random() * logos.length)] : '';
    
    brands.push({
      brand_id: `brand_${i.toString().padStart(3, '0')}`,
      name: names[Math.floor(Math.random() * names.length)] + (i > 10 ? ` ${i}` : ''),
      code: `BRAND${i.toString().padStart(3, '0')}`,
      status,
      description: `这是${names[Math.floor(Math.random() * names.length)]}品牌的详细描述，提供高质量的笔记本电脑产品和服务。`,
      remark: Math.random() > 0.5 ? '联想合作品牌，需重点关注' : '普通品牌',
      logo,
      creator_id: creators[Math.floor(Math.random() * creators.length)],
      created_at: dayjs().subtract(Math.floor(Math.random() * 365), 'day').toISOString(),
      updated_at: dayjs().subtract(Math.floor(Math.random() * 30), 'day').toISOString(),
    });
  }
  
  return brands;
};

const BrandListPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BrandResponse[]>([]);
  const [filteredData, setFilteredData] = useState<BrandResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // 搜索表单状态
  const [searchForm] = AntdForm.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('');

  // 新增/编辑表单
  const [editForm] = AntdForm.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载数据（优先使用API，失败时使用模拟数据）
  const loadData = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      const response = await api.getBrands(filters.status);
      const brands = response?.data || [];
      
      if (brands.length === 0) {
        console.log('使用模拟品牌数据');
        const mockBrands = generateMockData();
        setData(mockBrands);
        applyFilters(mockBrands, filters);
        setTotal(mockBrands.length);
      } else {
        setData(brands);
        applyFilters(brands, filters);
        setTotal(brands.length);
      }
      setSelectedRowKeys([]);
    } catch (error) { 
      console.log('API调用失败，使用模拟数据');
      const mockBrands = generateMockData();
      setData(mockBrands);
      applyFilters(mockBrands, filters);
      setTotal(mockBrands.length);
      setSelectedRowKeys([]);
    } finally { 
      setLoading(false); 
    }
  }, []);

  // 应用过滤条件
  const applyFilters = (brands: BrandResponse[], filters: any) => {
    let filtered = [...brands];
    
    if (filters.status) {
      filtered = filtered.filter(brand => brand.status === filters.status);
    }
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(brand => 
        brand.name.toLowerCase().includes(keyword) || 
        brand.code.toLowerCase().includes(keyword)
      );
    }
    
    setFilteredData(filtered);
    setTotal(filtered.length);
  };

  // 搜索处理
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setSearchKeyword(values.keyword || '');
    setSearchStatus(values.status || '');
    setPage(1);
    applyFilters(data, { status: values.status });
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchKeyword('');
    setSearchStatus('');
    setPage(1);
    applyFilters(data, {});
  };

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  useEffect(() => {
    applyFilters(data, { status: searchStatus });
  }, [data, searchKeyword, searchStatus]);

  // 获取当前页数据
  const getCurrentPageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, page, pageSize]);

  // 单行删除
  const handleDelete = async (id: string) => {
    try {
      await api.updateBrand(id, { status: '下架' as BrandStatus });
      globalMessage.success('品牌已下架');
      setData(prev => prev.map(brand => 
        brand.brand_id === id ? { ...brand, status: '下架' as BrandStatus } : brand
      ));
    } catch (err) { 
      console.log('API调用失败，更新本地数据');
      setData(prev => prev.map(brand => 
        brand.brand_id === id ? { ...brand, status: '下架' as BrandStatus } : brand
      ));
      globalMessage.success('品牌已下架（本地演示）');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await Promise.all(selectedRowKeys.map(id => 
        api.updateBrand(String(id), { status: '下架' as BrandStatus })
      ));
      globalMessage.success(`成功下架 ${selectedRowKeys.length} 个品牌`);
      setData(prev => prev.map(brand => 
        selectedRowKeys.includes(brand.brand_id) ? { ...brand, status: '下架' as BrandStatus } : brand
      ));
    } catch (err) { 
      console.log('API调用失败，更新本地数据');
      setData(prev => prev.map(brand => 
        selectedRowKeys.includes(brand.brand_id) ? { ...brand, status: '下架' as BrandStatus } : brand
      ));
      globalMessage.success(`成功下架 ${selectedRowKeys.length} 个品牌（本地演示）`);
    }
  };

  // 打开表单弹窗
  const openFormModal = (brand?: BrandResponse) => {
    if (brand) {
      setEditingId(brand.brand_id);
      setLogoPreview(brand.logo || '');
      setLogoFile(null);
      editForm.setFieldsValue({
        name: brand.name,
        code: brand.code,
        status: brand.status,
        description: brand.description || '',
        remark: brand.remark || ''
      });
    } else {
      setEditingId(null);
      setLogoPreview('');
      setLogoFile(null);
      editForm.resetFields();
    }
    setFormModalVisible(true);
  };

  // 表单提交
  const handleFormSubmit = async () => {
    try {
      setIsSubmitting(true);
      const values = await editForm.validateFields();
      
      if (editingId) {
        // 编辑现有品牌
        const formData: UpdateBrandRequest = {
          name: values.name,
          code: values.code,
          status: values.status as BrandStatus,
          description: values.description || undefined,
          remark: values.remark || undefined,
        };
        
        try {
          await api.updateBrand(editingId, { ...formData, logoFile });
          globalMessage.success('更新成功');
          setData(prev => prev.map(brand => 
            brand.brand_id === editingId ? { 
              ...brand, 
              ...formData,
              logo: logoFile ? URL.createObjectURL(logoFile) : brand.logo,
              updated_at: new Date().toISOString()
            } : brand
          ));
        } catch (error) {
          console.log('API调用失败，更新本地数据');
          setData(prev => prev.map(brand => 
            brand.brand_id === editingId ? { 
              ...brand, 
              ...formData,
              logo: logoFile ? URL.createObjectURL(logoFile) : brand.logo,
              updated_at: new Date().toISOString()
            } : brand
          ));
          globalMessage.success('更新成功（本地演示）');
        }
      } else {
        // 新增品牌
        const formData: CreateBrandRequest = {
          name: values.name,
          code: values.code,
          status: values.status as BrandStatus,
          description: values.description || undefined,
          remark: values.remark || undefined,
        };
        
        try {
          const response = await api.createBrand({ ...formData, logoFile });
          globalMessage.success('新增成功');
          const newBrand: BrandResponse = {
            brand_id: response?.data?.brand_id || `brand_${Date.now()}`,
            ...formData,
            logo: logoFile ? URL.createObjectURL(logoFile) : '',
            creator_id: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setData(prev => [newBrand, ...prev]);
        } catch (error) {
          console.log('API调用失败，更新本地数据');
          const newBrand: BrandResponse = {
            brand_id: `brand_${Date.now()}`,
            ...formData,
            logo: logoFile ? URL.createObjectURL(logoFile) : '',
            creator_id: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setData(prev => [newBrand, ...prev]);
          globalMessage.success('新增成功（本地演示）');
        }
      }
      
      setFormModalVisible(false);
      setLogoFile(null);
      setLogoPreview('');
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logo上传处理
  const handleLogoUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return false;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB');
      return false;
    }
    
    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    return false;
  };

  // --- 表格列定义（调整品牌名称列宽度）---
  const columns: ColumnsType<BrandResponse> = [
    { 
      title: 'Logo', 
      dataIndex: 'logo', 
      key: 'logo', 
      width: 60, 
      render: (text) => (
        <Image 
          src={getImageUrl(text)} 
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
      width: 100, // 调整宽度为100px
      render: (text, record) => (
        <div style={{ fontSize: '12px' }}>
          <Text strong>{text}</Text>
          <div style={{ fontSize: '10px', color: '#999' }}>{record.code}</div>
        </div>
      ) 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 80, 
      render: (status: string) => {
        const statusConfig: Record<string, { color: string, text: string }> = {
          '启用': { color: 'success', text: '启用' },
          '禁用': { color: 'default', text: '禁用' },
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
      render: (desc) => (
        <Tooltip title={desc}>
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
      render: (remark) => (
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
      render: (creator) => (
        <div style={{ fontSize: 11 }}>
          {creator}
        </div>
      ) 
    },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'createdAt', 
      width: 140, 
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm') 
    },
    { 
      title: '更新时间', 
      dataIndex: 'updated_at', 
      key: 'updatedAt', 
      width: 140, 
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm') 
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
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
                <Link to={`/goods/brand/edit/${record.brand_id}`}>
                <Button 
                    type="text" 
                    size="small" 
                    icon={<EditOutlined />}
                />
                </Link>
            </Tooltip>
          <Popconfirm 
            title="确定下架该品牌吗？" 
            onConfirm={() => handleDelete(record.brand_id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

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
              value={data.filter(i => i.status === '启用').length} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a', fontSize: 20 }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>新增品牌(7天)</span>}
              value={data.filter(i => dayjs(i.created_at).isAfter(dayjs().subtract(7, 'day'))).length}
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false}>
            <Statistic 
              title={<span style={{ fontSize: 12 }}>异常状态</span>} 
              value={data.filter(i => i.status === '下架').length} 
              prefix={<InfoCircleOutlined />} 
              valueStyle={{ color: '#ff4d4f', fontSize: 20 }} 
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索 + 批量操作 */}
      <Card size="small" bordered={false} style={{ marginBottom: 12 }}>
        <AntdForm form={searchForm} layout="inline">
          <Row justify="space-between" align="middle" style={{ width: '100%' }}>
            <Col>
              <Space size="small">
            
                <Link to="/goods/brand/create">
                <Button 
                    type="primary" 
                    size="small" 
                    icon={<PlusOutlined />}
                >
                    新增品牌
                </Button>
                </Link>
                <Popconfirm 
                  title={`确定下架 ${selectedRowKeys.length} 个品牌吗？`} 
                  onConfirm={handleBatchDelete} 
                  disabled={selectedRowKeys.length === 0}
                >
                  <Button 
                    danger 
                    size="small" 
                    disabled={selectedRowKeys.length === 0} 
                    icon={<DeleteOutlined />}
                  >
                    批量下架
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
            <Col>
              <Space size="small">
                <AntdForm.Item name="keyword" noStyle>
                  <Input 
                    placeholder="品牌名称/编码" 
                    size="small" 
                    style={{ width: 150, fontSize: 12 }}
                    allowClear
                  />
                </AntdForm.Item>
                <AntdForm.Item name="status" noStyle>
                  <Select 
                    placeholder="状态"
                    size="small" 
                    style={{ width: 100, fontSize: 12 }}
                    allowClear
                  >
                    <Option value="">全部</Option>
                    <Option value="启用">启用</Option>
                    <Option value="禁用">禁用</Option>
                    <Option value="下架">下架</Option>
                  </Select>
                </AntdForm.Item>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<SearchOutlined />} 
                  onClick={handleSearch}
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
        </AntdForm>
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
          // 参考stock.tsx的分页设置，显示快速跳转
          pagination={{
            current: page,
            pageSize: pageSize,
            total: filteredData.length,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              if (newPageSize) {
                setPageSize(newPageSize);
              }
            },
            showSizeChanger: true,
            showQuickJumper: true,  // 启用快速跳转
            size: 'small',
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal 
        title={editingId ? "编辑品牌档案" : "录入新品牌"} 
        open={formModalVisible} 
        onCancel={() => { 
          setFormModalVisible(false); 
          setLogoFile(null); 
          setLogoPreview(''); 
        }} 
        onOk={handleFormSubmit} 
        confirmLoading={isSubmitting} 
        destroyOnClose 
        width={550}
      >
        <AntdForm 
          form={editForm} 
          layout="vertical" 
          size="small"
          initialValues={{
            status: '启用'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <AntdForm.Item 
                label="品牌名称" 
                name="name"
                rules={[
                  { required: true, message: '请输入品牌名称' },
                  { max: 50, message: '名称不能超过50个字符' }
                ]}
              >
                <Input placeholder="唯一标识名称" />
              </AntdForm.Item>
            </Col>
            <Col span={12}>
              <AntdForm.Item 
                label="品牌编码" 
                name="code"
                rules={[
                  { required: true, message: '请输入品牌编码' },
                  { max: 50, message: '编码不能超过50个字符' }
                ]}
              >
                <Input 
                  placeholder="系统内部编码" 
                  disabled={!!editingId} 
                />
              </AntdForm.Item>
            </Col>
          </Row>
          <AntdForm.Item label="Logo 图片">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Upload
                maxCount={1}
                accept="image/*"
                beforeUpload={handleLogoUpload}
                onRemove={() => {
                  setLogoFile(null);
                  setLogoPreview('');
                }}
                fileList={logoFile ? [{ 
                  uid: '-1', 
                  name: logoFile.name, 
                  status: 'done', 
                  originFileObj: logoFile 
                } as any] : []}
                showUploadList={{
                  showRemoveIcon: true,
                }}
              >
                <Button icon={<UploadOutlined />}>选择图片</Button>
              </Upload>
              {logoPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Image 
                    src={logoPreview} 
                    width={80} 
                    height={80} 
                    style={{ borderRadius: 4, objectFit: 'contain' }} 
                  />
                  <span style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    预览
                  </span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              支持 JPG、PNG 格式，大小不超过 5MB
            </div>
          </AntdForm.Item>
          <AntdForm.Item 
            label="状态" 
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="启用">启用</Option>
              <Option value="禁用">禁用</Option>
              <Option value="下架">下架</Option>
            </Select>
          </AntdForm.Item>
          <AntdForm.Item 
            label="品牌描述" 
            name="description"
          >
            <TextArea 
              rows={2} 
              placeholder="详细功能或背景描述" 
              maxLength={500}
              showCount
            />
          </AntdForm.Item>
          <AntdForm.Item 
            label="备注 (内部可见)" 
            name="remark"
          >
            <TextArea 
              rows={2} 
              placeholder="补充说明信息" 
              maxLength={200}
              showCount
            />
          </AntdForm.Item>
        </AntdForm>
      </Modal>

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
                selectedBrand.status === '禁用' ? 'default' : 'red'
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
                {selectedBrand.brand_id ?? '-'}
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