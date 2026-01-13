import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Space, Tag, Popconfirm, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, SendOutlined, CheckOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { getOrders, cancelOrder, setOrderPendingShip, setOrderPendingReceive } from '../../../services/api';
import type { OrderListItem } from '../../../services/api-type';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { mockOrders } from '../mockData';
import dayjs from 'dayjs';

const { Option } = Select;

const OrderManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrderListItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const orders = await getOrders();
      setData(orders);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      // API拉取失败时使用模拟数据
      setData(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      globalMessage.success('订单已取消');
      loadOrders();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handlePendingShip = async (orderId: string) => {
    try {
      await setOrderPendingShip(orderId);
      globalMessage.success('订单已设置为待发货');
      loadOrders();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handlePendingReceive = async (orderId: string) => {
    try {
      await setOrderPendingReceive(orderId);
      globalMessage.success('订单已设置为待收货');
      loadOrders();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      '已取消': { color: 'red', text: '已取消' },
      '待支付': { color: 'orange', text: '待支付' },
      '已支付': { color: 'blue', text: '已支付' },
      '待发货': { color: 'cyan', text: '待发货' },
      '已发货': { color: 'purple', text: '已发货' },
      '待收货': { color: 'geekblue', text: '待收货' },
      '已收货': { color: 'green', text: '已收货' },
      '已完成': { color: 'green', text: '已完成' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const filteredData = data.filter((order) => {
    const matchKeyword = !searchKeyword || 
      order.order_no.includes(searchKeyword) || 
      order.user_account.includes(searchKeyword);
    const matchStatus = !statusFilter || order.status === statusFilter;
    return matchKeyword && matchStatus;
  });

  const columns: ColumnsType<OrderListItem> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 150,
      fixed: 'left',
    },
    {
      title: '用户账号',
      dataIndex: 'user_account',
      key: 'user_account',
      width: 120,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: '已取消', value: '已取消' },
        { text: '待支付', value: '待支付' },
        { text: '已支付', value: '已支付' },
        { text: '待发货', value: '待发货' },
        { text: '已发货', value: '已发货' },
        { text: '待收货', value: '待收货' },
        { text: '已收货', value: '已收货' },
        { text: '已完成', value: '已完成' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '商品信息',
      key: 'items',
      width: 200,
      render: (_, record) => (
        <div>
          {record.items.map((item) => (
            <div key={item.order_item_id} style={{ fontSize: '12px' }}>
              {item.name} × {item.quantity}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '应支付金额',
      dataIndex: 'pay_amount',
      key: 'pay_amount',
      width: 100,
      render: (amount: number | string) => `¥${Number(amount).toFixed(2)}`,
    },
    {
      title: '待支付金额',
      dataIndex: 'actual_pay_amount',
      key: 'actual_pay_amount',
      width: 100,
      render: (amount: number | string) => `¥${Number(amount).toFixed(2)}`,
    },
    {
      title: '支付时间',
      dataIndex: 'pay_time',
      key: 'pay_time',
      width: 160,
      render: (time: string | null) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Link to={`/order/detail/${record.order_id}`}>
            <Tooltip title="查看详情">
              <Button type="link" icon={<EyeOutlined />} size="small">
                详情
              </Button>
            </Tooltip>
          </Link>
          {/* 已支付状态：可以确认订单（改为待发货）或取消 */}
          {record.status === '已支付' && (
            <>
              <Popconfirm
                title="确定要确认订单并设置为待发货吗？"
                onConfirm={() => handlePendingShip(record.order_id)}
              >
                <Button type="link" icon={<CheckOutlined />} size="small">
                  确认订单
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确定要取消这个订单吗？"
                onConfirm={() => handleCancel(record.order_id)}
              >
                <Button type="link" danger size="small">
                  取消
                </Button>
              </Popconfirm>
            </>
          )}
          {/* 待发货状态：可以发货（改为已发货） */}
          {record.status === '待发货' && (
            <Link to={`/order/ship/${record.order_id}`}>
              <Tooltip title="发货">
                <Button type="link" icon={<SendOutlined />} size="small">
                  发货
                </Button>
              </Tooltip>
            </Link>
          )}
          {/* 已发货状态：可以设置为待收货（到达） */}
          {record.status === '已发货' && (
            <Popconfirm
              title="确定要将订单设置为待收货（到达）吗？"
              onConfirm={() => handlePendingReceive(record.order_id)}
            >
              <Button type="link" icon={<CheckOutlined />} size="small">
                到达
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '8px' }}>
      <Card
        title="订单管理"
        extra={
          <Space>
            <Input
              placeholder="搜索订单号或用户账号"
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
              <Option value="已取消">已取消</Option>
              <Option value="待支付">待支付</Option>
              <Option value="已支付">已支付</Option>
              <Option value="待发货">待发货</Option>
              <Option value="已发货">已发货</Option>
              <Option value="待收货">待收货</Option>
              <Option value="已收货">已收货</Option>
              <Option value="已完成">已完成</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadOrders}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="order_id"
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

export default OrderManagement;


