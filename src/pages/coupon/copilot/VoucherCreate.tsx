import React, { useState } from 'react';
import { Card, Space, Typography, Input, DatePicker, Button, Flex } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { createVoucherApi } from '../../../services/api';
import type { VoucherCreateRequest } from '../../../services/api-type';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { globalMessage } from '../../../utils/globalMessage';
import { marketingMock } from '../../../services/marketing-mock';

const { Title, Text } = Typography;

const schema = z.object({
  title: z.string().min(1, '请输入标题'),
  original_amount: z.string().min(1, '请输入面额'),
  timeRange: z.tuple([z.date(), z.date()]),
  description: z.string().optional(),
  remark: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const VoucherCreate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState('');

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      original_amount: '',
      timeRange: [new Date(), dayjs().add(30, 'day').toDate()],
      description: '',
      remark: '',
    },
  });

  const onSubmit = handleSubmit(async values => {
    setLoading(true);
    const payload: VoucherCreateRequest = {
      title: values.title,
      original_amount: Number(values.original_amount || 0),
      start_time: values.timeRange[0].toISOString(),
      end_time: values.timeRange[1].toISOString(),
      description: values.description,
      remark: values.remark,
    };
    try {
      const res = await createVoucherApi(payload);
      setCreatedId(res.voucher_id);
      globalMessage.success('创建成功');
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      const res = await marketingMock.createVoucher(payload);
      setCreatedId(res.voucher_id);
      globalMessage.success('已在模拟环境创建');
    } finally {
      setLoading(false);
    }
  });

  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <Title level={4} style={{ margin: 0 }}>新建代金券</Title>
        <Space>
          {createdId && <Text type="secondary">已创建ID: {createdId}</Text>}
          <Link to="/coupon/cash">
            <Button size="small">返回列表</Button>
          </Link>
        </Space>
      </Flex>

      <Card size="small" bodyStyle={{ padding: 12 }}>
        <form onSubmit={onSubmit}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Flex gap={12} wrap="wrap">
              <div style={{ minWidth: 280 }}>
                <Text>标题</Text>
                <Controller
                  control={control}
                  name="title"
                  render={({ field, fieldState }) => (
                    <>
                      <Input {...field} placeholder="例如：满500减100 代金券" />
                      {fieldState.error && <Text type="danger">{fieldState.error.message}</Text>}
                    </>
                  )}
                />
              </div>
              <div style={{ minWidth: 200 }}>
                <Text>面额（元）</Text>
                <Controller
                  control={control}
                  name="original_amount"
                  render={({ field, fieldState }) => (
                    <>
                      <Input {...field} placeholder="请输入金额" />
                      {fieldState.error && <Text type="danger">{fieldState.error.message}</Text>}
                    </>
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
                        value={[dayjs(field.value[0]), dayjs(field.value[1])]}
                        onChange={dates => field.onChange(dates && dates[0] && dates[1] ? [dates[0].toDate(), dates[1].toDate()] : field.value)}
                        showTime
                        style={{ width: '100%' }}
                      />
                      {fieldState.error && <Text type="danger">请选择时间范围</Text>}
                    </>
                  )}
                />
              </div>
            </Flex>

            <div>
              <Text>描述</Text>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <Input.TextArea {...field} placeholder="可选：代金券使用说明" autoSize={{ minRows: 2, maxRows: 4 }} />
                )}
              />
            </div>

            <div>
              <Text>备注</Text>
              <Controller
                control={control}
                name="remark"
                render={({ field }) => (
                  <Input.TextArea {...field} placeholder="内部备注，可不填" autoSize={{ minRows: 2, maxRows: 4 }} />
                )}
              />
            </div>

            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
              <Link to="/coupon/cash">
                <Button>返回列表</Button>
              </Link>
            </Space>
          </Space>
        </form>
      </Card>
    </Space>
  );
};

export default VoucherCreate;
