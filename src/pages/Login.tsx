import { message } from 'antd';
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string })?.from || '/';
  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      // 模拟登录接口请求（实际项目替换为真实接口）
      // const res = await api.login(values);
      // localStorage.setItem('token', res.token);

      // 示例：直接存储假Token
      localStorage.setItem('token', 'fake-token-123456');
      message.success('登录成功！');

      // 跳转到登录前的页面（或首页）
      navigate(fromPath, { replace: true });
    } catch (error) {
      message.error('登录失败：用户名或密码错误');
    }
  };
  return (
    <button onClick={()=>handleLogin({username:'admin',password:'123456'})}>Login</button >
  )
}

export default Login