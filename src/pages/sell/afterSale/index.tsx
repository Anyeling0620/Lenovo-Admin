import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Space, Tag, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { getAfterSales } from '../../../services/api';
import type { AfterSaleResponse, AfterSaleStatus } from '../../../services/api-type';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { mockAfterSales } from '../mockData';
import dayjs from 'dayjs';

const { Option } = Select;

const AfterSaleManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AfterSaleResponse[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadAfterSales = async () => {
    setLoading(true);
    try {
      const afterSales = await getAfterSales();
      setData(afterSales);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      // API拉取失败时使用模拟数据
      setData(mockAfterSales);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAfterSales();
  }, []);

  const getStatusTag = (status: AfterSaleStatus) => {
    const statusMap: Record<AfterSaleStatus, { color: string; text: string }> = {
      '申请中': { color: 'orange', text: '申请中' },
      '已退款': { color: 'green', text: '已退款' },
      '已同意': { color: 'blue', text: '已同意' },
      '已拒绝': { color: 'red', text: '已拒绝' },
      '已寄回': { color: 'cyan', text: '已寄回' },
      '已寄出': { color: 'purple', text: '已寄出' },
      '已完成': { color: 'green', text: '已完成' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string }> = {
      '退货': { color: 'red' },
      '换货': { color: 'blue' },
      '退款': { color: 'orange' },
    };
    const config = typeMap[type] || { color: 'default' };
    return <Tag color={config.color}>{type}</Tag>;
  };

  const filteredData = data.filter((item) => {
    const matchKeyword = !searchKeyword || 
      item.after_sale_no.includes(searchKeyword) || 
      item.order_id.includes(searchKeyword);
    const matchStatus = !statusFilter || item.status === statusFilter;
    return matchKeyword && matchStatus;
  });

  const columns: ColumnsType<AfterSaleResponse> = [
    {
      title: '售后单号',
      dataIndex: 'after_sale_no',
      key: 'after_sale_no',
      width: 150,
      fixed: 'left',
    },
    {
      title: '订单ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 120,
    },
    {
      title: '售后类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '售后状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AfterSaleStatus) => getStatusTag(status),
      filters: [
        { text: '申请中', value: '申请中' },
        { text: '已退款', value: '已退款' },
        { text: '已同意', value: '已同意' },
        { text: '已拒绝', value: '已拒绝' },
        { text: '已寄回', value: '已寄回' },
        { text: '已寄出', value: '已寄出' },
        { text: '已完成', value: '已完成' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 250,
      ellipsis: true,
    },
    {
      title: '申请时间',
      dataIndex: 'apply_time',
      key: 'apply_time',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Link to={`/after-sale/handle/${record.after_sale_id}`}>
            <Tooltip title="处理售后">
              <Button type="link" icon={<EditOutlined />} size="small">
                处理
              </Button>
            </Tooltip>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '8px' }}>
      <Card
        title="售后管理"
        extra={
          <Space>
            <Input
              placeholder="搜索售后单号或订单ID"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              allowClear
            >
              <Option value="申请中">申请中</Option>
              <Option value="已退款">已退款</Option>
              <Option value="已同意">已同意</Option>
              <Option value="已拒绝">已拒绝</Option>
              <Option value="已寄回">已寄回</Option>
              <Option value="已寄出">已寄出</Option>
              <Option value="已完成">已完成</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadAfterSales}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="after_sale_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AfterSaleManagement;

