import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Tag, Space, Button, Typography, Row, Col, Statistic, Divider, Descriptions, List, Flex, Input, Select } from 'antd';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnsType } from 'antd/es/table';
import {
  getCoupons,
  getCouponCenter,
  getCouponDetailApi,
  getCouponUsers,
  getCouponStats
} from '../../../services/api';
import type {
  CouponCenterResponse,
  CouponResponse,
  CouponStatsResponse,
  CouponUserResponse
} from '../../../services/api-type';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { globalMessage } from '../../../utils/globalMessage';

const { Title, Text } = Typography;

const filterSchema = z.object({
  keyword: z.string().optional(),
  type: z.string().optional(),
  stackable: z.string().optional(),
});

type FilterForm = z.infer<typeof filterSchema>;

const valueFormatter = (record: CouponResponse) => {
  if (record.type.includes('折')) return `${record.discount}折`;
  return `¥${record.amount}`;
};

const dateText = (value?: string | null) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-');

const CouponManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [allCoupons, setAllCoupons] = useState<CouponResponse[]>([]);
  const [centers, setCenters] = useState<CouponCenterResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [detail, setDetail] = useState<CouponResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [users, setUsers] = useState<CouponUserResponse[]>([]);
  const [stats, setStats] = useState<CouponStatsResponse | null>(null);
  const [statsMap, setStatsMap] = useState<Record<string, CouponStatsResponse>>({});

  const { control, handleSubmit, reset } = useForm<FilterForm>(
    {
      resolver: zodResolver(filterSchema),
      defaultValues: { keyword: '', type: '', stackable: '' },
    }
  );

  const loadBaseData = async () => {
    setLoading(true);
    try {
      const [couponList, centerList] = await Promise.all([
        getCoupons(),
        getCouponCenter(),
      ]);
      setCoupons(couponList);
      setAllCoupons(couponList);
      setCenters(centerList);
      setSelectedId(couponList[0]?.coupon_id || '');
      await loadStatsForCoupons(couponList);
      setUsingMock(false);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      setCoupons([]);
      setAllCoupons([]);
      setCenters([]);
      setStatsMap({});
    } finally {
      setLoading(false);
    }
  };

  const loadStatsForCoupons = async (list: CouponResponse[]) => {
    if (!list.length) {
      setStatsMap({});
      return;
    }
    const fetcher = async (couponId: string) => {
      return getCouponStats(couponId);
    };
    try {
      const results = await Promise.all(list.map(async item => {
        const data = await fetcher(item.coupon_id);
        return [item.coupon_id, data] as const;
      }));
      const map: Record<string, CouponStatsResponse> = {};
      results.forEach(([id, data]) => { map[id] = data; });
      setStatsMap(map);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      setStatsMap({});
    }
  };

  const loadDetail = async (couponId: string) => {
    if (!couponId) return;
    setDetailLoading(true);
    try {
      const [couponDetail, couponUsers, couponStats] = await Promise.all([
        getCouponDetailApi(couponId),
        getCouponUsers(couponId),
        getCouponStats(couponId),
      ]);
      setDetail(couponDetail);
      setUsers(couponUsers);
      setStats(couponStats);
      setUsingMock(false);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      setDetail(null);
      setUsers([]);
      setStats(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  const onFilter = handleSubmit(values => {
    const filtered = allCoupons.filter(item => {
      const matchKeyword = values.keyword
        ? item.name.includes(values.keyword) || item.type.includes(values.keyword)
        : true;
      const matchType = values.type ? item.type === values.type : true;
      const matchStack = values.stackable
        ? values.stackable === 'yes'
          ? item.is_stackable
          : !item.is_stackable
        : true;
      return matchKeyword && matchType && matchStack;
    });
    setCoupons(filtered);
  });

  const handleReset = () => {
    reset({ keyword: '', type: '', stackable: '' });
    setCoupons(allCoupons);
  };

  const summary = useMemo(() => {
    const total = coupons.length;
    const stackable = coupons.filter(item => item.is_stackable).length;
    const inCenter = coupons.filter(item => item.center).length;
    const expiringSoon = coupons.filter(item => dayjs(item.expire_time).diff(dayjs(), 'day') <= 7).length;
    return { total, stackable, inCenter, expiringSoon };
  }, [coupons]);

  const columns: ColumnsType<CouponResponse> = [
    { title: '名称', dataIndex: 'name', width: 200, ellipsis: true },
    { title: '类型', dataIndex: 'type', width: 120, render: type => <Tag color="blue">{type}</Tag> },
    { title: '面值', key: 'value', width: 100, render: (_, record) => valueFormatter(record) },
    { title: '门槛', dataIndex: 'threshold', width: 100, render: value => (Number(value) > 0 ? `满${value}可用` : '无门槛') },
    { title: '可叠加', dataIndex: 'is_stackable', width: 90, render: val => val ? <Tag color="green">可叠加</Tag> : <Tag color="default">不可叠加</Tag> },
    { title: '有效期', key: 'time', render: (_, record) => `${dateText(record.start_time)} - ${dateText(record.expire_time)}` },
    { title: '福利中心', key: 'center', width: 180, render: (_, record) => record.center ? (
      <Space direction="vertical" size={0}>
        <Text>总量 {record.center.total_num}</Text>
        <Text type="secondary">限领 {record.center.limit_num} 张</Text>
      </Space>
    ) : <Text type="secondary">未投放</Text> },
    { title: '已领取', key: 'total', width: 90, render: (_, record) => statsMap[record.coupon_id]?.total ?? '-' },
    { title: '已使用', key: 'used', width: 90, render: (_, record) => statsMap[record.coupon_id]?.used ?? '-' },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" type={selectedId === record.coupon_id ? 'primary' : 'link'} onClick={() => setSelectedId(record.coupon_id)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      <Flex
        align="center"
        justify="space-between"
        style={{ position: 'sticky', top: 0, zIndex: 9, background: '#fff', padding: '6px 0' }}
      >
        <Title level={4} style={{ margin: 0 }}>优惠券管理</Title>
        <Space>
          {usingMock && <Tag color="orange">模拟数据</Tag>}
          <Button icon={<ReloadOutlined />} size="small" onClick={loadBaseData}>刷新</Button>
          <Link to="/coupon/manage/create">
            <Button type="primary" icon={<PlusOutlined />} size="small">新建优惠券</Button>
          </Link>
        </Space>
      </Flex>

      <Card size="small" bodyStyle={{ padding: 12 }}>
        <form onSubmit={onFilter} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Controller
            control={control}
            name="keyword"
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ''}
                allowClear
                size="middle"
                placeholder="名称 / 类型关键字"
                style={{ width: 260 }}
              />
            )}
          />
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select
                {...field}
                value={field.value || undefined}
                onChange={value => field.onChange(value)}
                allowClear
                size="middle"
                placeholder="全部类型"
                style={{ minWidth: 160 }}
                options={[
                  { label: '满减', value: '满减' },
                  { label: '折扣', value: '折扣' },
                ]}
              />
            )}
          />
          <Controller
            control={control}
            name="stackable"
            render={({ field }) => (
              <Select
                {...field}
                value={field.value || undefined}
                onChange={value => field.onChange(value)}
                allowClear
                size="middle"
                placeholder="叠加限制"
                style={{ minWidth: 160 }}
                options={[
                  { label: '可叠加', value: 'yes' },
                  { label: '不可叠加', value: 'no' },
                ]}
              />
            )}
          />
          <Space size={6}>
            <Button htmlType="submit" type="primary" size="middle">筛选</Button>
            <Button onClick={handleReset} size="middle">重置</Button>
          </Space>
        </form>
      </Card>

      <Row gutter={8}>
        <Col span={6}>
          <Card size="small" bodyStyle={{ padding: 12 }}>
            <Statistic title="优惠券总数" value={summary.total} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bodyStyle={{ padding: 12 }}>
            <Statistic title="可叠加" value={summary.stackable} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bodyStyle={{ padding: 12 }}>
            <Statistic title="已投放福利中心" value={summary.inCenter} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bodyStyle={{ padding: 12 }}>
            <Statistic title="7天内到期" value={summary.expiringSoon} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      <Card size="small" bodyStyle={{ padding: 12 }}>
        <Table<CouponResponse>
          rowKey="coupon_id"
          loading={loading}
          columns={columns}
          dataSource={coupons}
          size="small"
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </Card>

      <Row gutter={8}>
        <Col span={24}>
          <Card size="small" title="优惠券详情" loading={detailLoading} bodyStyle={{ padding: 12 }}>
            {detail ? (
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                <Descriptions size="small" column={2} bordered>
                  <Descriptions.Item label="名称">{detail.name}</Descriptions.Item>
                  <Descriptions.Item label="类型">{detail.type}</Descriptions.Item>
                  <Descriptions.Item label="面值">{valueFormatter(detail)}</Descriptions.Item>
                  <Descriptions.Item label="门槛">{Number(detail.threshold) > 0 ? `满${detail.threshold}可用` : '无门槛'}</Descriptions.Item>
                  <Descriptions.Item label="可叠加">{detail.is_stackable ? '是' : '否'}</Descriptions.Item>
                  <Descriptions.Item label="有效期">{`${dateText(detail.start_time)} - ${dateText(detail.expire_time)}`}</Descriptions.Item>
                  <Descriptions.Item label="福利中心">{detail.center ? `${detail.center.total_num} 张 / 限领 ${detail.center.limit_num}` : '未投放'}</Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: '8px 0' }} />

                <Flex gap={12} wrap="wrap">
                  <Card size="small" style={{ flex: '1 0 160px' }} bodyStyle={{ padding: 10 }}>
                    <Statistic title="发券总量" value={stats?.total ?? 0} valueStyle={{ fontSize: 18 }} />
                  </Card>
                  <Card size="small" style={{ flex: '1 0 160px' }} bodyStyle={{ padding: 10 }}>
                    <Statistic title="已使用" value={stats?.used ?? 0} valueStyle={{ fontSize: 18 }} />
                  </Card>
                  <Card size="small" style={{ flex: '1 0 160px' }} bodyStyle={{ padding: 10 }}>
                    <Statistic title="未使用" value={stats?.unused ?? 0} valueStyle={{ fontSize: 18 }} />
                  </Card>
                </Flex>

                <Divider style={{ margin: '8px 0' }} />

                <Title level={5} style={{ margin: 0 }}>领取用户</Title>
                <Table<CouponUserResponse>
                  rowKey="user_coupon_id"
                  size="small"
                  pagination={{ pageSize: 5, showSizeChanger: false }}
                  dataSource={users}
                  columns={[
                    { title: '用户', dataIndex: 'user_account', width: 180 },
                    { title: '状态', dataIndex: 'status', width: 90, render: status => <Tag color={status === 'USED' ? 'green' : 'default'}>{status}</Tag> },
                    { title: '领取时间', dataIndex: 'receive_time', render: value => dateText(value) },
                    { title: '使用时间', dataIndex: 'use_time', render: value => dateText(value) },
                    { title: '订单', dataIndex: 'order_id', width: 120, render: value => value || '-' },
                  ]}
                />
              </Space>
            ) : (
              <Text type="secondary">选择一条优惠券查看详情</Text>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default CouponManage;
