import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, Typography } from 'antd';
import globalErrorHandler from '../utils/globalAxiosErrorHandler';
import { globalMessage } from '../utils/globalMessage';
import { adminLogin } from '../services/api';

const DEFAULT_FORM = { account: '12345678901234567890', password: '123456' };

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string })?.from || '/';
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { account: string; password: string }) => {
    setLoading(true);
    try {
      const response = await adminLogin(values);
      if (response && 'sessionId' in response && typeof response.sessionId === 'string') {
        localStorage.setItem('admin_sessionId', response.sessionId);
      }
      window.dispatchEvent(new Event('login'));
      globalMessage.success('登录成功');
      navigate(fromPath, { replace: true });
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f5f5' }}>
      <Card style={{ width: 360 }}>
        <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
          管理后台登录
        </Typography.Title>
        <Form initialValues={DEFAULT_FORM} layout="vertical" onFinish={handleLogin}>
          <Form.Item label="账号" name="account" rules={[{ required: true, message: '请输入账号' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
