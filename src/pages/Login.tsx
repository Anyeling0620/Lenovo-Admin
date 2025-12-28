import { useLocation, useNavigate } from 'react-router-dom';
import globalErrorHandler from '../utils/globalAxiosErrorHandler';
import { globalMessage } from '../utils/globalMessage';
import { adminLogin } from '../services/api';

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
  <div className='flex justify-center items-center '>
    <button onClick={()=>handleLogin({account:'12345678901234567890',password:'123456'})} className='bg-gray-500 text-white  my-auto'>Login</button >
  </div>
  )
}

export default Login