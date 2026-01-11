import React, { useState } from 'react';
import { Card, Form, Input, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { shipOrder } from '../../../services/api';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';

// 表单验证schema
const shipFormSchema = z.object({
  logistics_no: z.string().min(1, '物流单号不能为空').max(100, '物流单号长度不能超过100个字符'),
});

type ShipForm = z.infer<typeof shipFormSchema>;

const OrderShip: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { control, handleSubmit, formState: { errors } } = useForm<ShipForm>({
    resolver: zodResolver(shipFormSchema),
    defaultValues: {
      logistics_no: '',
    },
  });

  const onSubmit = async (data: ShipForm) => {
    if (!orderId) return;
    setLoading(true);
    try {
      await shipOrder(orderId, data.logistics_no);
      globalMessage.success('订单发货成功');
      navigate('/order/manage');
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '8px' }}>
      <Card
        title={
          <Space>
            <ArrowLeftOutlined />
            <Link to="/order/manage" style={{ color: 'inherit' }}>
              返回
            </Link>
            <span style={{ marginLeft: '8px' }}>订单发货</span>
          </Space>
        }
      >
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ maxWidth: '600px' }}>
          <Form.Item
            label="物流单号"
            validateStatus={errors.logistics_no ? 'error' : ''}
            help={errors.logistics_no?.message}
          >
            <Controller
              name="logistics_no"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="请输入物流单号" />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交
              </Button>
              <Link to="/order/manage">
                <Button>取消</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default OrderShip;


