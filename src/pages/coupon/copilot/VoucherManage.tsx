import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Tag, Space, Button, Typography, Row, Col, Statistic, Divider, Descriptions, Flex, Input } from 'antd';
import { ReloadOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnsType } from 'antd/es/table';
import { getVouchers, getVoucherUsers, issueVoucherApi } from '../../../services/api';
import type { VoucherResponse, VoucherUserResponse, CouponStatsResponse } from '../../../services/api-type';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { globalMessage } from '../../../utils/globalMessage';
import { marketingMock } from '../../../services/marketing-mock';

const { Title, Text } = Typography;

const issueSchema = z.object({
  userIds: z.string().min(1, '请输入用户ID，逗号分隔'),
});

type IssueForm = z.infer<typeof issueSchema>;

const dateText = (value?: string | null) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-');

const VoucherManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [users, setUsers] = useState<VoucherUserResponse[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [statsMap, setStatsMap] = useState<Record<string, CouponStatsResponse>>({});

  const { control, handleSubmit, reset } = useForm<IssueForm>({
    resolver: zodResolver(issueSchema),
    defaultValues: { userIds: '' },
  });

  const summary = useMemo(() => {
    const total = vouchers.length;
    const soonExpire = vouchers.filter(v => dayjs(v.end_time).diff(dayjs(), 'day') <= 7).length;
    const maxAmount = vouchers.reduce((m, v) => Math.max(m, Number(v.original_amount) || 0), 0);
    return { total, soonExpire, maxAmount };
  }, [vouchers]);

  const loadBase = async () => {
    setLoading(true);
    try {
      const list = await getVouchers();
      setVouchers(list);
      setSelectedId(list[0]?.voucher_id || '');
      await loadVoucherStats(list);
      setUsingMock(false);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      const list = await marketingMock.listVouchers();
      setVouchers(list);
      setSelectedId(list[0]?.voucher_id || '');
      await loadVoucherStats(list, true);
      setUsingMock(true);
      globalMessage.info('已切换为模拟数据展示');
    } finally {
      setLoading(false);
    }
  };

  const loadVoucherStats = async (list: VoucherResponse[], preferMock = false) => {
    if (!list.length) {
      setStatsMap({});
      return;
    }
    const fetcher = async (id: string) => {
      if (preferMock) return marketingMock.listVoucherUsers(id);
      return getVoucherUsers(id);
    };
    try {
      const results = await Promise.all(list.map(async item => {
        const userList = await fetcher(item.voucher_id);
        const used = userList.filter(u => u.use_up_time || Number(u.remain_amount) === 0).length;
        return [item.voucher_id, { total: userList.length, used, unused: userList.length - used }] as const;
      }));
      const map: Record<string, CouponStatsResponse> = {};
      results.forEach(([id, stat]) => { map[id] = stat; });
      setStatsMap(map);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      const results = await Promise.all(list.map(async item => {
        const userList = await marketingMock.listVoucherUsers(item.voucher_id);
        const used = userList.filter(u => u.use_up_time || Number(u.remain_amount) === 0).length;
        return [item.voucher_id, { total: userList.length, used, unused: userList.length - used }] as const;
      }));
      const map: Record<string, CouponStatsResponse> = {};
      results.forEach(([id, stat]) => { map[id] = stat; });
      setStatsMap(map);
      setUsingMock(true);
    }
  };

  const loadUsers = async (voucherId: string, preferMock = false) => {
    if (!voucherId) return;
    setUserLoading(true);
    try {
      const data = await (preferMock ? marketingMock.listVoucherUsers(voucherId) : getVoucherUsers(voucherId));
      setUsers(data);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      const data = await marketingMock.listVoucherUsers(voucherId);
      setUsers(data);
      setUsingMock(true);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadUsers(selectedId, usingMock);
    }
  }, [selectedId]);

  const onIssue = handleSubmit(async values => {
    if (!selectedId) {
      globalMessage.warning('请先选择代金券');
      return;
    }
    const userIds = values.userIds.split(',').map(s => s.trim()).filter(Boolean);
    if (!userIds.length) {
      globalMessage.warning('用户ID不能为空');
      return;
    }
    try {
      await issueVoucherApi(selectedId, { user_ids: userIds });
      globalMessage.success('发放成功');
      await Promise.all([loadUsers(selectedId), loadVoucherStats(vouchers)]);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      await marketingMock.issueVoucher(selectedId, { user_ids: userIds });
      globalMessage.success('已在模拟环境发放');
      await Promise.all([loadUsers(selectedId, true), loadVoucherStats(vouchers, true)]);
    }
    reset({ userIds: '' });
  });

  const columns: ColumnsType<VoucherResponse> = [
    { title: '标题', dataIndex: 'title', width: 220, ellipsis: true },
    { title: '面额', dataIndex: 'original_amount', width: 100, render: v => `¥${v}` },
    { title: '有效期', key: 'time', render: (_, r) => `${dateText(r.start_time)} - ${dateText(r.end_time)}` },
    { title: '已领取', key: 'total', width: 90, render: (_, r) => statsMap[r.voucher_id]?.total ?? '-' },
    { title: '已使用', key: 'used', width: 90, render: (_, r) => statsMap[r.voucher_id]?.used ?? '-' },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" type={selectedId === record.voucher_id ? 'primary' : 'link'} onClick={() => setSelectedId(record.voucher_id)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <Title level={4} style={{ margin: 0 }}>代金券管理</Title>
        <Space>
          {usingMock && <Tag color="orange">模拟数据</Tag>}
          <Button icon={<ReloadOutlined />} size="small" onClick={loadBase}>刷新</Button>
          <Link to="/coupon/cash/create">
            <Button type="primary" icon={<PlusOutlined />} size="small">新建代金券</Button>
          </Link>
        </Space>
      </Flex>

      <Row gutter={8}>
        <Col span={8}>
          <Card size="small" bodyStyle={{ padding: 12 }}>
            <Statistic title="代金券总数" value={summary.total} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" bodyStyle={{ padding: 12 }}>
            <Statistic title="7天内到期" value={summary.soonExpire} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" bodyStyle={{ padding: 12 }}>
            <Statistic title="最高面额" value={`¥${summary.maxAmount}`} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      <Card size="small" bodyStyle={{ padding: 12 }}>
        <Table<VoucherResponse>
          rowKey="voucher_id"
          loading={loading}
          columns={columns}
          dataSource={vouchers}
          size="small"
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </Card>

      <Card size="small" title="代金券详情" bodyStyle={{ padding: 12 }} loading={userLoading}>
        {selectedId ? (
          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            {(() => {
              const current = vouchers.find(v => v.voucher_id === selectedId);
              if (!current) return <Text type="secondary">未找到代金券</Text>;
              const stats = statsMap[selectedId];
              return (
                <>
                  <Descriptions size="small" column={2} bordered>
                    <Descriptions.Item label="标题">{current.title}</Descriptions.Item>
                    <Descriptions.Item label="面额">¥{current.original_amount}</Descriptions.Item>
                    <Descriptions.Item label="有效期">{`${dateText(current.start_time)} - ${dateText(current.end_time)}`}</Descriptions.Item>
                    <Descriptions.Item label="统计">{stats ? `领取 ${stats.total} / 已使用 ${stats.used}` : '加载中'}</Descriptions.Item>
                  </Descriptions>

                  <Divider style={{ margin: '8px 0' }} />

                  <form onSubmit={onIssue} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Controller
                      control={control}
                      name="userIds"
                      render={({ field, fieldState }) => (
                        <div style={{ minWidth: 260 }}>
                          <Input {...field} placeholder="输入用户ID，逗号分隔" prefix={<SendOutlined />} />
                          {fieldState.error && <Text type="danger">{fieldState.error.message}</Text>}
                        </div>
                      )}
                    />
                    <Button type="primary" htmlType="submit" size="small">发放</Button>
                  </form>

                  <Divider style={{ margin: '8px 0' }} />
                </>
              );
            })()}

            <Title level={5} style={{ margin: 0 }}>领取用户</Title>
            <Table<VoucherUserResponse>
              rowKey="user_voucher_id"
              size="small"
              pagination={{ pageSize: 5, showSizeChanger: false }}
              dataSource={users}
              columns={[
                { title: '用户', dataIndex: 'user_account', width: 180 },
                { title: '领取时间', dataIndex: 'get_time', render: value => dateText(value) },
                { title: '使用时间', dataIndex: 'use_up_time', render: value => dateText(value) },
                { title: '剩余额度', dataIndex: 'remain_amount', width: 120, render: v => `¥${v}` },
                { title: '状态', key: 'status', width: 90, render: (_, record) => record.use_up_time || Number(record.remain_amount) === 0 ? <Tag color="green">已用完</Tag> : <Tag>未用完</Tag> },
              ]}
            />
          </Space>
        ) : (
          <Text type="secondary">请选择一条代金券查看详情</Text>
        )}
      </Card>
    </Space>
  );
};

export default VoucherManage;
