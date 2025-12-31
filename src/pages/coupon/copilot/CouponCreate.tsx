import React, { useState } from 'react';
import { Card, Space, Typography, Input, Select, DatePicker, Switch, Button, Flex } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { createCouponApi } from '../../../services/api';
import type { CouponCreateRequest } from '../../../services/api-type';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { globalMessage } from '../../../utils/globalMessage';
import { marketingMock } from '../../../services/marketing-mock';

const { Title, Text } = Typography;

const schema = z.object({
  name: z.string().min(1, '请输入优惠券名称'),
  type: z.enum(['满减', '折扣']),
  amount: z.string().optional(),
  discount: z.string().optional(),
  threshold: z.string().optional(),
  timeRange: z.tuple([z.date(), z.date()]),
  is_stackable: z.boolean().default(false),
  condition: z.string().optional(),
  scope: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.type === '折扣券' && !values.discount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '请输入折扣', path: ['discount'] });
  }
  if (values.type !== '折扣券' && !values.amount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '请输入面值', path: ['amount'] });
  }
});

type FormValues = z.infer<typeof schema>;

const CouponCreate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState('');

  const { control, handleSubmit, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: '满减',
      amount: '',
      discount: '',
      threshold: '',
      timeRange: [new Date(), dayjs().add(30, 'day').toDate()],
      is_stackable: true,
      condition: '',
      scope: '',
    },
  });

  const currentType = watch('type');

  const onSubmit = handleSubmit(async values => {
    setLoading(true);
    const payload: CouponCreateRequest = {
      name: values.name,
      type: values.type,
      amount: values.type === '折扣券' ? 0 : Number(values.amount || 0),
      discount: values.type === '折扣券' ? Number(values.discount || 0) : 0,
      threshold: Number(values.threshold || 0),
      condition: values.condition,
      scope: values.scope,
      start_time: values.timeRange[0].toISOString(),
      expire_time: values.timeRange[1].toISOString(),
      is_stackable: values.is_stackable,
    };

    try {
      const res = await createCouponApi(payload);
      setCreatedId(res.coupon_id);
      globalMessage.success('创建成功');
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      const res = await marketingMock.createCoupon(payload);
      setCreatedId(res.coupon_id);
      globalMessage.success('已在模拟环境创建');
    } finally {
      setLoading(false);
    }
  });

  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <Title level={4} style={{ margin: 0 }}>新建优惠券</Title>
        <Space>
          {createdId && <Text type="secondary">已创建ID: {createdId}</Text>}
          <Link to="/coupon/manage">
            <Button size="small">返回列表</Button>
          </Link>
        </Space>
      </Flex>

      <Card size="small" bodyStyle={{ padding: 12 }}>
        <form onSubmit={onSubmit}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Flex gap={12} wrap="wrap">
              <div style={{ minWidth: 260 }}>
                <Text>名称</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <>
                      <Input {...field} placeholder="例如：新人满减50" size="middle" />
                      {fieldState.error && <Text type="danger">{fieldState.error.message}</Text>}
                    </>
                  )}
                />
              </div>
              <div style={{ minWidth: 200 }}>
                <Text>类型</Text>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }} options={[
                      { label: '满减', value: '满减' },
                      { label: '折扣', value: '折扣' },
                    ]} />
                  )}
                />
              </div>
              <div style={{ minWidth: 200 }}>
                <Text>{currentType === '折扣券' ? '折扣（如9代表9折）' : '面值（元）'}</Text>
                <Controller
                  control={control}
                  name={currentType === '折扣券' ? 'discount' : 'amount'}
                  render={({ field, fieldState }) => (
                    <>
                      <Input {...field} placeholder={currentType === '折扣券' ? '请输入折扣数' : '请输入金额'} />
                      {fieldState.error && <Text type="danger">{fieldState.error.message}</Text>}
                    </>
                  )}
                />
              </div>
              <div style={{ minWidth: 200 }}>
                <Text>使用门槛</Text>
                <Controller
                  control={control}
                  name="threshold"
                  render={({ field }) => (
                    <Input {...field} placeholder="0 表示无门槛" />
                  )}
                />
              </div>
              <div style={{ minWidth: 260 }}>
                <Text>有效期</Text>
                <Controller
                  control={control}
                  name="timeRange"
                  render={({ field, fieldState }) => (
                    <>
                      <DatePicker.RangePicker
                        value={[dayjs(field.value[0]), dayjs(field.value[1])]} // 保持受控
                        onChange={(dates) => field.onChange(dates && dates[0] && dates[1] ? [dates[0].toDate(), dates[1].toDate()] : field.value)}
                        showTime
                        style={{ width: '100%' }}
                      />
                      {fieldState.error && <Text type="danger">请选择时间范围</Text>}
                    </>
                  )}
                />
              </div>
              <div style={{ minWidth: 160 }}>
                <Text>可叠加</Text>
                <Controller
                  control={control}
                  name="is_stackable"
                  render={({ field }) => (
                    <Space>
                      <Switch checked={field.value} onChange={field.onChange} />
                      <Text>{field.value ? '允许与其他券叠加' : '不可叠加'}</Text>
                    </Space>
                  )}
                />
              </div>
            </Flex>

            <div>
              <Text>使用条件/说明</Text>
              <Controller
                control={control}
                name="condition"
                render={({ field }) => (
                  <Input.TextArea {...field} placeholder="如：仅限新用户首单" autoSize={{ minRows: 2, maxRows: 4 }} />
                )}
              />
            </div>

            <div>
              <Text>适用范围</Text>
              <Controller
                control={control}
                name="scope"
                render={({ field }) => (
                  <Input.TextArea {...field} placeholder="如：仅限配件类商品" autoSize={{ minRows: 2, maxRows: 4 }} />
                )}
              />
            </div>

            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
              <Link to="/coupon/manage">
                <Button>返回列表</Button>
              </Link>
            </Space>
          </Space>
        </form>
      </Card>
    </Space>
  );
};

export default CouponCreate;
