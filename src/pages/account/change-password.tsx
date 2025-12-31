import React, { useState } from 'react';
import { Card, Form, Input, Button, Space } from 'antd';
import { ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { changeAccountPassword } from '../../services/api';
import { globalMessage } from '../../utils/globalMessage';
import { globalErrorHandler } from '../../utils/globalAxiosErrorHandler';

// 表单验证schema
const passwordFormSchema = z
  .object({
    old_password: z.string().min(1, '请输入原密码'),
    new_password: z.string().min(6, '新密码长度不能少于6个字符').max(50, '新密码长度不能超过50个字符'),
    confirm_password: z.string().min(1, '请确认新密码'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: '两次输入的密码不一致',
    path: ['confirm_password'],
  })
  .refine((data) => data.old_password !== data.new_password, {
    message: '新密码不能与原密码相同',
    path: ['new_password'],
  });

type PasswordForm = z.infer<typeof passwordFormSchema>;

const ChangePassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { control, handleSubmit, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: PasswordForm) => {
    setLoading(true);
    try {
      await changeAccountPassword({
        old_password: data.old_password,
        new_password: data.new_password,
      });
      globalMessage.success('密码修改成功，请重新登录');
      setTimeout(() => {
        navigate('/account/security');
      }, 1500);
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
            <Link to="/account/security" style={{ color: 'inherit' }}>
              返回
            </Link>
            <span style={{ marginLeft: '8px' }}>修改密码</span>
          </Space>
        }
      >
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ maxWidth: '600px' }}>
          <Form.Item
            label="原密码"
            validateStatus={errors.old_password ? 'error' : ''}
            help={errors.old_password?.message}
          >
            <Controller
              name="old_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  placeholder="请输入原密码"
                  prefix={<LockOutlined />}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="新密码"
            validateStatus={errors.new_password ? 'error' : ''}
            help={errors.new_password?.message}
          >
            <Controller
              name="new_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  placeholder="请输入新密码（至少6个字符）"
                  prefix={<LockOutlined />}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            validateStatus={errors.confirm_password ? 'error' : ''}
            help={errors.confirm_password?.message}
          >
            <Controller
              name="confirm_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  placeholder="请再次输入新密码"
                  prefix={<LockOutlined />}
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
              <Link to="/account/security">
                <Button>取消</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePassword;

