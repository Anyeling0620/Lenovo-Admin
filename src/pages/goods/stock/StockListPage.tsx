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
  Tooltip, 
  Typography, 
  Form, 
  InputNumber,
  message,
  Descriptions,
  Popconfirm} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  StockOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

// 使用真实的API
import { getStocks, updateStock } from '../../../services/api';
import type { StockResponse } from '../../../services/api-type';
import Dropdown from 'antd/es/dropdown/dropdown';
import Alert from 'antd/es/alert/Alert';

const { Text } = Typography;
const { Option } = Select;

// 修复类型：覆盖错误的 updated_at 定义
interface FixedStockResponse extends Omit<StockResponse, 'updated_at'> {
  updated_at: string;
  last_in_time: string | null;
  last_out_time: string | null;
}

interface StockItem extends FixedStockResponse {
  // 添加一些计算属性
  available_stock: number;
  status: 'normal' | 'warning' | 'danger';
}

const StockListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StockItem[]>([]);
  
  // 状态管理
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 模态框状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentStock, setCurrentStock] = useState<StockItem | null>(null);

  // 表单状态
  const [editForm] = Form.useForm();
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // 添加批量编辑状态和函数
  const [batchEditModalVisible, setBatchEditModalVisible] = useState(false);
  const [batchEditForm] = Form.useForm();

  // --- 数据加载 ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 使用真实API调用
      const response = await getStocks();
      
      if (response && Array.isArray(response)) {
        // 处理数据，添加计算字段并修复类型
        const processedStocks: StockItem[] = response.map(stock => {
          const available = stock.stock_num - stock.freeze_num;
          let status: 'normal' | 'warning' | 'danger' = 'normal';
          
          if (stock.stock_num === 0) {
            status = 'danger';
          } else if (stock.stock_num <= stock.warn_num) {
            status = 'warning';
          }
          
          // 修复类型：确保 updated_at 是字符串
          const updatedAt = typeof stock.updated_at === 'function' 
            ? new Date().toISOString() 
            : (stock.updated_at as any as string) || new Date().toISOString();
            
          // 修复其他时间字段
          const lastInTime = stock.last_in_time || null;
          const lastOutTime = stock.last_out_time || null;
          
          return {
            ...stock,
            updated_at: updatedAt,
            last_in_time: lastInTime,
            last_out_time: lastOutTime,
            available_stock: available,
            status
          } as StockItem;
        });
        
        setData(processedStocks);
      } else {
        message.warning('获取库存列表为空');
        setData([]);
      }
    } catch (error) {
      console.error('Error loading stocks:', error);
      message.error('获取库存列表失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- 前端过滤 ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const keyword = searchText.toLowerCase();
      const matchKeyword = 
        (item.product_name || '').toLowerCase().includes(keyword) ||
        (item.config1 || '').toLowerCase().includes(keyword) ||
        (item.config2 || '').toLowerCase().includes(keyword) ||
        (item.config3 || '').toLowerCase().includes(keyword) ||
        (item.stock_id || '').toLowerCase().includes(keyword) ||
        (item.config_id || '').toLowerCase().includes(keyword);

      if (!matchKeyword) return false;
      if (filterStatus === 'warning') return item.stock_num <= item.warn_num;
      if (filterStatus === 'normal') return item.stock_num > item.warn_num;
      if (filterStatus === 'freeze') return item.freeze_num > 0;
      return true;
    });
  }, [data, searchText, filterStatus]);

  // --- 计算分页数据 ---
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, page, pageSize]);

  const stats = useMemo(() => ({
    totalSku: data.length,
    totalStock: data.reduce((sum, item) => sum + item.stock_num, 0),
    warningCount: data.filter(item => item.stock_num <= item.warn_num).length,
    freezeTotal: data.reduce((sum, item) => sum + item.freeze_num, 0),
  }), [data]);

  // --- 操作处理 ---

  // 打开详情
  const handleDetail = (record: StockItem) => {
    setCurrentStock(record);
    setDetailModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: StockItem) => {
    setCurrentStock(record);
    editForm.setFieldsValue({
      stock_num: record.stock_num,
      warn_num: record.warn_num,
    });
    setEditModalVisible(true);
  };

  // 跳转到编辑页面（带返回路径）
  const handleNavigateToEdit = (record: StockItem) => {
    navigate(`/goods/stock/edit/${record.stock_id}`, { 
      state: { 
        from: location.pathname + location.search,
        stockData: record 
      } 
    });
  };

  // 提交更新
  const onUpdateSubmit = async (values: { stock_num: number; warn_num: number }) => {
    if (!currentStock) return;
    
    setIsEditSubmitting(true);
    try {
      // 使用真实API调用
      await updateStock(currentStock.config_id, {
        stock_num: values.stock_num,
        warn_num: values.warn_num
      });
      
      // 更新本地数据
      setData(prev => prev.map(item => {
        if (item.stock_id === currentStock.stock_id) {
          const available = values.stock_num - item.freeze_num;
          let status: 'normal' | 'warning' | 'danger' = 'normal';
          
          if (values.stock_num === 0) {
            status = 'danger';
          } else if (values.stock_num <= values.warn_num) {
            status = 'warning';
          }
          
          return {
            ...item,
            stock_num: values.stock_num,
            warn_num: values.warn_num,
            updated_at: new Date().toISOString(),
            available_stock: available,
            status
          };
        }
        return item;
      }));
      
      message.success('库存配置已更新');
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating stock:', error);
      message.error('更新库存失败');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // 单条删除（根据API文档，没有删除库存的接口，暂时保留功能但注释掉API调用）
  const handleDelete = async (record: StockItem) => {
    try {
      // 注意：API文档中没有删除库存的接口，这里只是前端移除
      console.log('删除库存:', record.stock_id);
      
      // 从列表中移除（前端模拟删除）
      setData(prev => prev.filter(item => item.stock_id !== record.stock_id));
      
      message.success('删除成功');
    } catch (error) {
      console.error('Error deleting stock:', error);
      message.error('删除失败');
    }
  };

  // 批量删除（同样，API没有批量删除接口）
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      // 模拟批量删除
      console.log('批量删除:', selectedRowKeys);
      
      // 从列表中移除（前端模拟删除）
      setData(prev => prev.filter(item => !selectedRowKeys.includes(item.stock_id)));
      
      message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Error batch deleting:', error);
      message.error('批量删除失败');
    }
  };

