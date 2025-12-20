import { useLocation, useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/auth';
import globalErrorHandler from '../utils/globalAxiosErrorHandler';
import { globalMessage } from '../utils/globalMessage';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string })?.from || '/';
  const handleLogin = async (values: { account: string; password: string }) => {
    try {
      await adminLogin(values);

      window.dispatchEvent(new Event('login'));
      globalMessage.success('登录成功！');

      navigate(fromPath, { replace: true });
    } catch (error) {
      globalErrorHandler.handle(error,globalMessage.error)
    }
  };
  return (
    <button onClick={()=>handleLogin({account:'admin',password:'123456'})}>Login</button >
  )
}

export default Login