import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Avatar, Tag, Button, Space, Spin } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getAccountProfile } from '../../services/api';
import type { AdminProfileResponse } from '../../services/api-type';
import { getImageUrl } from '../../utils/imageUrl';
import { globalMessage } from '../../utils/globalMessage';
import { globalErrorHandler } from '../../utils/globalAxiosErrorHandler';
import { mockAdminProfile } from './mockData';
import dayjs from 'dayjs';
import useAdminProfileStore from '../../store/adminInfo';

const AccountInfo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<AdminProfileResponse | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getAccountProfile();
      setProfile(data);
      // 同步更新全局 store
      useAdminProfileStore.getState().setProfile(data);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      // API拉取失败时使用模拟数据
      setProfile(mockAdminProfile);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const genderMap: Record<string, string> = {
    man: '男',
    woman: '女',
    secret: '保密',
  };

  return (
    <div style={{ padding: '8px' }}>
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>个人信息</span>
          </Space>
        }
        extra={
          <Link to="/account/edit">
            <Button type="primary" icon={<EditOutlined />} size="small">
              编辑信息
            </Button>
          </Link>
        }
        style={{ marginBottom: '8px' }}
      >
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <Avatar
            size={80}
            src={profile.avatar ? getImageUrl(profile.avatar) : undefined}
            icon={!profile.avatar ? <UserOutlined /> : undefined}
          />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>{profile.name}</h3>
            <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>{profile.nickname || '未设置昵称'}</p>
            <Tag color={profile.status === '正常' ? 'green' : 'red'}>{profile.status}</Tag>
          </div>
        </div>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="管理员ID">{profile.admin_id}</Descriptions.Item>
          <Descriptions.Item label="账号">{profile.account}</Descriptions.Item>
          <Descriptions.Item label="姓名">{profile.name}</Descriptions.Item>
          <Descriptions.Item label="昵称">{profile.nickname || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="性别">{genderMap[profile.gender] || profile.gender}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{profile.email || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="账号状态">
            <Tag color={profile.status === '正常' ? 'green' : 'red'}>{profile.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {profile.created_at ? dayjs(profile.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最后登录时间">
            {profile.last_login_time ? dayjs(profile.last_login_time).format('YYYY-MM-DD HH:mm:ss') : '从未登录'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="身份信息" style={{ marginBottom: '8px' }}>
        {profile.identities && profile.identities.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {profile.identities.map((identity) => (
              <Tag key={identity.admin_identity_id} color="blue">
                {identity.identity_name}
                {identity.expire_time && ` (${dayjs(identity.expire_time).format('YYYY-MM-DD')}过期)`}
              </Tag>
            ))}
          </div>
        ) : (
          <span style={{ color: '#999' }}>暂无身份信息</span>
        )}
      </Card>

      <Card title="专区权限" style={{ marginBottom: '8px' }}>
        {profile.categories && profile.categories.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {profile.categories.map((category) => (
              <Tag key={category.admin_product_category_id} color="green">
                {category.category_name}
              </Tag>
            ))}
          </div>
        ) : (
          <span style={{ color: '#999' }}>暂无专区权限</span>
        )}
      </Card>

      <Card title="权限列表">
        {profile.permissions && profile.permissions.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {profile.permissions.map((permission) => (
              <Tag key={permission.identity_permission_id} color="purple">
                {permission.permission_name}
              </Tag>
            ))}
          </div>
        ) : (
          <span style={{ color: '#999' }}>暂无权限</span>
        )}
      </Card>
    </div>
  );
};

export default AccountInfo;

