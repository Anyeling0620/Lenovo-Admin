import React from 'react';
import { Card, Button, Space, List } from 'antd';
import { EditOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const AccountSecurity: React.FC = () => {
  const securityItems = [
    {
      title: '修改个人信息',
      description: '修改姓名、昵称、性别、邮箱、头像等个人信息',
      icon: <UserOutlined style={{ fontSize: '20px', color: '#1890ff' }} />,
      action: (
        <Link to="/account/edit">
          <Button type="primary" icon={<EditOutlined />} size="small">
            去修改
          </Button>
        </Link>
      ),
    },
    {
      title: '修改密码',
      description: '修改登录密码，建议定期更换密码以保证账号安全',
      icon: <LockOutlined style={{ fontSize: '20px', color: '#52c41a' }} />,
      action: (
        <Link to="/account/change-password">
          <Button type="primary" icon={<LockOutlined />} size="small">
            去修改
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ padding: '8px' }}>
      <Card title="账号安全">
        <List
          dataSource={securityItems}
          renderItem={(item) => (
            <List.Item
              actions={[item.action]}
              style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
            >
              <List.Item.Meta
                avatar={item.icon}
                title={<span style={{ fontSize: '14px' }}>{item.title}</span>}
                description={<span style={{ fontSize: '12px', color: '#666' }}>{item.description}</span>}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default AccountSecurity;

