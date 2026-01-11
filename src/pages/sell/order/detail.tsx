import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Tag, Button, Space, Spin, Popconfirm } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import { getOrderDetailApi, setOrderPendingReceive } from '../../../services/api';
import type { OrderDetailResponse } from '../../../services/api-type';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { mockOrderDetail } from '../mockData';

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetailResponse | null>(null);

  const loadOrderDetail = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await getOrderDetailApi(orderId);
      setOrderDetail(data);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      // API拉取失败时使用模拟数据
      setOrderDetail(mockOrderDetail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!orderDetail) {
    return null;
  }

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

  const itemColumns = [
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '配置1',
      dataIndex: 'config1',
      key: 'config1',
    },
    {
      title: '配置2',
      dataIndex: 'config2',
      key: 'config2',
    },
    {
      title: '配置3',
      dataIndex: 'config3',
      key: 'config3',
      render: (text: string | null) => text || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
  ];

  return (
    <div style={{ padding: '8px' }}>
      <Card
        title={
          <Space>
            <ArrowLeftOutlined />
            <Link to="/order/manage" style={{ color: 'inherit' }}>
              返回
            </Link>
            <span style={{ marginLeft: '8px' }}>订单详情</span>
          </Space>
        }
      >
        <Descriptions column={2} size="small" bordered style={{ marginBottom: '16px' }}>
          <Descriptions.Item label="订单号">{orderDetail.order_no}</Descriptions.Item>
          <Descriptions.Item label="订单状态">{getStatusTag(orderDetail.status)}</Descriptions.Item>
          <Descriptions.Item label="支付金额">¥{Number(orderDetail.pay_amount).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="实付金额">¥{Number(orderDetail.actual_pay_amount).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="支付方式">{orderDetail.pay_type || '-'}</Descriptions.Item>
          <Descriptions.Item label="物流单号">{orderDetail.logistics_no || '-'}</Descriptions.Item>
          <Descriptions.Item label="收货人">{orderDetail.receiver}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{orderDetail.phone}</Descriptions.Item>
          <Descriptions.Item label="收货地址" span={2}>{orderDetail.address}</Descriptions.Item>
        </Descriptions>

        <Card title="商品信息" style={{ marginTop: '16px' }}>
          <Table
            columns={itemColumns}
            dataSource={orderDetail.items}
            rowKey="order_item_id"
            pagination={false}
            size="small"
          />
        </Card>

        {(orderDetail.status === '待发货' || orderDetail.status === '已发货') && (
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            {orderDetail.status === '待发货' && (
              <Link to={`/order/ship/${orderDetail.order_id}`}>
                <Button type="primary">发货</Button>
              </Link>
            )}
            {orderDetail.status === '已发货' && (
              <Popconfirm
                title="确定要将订单设置为待收货（到达）吗？"
                onConfirm={async () => {
                  try {
                    await setOrderPendingReceive(orderDetail.order_id);
                    globalMessage.success('订单已设置为待收货');
                    loadOrderDetail();
                  } catch (error) {
                    globalErrorHandler.handle(error, globalMessage.error);
                  }
                }}
              >
                <Button type="primary">到达</Button>
              </Popconfirm>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrderDetail;

