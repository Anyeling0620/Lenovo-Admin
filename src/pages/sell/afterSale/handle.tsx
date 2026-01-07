import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Input, Button, Space, Descriptions, Tag, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAfterSales, handleAfterSale } from '../../../services/api';
import type { AfterSaleResponse, AfterSaleStatus } from '../../../services/api-type';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { mockAfterSales } from '../mockData';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

// 表单验证schema
const handleFormSchema = z.object({
  status: z.enum(['申请中', '已退款', '已同意', '已拒绝', '已寄回', '已寄出', '已完成']),
  remark: z.string().max(500, '备注长度不能超过500个字符').optional().or(z.literal('')),
});

type HandleForm = z.infer<typeof handleFormSchema>;

const AfterSaleHandle: React.FC = () => {
  const { afterSaleId } = useParams<{ afterSaleId: string }>();
  const [loading, setLoading] = useState(false);
  const [afterSale, setAfterSale] = useState<AfterSaleResponse | null>(null);
  const navigate = useNavigate();

  const { control, handleSubmit, formState: { errors } } = useForm<HandleForm>({
    resolver: zodResolver(handleFormSchema),
    defaultValues: {
      status: '申请中',
      remark: '',
    },
  });

  const loadAfterSale = async () => {
    if (!afterSaleId) return;
    setLoading(true);
    try {
      const afterSales = await getAfterSales();
      const found = afterSales.find((item) => item.after_sale_id === afterSaleId);
      if (found) {
        setAfterSale(found);
      } else {
        // 如果API中没有找到，使用模拟数据
        const mock = mockAfterSales.find((item) => item.after_sale_id === afterSaleId);
        if (mock) {
          setAfterSale(mock);
        }
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      // API拉取失败时使用模拟数据
      const mock = mockAfterSales.find((item) => item.after_sale_id === afterSaleId);
      if (mock) {
        setAfterSale(mock);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAfterSale();
  }, [afterSaleId]);

  const onSubmit = async (data: HandleForm) => {
    if (!afterSaleId) return;
    setLoading(true);
    try {
      await handleAfterSale(afterSaleId, {
        status: data.status as AfterSaleStatus,
        remark: data.remark || undefined,
      });
      globalMessage.success('售后处理成功');
      navigate('/after-sale');
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !afterSale) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!afterSale) {
    return null;
  }

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

  return (
    <div style={{ padding: '8px' }}>
      <Card
        title={
          <Space>
            <ArrowLeftOutlined />
            <Link to="/after-sale" style={{ color: 'inherit' }}>
              返回
            </Link>
            <span style={{ marginLeft: '8px' }}>处理售后</span>
          </Space>
        }
      >
        <Descriptions column={2} size="small" bordered style={{ marginBottom: '16px' }}>
          <Descriptions.Item label="售后单号">{afterSale.after_sale_no}</Descriptions.Item>
          <Descriptions.Item label="订单ID">{afterSale.order_id}</Descriptions.Item>
          <Descriptions.Item label="售后类型">
            <Tag color={afterSale.type === '退货' ? 'red' : afterSale.type === '换货' ? 'blue' : 'orange'}>
              {afterSale.type}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">{getStatusTag(afterSale.status)}</Descriptions.Item>
          <Descriptions.Item label="用户ID">{afterSale.user_id}</Descriptions.Item>
          <Descriptions.Item label="申请时间">
            {dayjs(afterSale.apply_time).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="申请原因" span={2}>{afterSale.reason}</Descriptions.Item>
        </Descriptions>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ maxWidth: '600px' }}>
          <Form.Item
            label="处理状态"
            validateStatus={errors.status ? 'error' : ''}
            help={errors.status?.message}
          >
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="请选择处理状态">
                  <Option value="申请中">申请中</Option>
                  <Option value="已退款">已退款</Option>
                  <Option value="已同意">已同意</Option>
                  <Option value="已拒绝">已拒绝</Option>
                  <Option value="已寄回">已寄回</Option>
                  <Option value="已寄出">已寄出</Option>
                  <Option value="已完成">已完成</Option>
                </Select>
              )}
            />
          </Form.Item>

          <Form.Item
            label="处理备注"
            validateStatus={errors.remark ? 'error' : ''}
            help={errors.remark?.message}
          >
            <Controller
              name="remark"
              control={control}
              render={({ field }) => (
                <TextArea {...field} rows={4} placeholder="请输入处理备注（可选）" />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交
              </Button>
              <Link to="/after-sale">
                <Button>取消</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AfterSaleHandle;