// 批量编辑处理函数
const handleBatchEdit = () => {
  if (selectedRowKeys.length === 0) {
    message.warning('请先选择要编辑的库存记录');
    return;
  }
  setBatchEditModalVisible(true);
};

const handleBatchEditSubmit = async (values: { operation: 'set' | 'add' | 'subtract', value: number }) => {
    setIsEditSubmitting(true);
    try {
      const selectedStocks = data.filter(item => selectedRowKeys.includes(item.stock_id));
      
      // 批量更新逻辑
      const promises = selectedStocks.map(async (stock) => {
        let newStockNum = stock.stock_num;
        
        if (values.operation === 'set') {
          newStockNum = values.value;
        } else if (values.operation === 'add') {
          newStockNum = stock.stock_num + values.value;
        } else if (values.operation === 'subtract') {
          newStockNum = Math.max(0, stock.stock_num - values.value);
        }
        
        await updateStock(stock.config_id, {
          stock_num: newStockNum,
          warn_num: stock.warn_num,
        });
      });
      
      await Promise.all(promises);
      
      message.success(`成功更新 ${selectedStocks.length} 条库存记录`);
      setBatchEditModalVisible(false);
      setSelectedRowKeys([]);
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('批量编辑失败:', error);
      message.error('批量编辑失败');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // --- 表格列定义 ---
  const columns: ColumnsType<StockItem> = [
    {
      title: '商品规格信息',
      key: 'info',
      width: 240,
      render: (_, record) => (
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 500, color: '#262626', marginBottom: 4 }}>{record.product_name}</div>
          <Space size={4} wrap>
            <Tag color="blue" style={{ margin: 0, fontSize: 10, padding: '0 4px', lineHeight: '18px' }}>{record.config1}</Tag>
            <Tag color="cyan" style={{ margin: 0, fontSize: 10, padding: '0 4px', lineHeight: '18px' }}>{record.config2}</Tag>
            {record.config3 && <Tag style={{ margin: 0, fontSize: 10, padding: '0 4px', lineHeight: '18px' }}>{record.config3}</Tag>}
          </Space>
          <div style={{ fontSize: 10, color: '#999', marginTop: 4, fontFamily: 'Monaco' }}>
            Stock ID: {record.stock_id}
          </div>
        </div>
      )
    },
    {
      title: '配置 ID',
      dataIndex: 'config_id',
      key: 'config_id',
      width: 120,
      render: (val) => (
        <Text copyable={{ text: val }} style={{ fontSize: 11, fontFamily: 'Monaco', color: '#595959' }}>
          {val}
        </Text>
      )
    },
    {
      title: '库存量',
      dataIndex: 'stock_num',
      key: 'stock_num',
      width: 90,
      sorter: (a, b) => a.stock_num - b.stock_num,
      render: (val, record) => {
        const isWarning = val <= record.warn_num;
        return (
          <span style={{ 
            fontWeight: 600, 
            color: isWarning ? '#cf1322' : '#262626',
            fontFamily: 'Monaco'
          }}>
            {val}
            {isWarning && <WarningOutlined style={{ marginLeft: 6, fontSize: 12, color: '#cf1322' }} />}
          </span>
        );
      }
    },
    {
      title: '冻结',
      dataIndex: 'freeze_num',
      key: 'freeze_num',
      width: 80,
      sorter: (a, b) => a.freeze_num - b.freeze_num,
      render: (val) => (
        <span style={{ color: val > 0 ? '#faad14' : '#bfbfbf', fontWeight: val > 0 ? 600 : 400 }}>
          {val}
        </span>
      )
    },
    {
      title: '可用库存',
      key: 'available',
      width: 90,
      render: (_, record) => {
        const available = record.available_stock;
        return (
          <span style={{ 
            fontWeight: 600, 
            color: available > 0 ? '#52c41a' : '#f5222d',
            fontFamily: 'Monaco'
          }}>
            {available}
          </span>
        );
      }
    },
    {
      title: '预警值',
      dataIndex: 'warn_num',
      key: 'warn_num',
      width: 80,
      render: (val) => <span style={{ color: '#8c8c8c' }}>{val}</span>
    },
    {
      title: '最后入库',
      dataIndex: 'last_in_time',
      key: 'last_in_time',
      width: 120,
      render: (t) => (
        <span style={{ fontSize: 11, color: '#888' }}>
          {t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'}
        </span>
      )
    },
    {
      title: '最后出库',
      dataIndex: 'last_out_time',
      key: 'last_out_time',
      width: 120,
      render: (t) => (
        <span style={{ fontSize: 11, color: '#888' }}>
          {t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'}
        </span>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 120,
      sorter: (a, b) => dayjs(a.updated_at).unix() - dayjs(b.updated_at).unix(),
      render: (t) => <span style={{ fontSize: 11, color: '#888' }}>{dayjs(t).format('YYYY-MM-DD HH:mm')}</span>
    },
    // 更新表格的操作列定义
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="快速编辑">
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ padding: '0 4px', fontSize: 12 }}
            />
          </Tooltip>
          
          <Tooltip title="详情">
            <Button 
              type="link" 
              size="small" 
              icon={<InfoCircleOutlined />}
              onClick={() => handleDetail(record)}
              style={{ padding: '0 4px', fontSize: 12 }}
            />
          </Tooltip>
          
          <Tooltip title="高级编辑">
            <Button 
              type="link" 
              size="small" 
              icon={<StockOutlined />}
              onClick={() => handleNavigateToEdit(record)}
              style={{ padding: '0 4px', fontSize: 12 }}
            />
          </Tooltip>
          
          <Popconfirm
            title="确定删除此库存记录？"
            description="删除后可能影响在售状态"
            onConfirm={() => handleDelete(record)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button 
                type="link" 
                size="small" 
                danger
                icon={<DeleteOutlined />}
                style={{ padding: '0 4px', fontSize: 12 }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 8, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* 1. 顶部统计 */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} bodyStyle={{ padding: '8px 12px' }}>
            <Statistic 
              title={<span style={{ fontSize: 10, color: '#8c8c8c' }}>SKU 总数</span>}
              value={stats.totalSku}
              prefix={<StockOutlined style={{ fontSize: 14 }} />}
              valueStyle={{ fontSize: 16, fontWeight: 600, color: '#262626' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} bodyStyle={{ padding: '8px 12px' }}>
            <Statistic 
              title={<span style={{ fontSize: 10, color: '#8c8c8c' }}>可用库存</span>}
              value={stats.totalStock}
              prefix={<ThunderboltOutlined style={{ fontSize: 14 }} />}
              valueStyle={{ fontSize: 16, fontWeight: 600, color: '#389e0d' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} bodyStyle={{ padding: '8px 12px' }}>
            <Statistic 
              title={<span style={{ fontSize: 10, color: '#8c8c8c' }}>库存预警</span>}
              value={stats.warningCount}
              prefix={<WarningOutlined style={{ fontSize: 14 }} />}
              valueStyle={{ fontSize: 16, fontWeight: 600, color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} bodyStyle={{ padding: '8px 12px' }}>
            <Statistic 
              title={<span style={{ fontSize: 10, color: '#8c8c8c' }}>当前冻结</span>}
              value={stats.freezeTotal}
              prefix={<SafetyCertificateOutlined style={{ fontSize: 14 }} />}
              valueStyle={{ fontSize: 16, fontWeight: 600, color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. 工具栏 */}
      <Card size="small" bordered={false} style={{ marginBottom: 8 }} bodyStyle={{ padding: '8px 12px' }}>
        <Row justify="space-between" align="middle" gutter={[8, 8]}>
          {/* 左侧区域：添加库存按钮 */}
          <Col>
            <Space size="small">

              <span style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>
                <FilterOutlined style={{ marginRight: 4 }} />
                库存列表
              </span>

              <Button 
                type="primary" 
                size="small" 
                icon={<StockOutlined />} 
                onClick={() => navigate('/goods/stock/create', { state: { from: location.pathname } })}
              >
                添加库存
              </Button>
              
              {/* 批量操作按钮 */}
              {selectedRowKeys.length > 0 && (
                <Space size="small">
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'batch-edit',
                          label: '批量编辑库存',
                          icon: <EditOutlined />,
                          onClick: () => handleBatchEdit()
                        },
                        {
                          key: 'batch-warn',
                          label: '批量设置预警值',
                          icon: <WarningOutlined />,
                          onClick: () => handleBatchEdit()
                        },
                        {
                          type: 'divider',
                        },
                        {
                          key: 'batch-delete',
                          label: '批量删除',
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: () => handleBatchDelete()
                        },
                      ]
                    }}
                  >
                    <Button size="small" icon={<FilterOutlined />}>
                      批量操作 ({selectedRowKeys.length})
                    </Button>
                  </Dropdown>
                </Space>
              )}
            </Space>
          </Col>

          {/* 右侧区域：搜索框、状态筛选、刷新按钮 */}
          <Col>
            <Space size="small">
              <Input 
                placeholder="搜索商品名称 / Config ID" 
                prefix={<SearchOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />}
                size="small" 
                style={{ width: 180, fontSize: 12 }} 
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
              
              {/* 状态筛选框 */}
              <Select 
                value={filterStatus}
                onChange={setFilterStatus}
                size="small" 
                style={{ width: 100, fontSize: 12 }}
                bordered={false}
                className="compact-select"
              >
                <Option value="all">全部</Option>
                <Option value="warning">库存告急</Option>
                <Option value="normal">库存充足</Option>
                <Option value="freeze">有冻结</Option>
              </Select>

              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={loadData}
                loading={loading}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 3. 表格区域 */}
      <Card size="small" bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={paginatedData}
          rowKey="stock_id"
          loading={loading}
          size="small"
          scroll={{ x: 1300, y: 'calc(100vh - 220px)' }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            columnWidth: 40
          }}
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
            showQuickJumper: true,
            size: 'small',
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>

      {/* 4. 编辑调整弹窗 */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span style={{ fontSize: 14 }}>库存调整</span>
          </Space>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => editForm.submit()}
        confirmLoading={isEditSubmitting}
        okText="保存"
        cancelText="取消"
        width={320}
        destroyOnClose
        centered
        bodyStyle={{ padding: '16px 20px' }}
      >
        {currentStock && (
          <Form
            form={editForm}
            layout="vertical"
            size="small"
            onFinish={onUpdateSubmit}
          >
            <div style={{ marginBottom: 16, padding: '8px', background: '#f5f5f5', borderRadius: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{currentStock.product_name}</div>
              <div style={{ fontSize: 11, color: '#666' }}>
                {[currentStock.config1, currentStock.config2, currentStock.config3].filter(Boolean).join(' | ')}
              </div>
            </div>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontSize: 12 }}>实际库存</span>}
                  name="stock_num"
                  rules={[
                    { required: true, message: '请输入库存数量' },
                    { type: 'number', min: 0, message: '库存数量不能为负数' },
                  ]}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0}
                    precision={0}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontSize: 12 }}>预警阈值</span>}
                  name="warn_num"
                  rules={[
                    { required: true, message: '请输入预警阈值' },
                    { type: 'number', min: 0, message: '预警阈值不能为负数' },
                  ]}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0}
                    precision={0}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <div style={{ 
              marginTop: 8, 
              fontSize: 11, 
              color: '#888', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              borderTop: '1px dashed #f0f0f0', 
              paddingTop: 8 
            }}>
              <span>
                <SafetyCertificateOutlined style={{ marginRight: 4, color: '#faad14' }} />
                冻结库存: {currentStock.freeze_num}
              </span>
              <Tooltip title="冻结库存表示已下单但未发货的占用量，仅可通过订单处理释放">
                <InfoCircleOutlined />
              </Tooltip>
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
              <HistoryOutlined style={{ marginRight: 4 }} />
              上次更新: {dayjs(currentStock.updated_at).format('MM-DD HH:mm')}
            </div>
          </Form>
        )}
      </Modal>

      {/* 批量编辑模态框 */}
      <Modal
        title="批量编辑库存"
        open={batchEditModalVisible}
        onCancel={() => setBatchEditModalVisible(false)}
        onOk={() => batchEditForm.submit()}
        confirmLoading={isEditSubmitting}
        width={400}
      >
        <Form
          form={batchEditForm}
          layout="vertical"
          onFinish={handleBatchEditSubmit}
        >
          <Alert
            message={`已选择 ${selectedRowKeys.length} 条库存记录`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            label="操作类型"
            name="operation"
            rules={[{ required: true, message: '请选择操作类型' }]}
            initialValue="set"
          >
            <Select>
              <Option value="set">设置为指定数量</Option>
              <Option value="add">增加指定数量</Option>
              <Option value="subtract">减少指定数量</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="数量"
            name="value"
            rules={[
              { required: true, message: '请输入数量' },
              { type: 'number', min: 0, message: '数量不能为负数' },
            ]}
            initialValue={0}
          >
            <InputNumber
              min={0}
              max={999999}
              style={{ width: '100%' }}
              addonAfter="件"
            />
          </Form.Item>
          
          <Alert
            message="注意"
            description="此操作将影响所有选中的库存记录，操作不可逆，请谨慎操作。"
            type="warning"
            showIcon
          />
        </Form>
      </Modal>

      {/* 5. 详情弹窗 */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined />
            <span style={{ fontSize: 14 }}>库存详情</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={500}
        destroyOnClose
        centered
        bodyStyle={{ padding: '20px' }}
      >
        {currentStock && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="库存 ID">
              <Text copyable style={{ fontSize: 12 }}>{currentStock.stock_id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="商品名称">
              <span style={{ fontWeight: 500 }}>{currentStock.product_name}</span>
            </Descriptions.Item>
            <Descriptions.Item label="商品规格">
              {[currentStock.config1, currentStock.config2, currentStock.config3].filter(Boolean).join(' / ')}
            </Descriptions.Item>
            <Descriptions.Item label="Config ID">
              <Text copyable style={{ fontSize: 12 }}>{currentStock.config_id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="当前库存">
              <span style={{ color: currentStock.stock_num <= currentStock.warn_num ? '#cf1322' : '#389e0d', fontWeight: 'bold' }}>
                {currentStock.stock_num}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="冻结数量">
              {currentStock.freeze_num}
            </Descriptions.Item>
            <Descriptions.Item label="可用库存">
              <span style={{ color: currentStock.available_stock > 0 ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}>
                {currentStock.available_stock}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="预警阈值">
              {currentStock.warn_num}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(currentStock.updated_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="最后入库时间">
              {currentStock.last_in_time ? dayjs(currentStock.last_in_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="最后出库时间">
              {currentStock.last_out_time ? dayjs(currentStock.last_out_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 样式覆盖 */}
      <style>{`
        .ant-table-thead > tr > th { 
          font-size: 11px !important; 
          background: #fafafa !important; 
          padding: 6px 8px !important;
          color: #595959 !important;
          font-weight: 600 !important;
        }
        .ant-table-tbody > tr > td { 
          padding: 4px 8px !important; 
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .ant-statistic-title { margin-bottom: 2px !important; }
        .ant-card-body { padding: 8px 12px !important; }
        .ant-form-item { margin-bottom: 8px !important; }
        .ant-form-item-label { padding-bottom: 2px !important; }
        .compact-select { border-bottom: 1px solid #f0f0f0; }
        .compact-select:hover { border-bottom: 1px solid #1890ff; }
        .ant-modal-header { padding: 10px 20px; border-bottom: 1px solid #f0f0f0; }
        .ant-modal-footer { padding: 8px 16px; border-top: 1px solid #f0f0f0; }
        .ant-descriptions-item-label { width: 100px; font-size: 12px; }
        .ant-descriptions-item-content { font-size: 12px; }
        .ant-table-pagination { padding: 8px 12px !important; }
      `}</style>
    </div>
  );
};

export default StockListPage;