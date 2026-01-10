import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Upload, Avatar, Space, message } from 'antd';
import { UserOutlined, UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAccountProfile, updateAccountProfile } from '../../services/api';
import type { AdminProfileResponse, Gender } from '../../services/api-type';
import { getImageUrl } from '../../utils/imageUrl';
import { globalMessage } from '../../utils/globalMessage';
import { globalErrorHandler } from '../../utils/globalAxiosErrorHandler';
import { mockAdminProfile } from './mockData';
import type { UploadFile } from 'antd/es/upload/interface';
import useAdminProfileStore from '../../store/adminInfo';

const { Option } = Select;

// 表单验证schema
const profileFormSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名长度不能超过50个字符'),
  nickname: z.string().max(50, '昵称长度不能超过50个字符').optional().or(z.literal('')),
  gender: z.enum(['man', 'woman', 'secret']),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileFormSchema>;

const AccountEdit: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<AdminProfileResponse | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      nickname: '',
      gender: 'secret',
      email: '',
    },
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getAccountProfile();
      setProfile(data);
      reset({
        name: data.name,
        nickname: data.nickname || '',
        gender: data.gender,
        email: data.email || '',
      });
      if (data.avatar) {
        setAvatarPreview(getImageUrl(data.avatar));
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      // API拉取失败时使用模拟数据
      const mockData = mockAdminProfile;
      setProfile(mockData);
      reset({
        name: mockData.name,
        nickname: mockData.nickname || '',
        gender: mockData.gender,
        email: mockData.email || '',
      });
      if (mockData.avatar) {
        setAvatarPreview(getImageUrl(mockData.avatar));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarChange = (file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return false; // 阻止自动上传
  };

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    try {
      await updateAccountProfile({
        name: data.name,
        nickname: data.nickname || null,
        gender: data.gender,
        email: data.email || null,
        avatarFile: avatarFile || undefined,
      });
      globalMessage.success('个人信息更新成功');
      
      // 更新全局 store
      const updatedProfile = await getAccountProfile();
      useAdminProfileStore.getState().setProfile(updatedProfile);
      
      navigate('/account/info');
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
            <Link to="/account/info" style={{ color: 'inherit' }}>
              返回
            </Link>
            <span style={{ marginLeft: '8px' }}>编辑个人信息</span>
          </Space>
        }
      >
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ maxWidth: '600px' }}>
          <Form.Item label="头像">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar
                size={80}
                src={avatarPreview || (profile?.avatar ? getImageUrl(profile.avatar) : undefined)}
                icon={!avatarPreview && !profile?.avatar ? <UserOutlined /> : undefined}
              />
              <Upload
                beforeUpload={handleAvatarChange}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>上传头像</Button>
              </Upload>
            </div>
          </Form.Item>

          <Form.Item
            label="姓名"
            validateStatus={errors.name ? 'error' : ''}
            help={errors.name?.message}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="请输入姓名" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="昵称"
            validateStatus={errors.nickname ? 'error' : ''}
            help={errors.nickname?.message}
          >
            <Controller
              name="nickname"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="请输入昵称（可选）" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="性别"
            validateStatus={errors.gender ? 'error' : ''}
            help={errors.gender?.message}
          >
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="请选择性别">
                  <Option value="man">男</Option>
                  <Option value="woman">女</Option>
                  <Option value="secret">保密</Option>
                </Select>
              )}
            />
          </Form.Item>

          <Form.Item
            label="邮箱"
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email?.message}
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input {...field} type="email" placeholder="请输入邮箱（可选）" />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
              <Link to="/account/info">
                <Button>取消</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AccountEdit;

