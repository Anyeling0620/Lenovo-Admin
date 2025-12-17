import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom';

const NotAuthorized = () => {
      const navigate = useNavigate();

    return (
        <Result
            status="403"
            title="403"
            subTitle="无权限访问该页面"
      extra={<Button type="default" onClick={() => navigate('/')}>Back Home</Button>}
        />
    )
}

export default NotAuthorized