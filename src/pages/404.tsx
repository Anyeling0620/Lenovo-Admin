import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="不存在的页面"
      extra={<Button type="default" onClick={() => navigate('/')}>Back Home</Button>}
    />
  )
}

export default NotFound