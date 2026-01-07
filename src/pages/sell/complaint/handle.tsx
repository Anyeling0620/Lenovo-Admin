import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, Descriptions, Tag, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getComplaints, handleComplaint } from '../../../services/api';
import type { ComplaintResponse, ComplaintStatus } from '../../../services/api-type';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { mockComplaints } from '../mockData';

const { TextArea } = Input;

// 表单验证schema
const handleFormSchema = z.object({
  result: z.string().min(1, '处理结果不能为空').max(500, '处理结果长度不能超过500个字符'),
});

type HandleForm = z.infer<typeof handleFormSchema>;

const ComplaintHandle: React.FC = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState<ComplaintResponse | null>(null);
  const navigate = useNavigate();

  const { control, handleSubmit, formState: { errors } } = useForm<HandleForm>({
    resolver: zodResolver(handleFormSchema),
    defaultValues: {
      result: '',
    },
  });

  const loadComplaint = async () => {
    if (!complaintId) return;
    setLoading(true);
    try {
      const complaints = await getComplaints();
      const found = complaints.find((item) => item.after_sale_complaint_id === complaintId);
      if (found) {
        setComplaint(found);
      } else {
        // 如果API中没有找到，使用模拟数据
        const mock = mockComplaints.find((item) => item.after_sale_complaint_id === complaintId);
        if (mock) {
          setComplaint(mock);
        }
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      // API拉取失败时使用模拟数据
      const mock = mockComplaints.find((item) => item.after_sale_complaint_id === complaintId);
      if (mock) {
        setComplaint(mock);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaint();
  }, [complaintId]);

  const onSubmit = async (data: HandleForm) => {
    if (!complaintId) return;
    setLoading(true);
    try {
      await handleComplaint(complaintId, {
        result: data.result,
      });
      globalMessage.success('投诉处理成功');
      navigate('/complaint');
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !complaint) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!complaint) {
    return null;
  }

  const getStatusTag = (status: ComplaintStatus) => {
    const statusMap: Record<ComplaintStatus, { color: string; text: string }> = {
      '正常': { color: 'blue', text: '正常' },
      '撤回': { color: 'orange', text: '撤回' },
      '用户删除': { color: 'red', text: '用户删除' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div style={{ padding: '8px' }}>
      <Card
        title={
          <Space>
            <ArrowLeftOutlined />
            <Link to="/complaint" style={{ color: 'inherit' }}>
              返回
            </Link>
            <span style={{ marginLeft: '8px' }}>处理投诉</span>
          </Space>
        }
      >
        <Descriptions column={2} size="small" bordered style={{ marginBottom: '16px' }}>
          <Descriptions.Item label="投诉ID">{complaint.after_sale_complaint_id}</Descriptions.Item>
          <Descriptions.Item label="用户账号">{complaint.user_account}</Descriptions.Item>
          <Descriptions.Item label="售后ID">{complaint.after_sale_id}</Descriptions.Item>
          <Descriptions.Item label="状态">{getStatusTag(complaint.status)}</Descriptions.Item>
          <Descriptions.Item label="处理状态">
            <Tag color={complaint.is_handled ? 'green' : 'orange'}>
              {complaint.is_handled ? '已处理' : '未处理'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="原处理结果">
            {complaint.handle_result || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="投诉内容" span={2}>{complaint.content}</Descriptions.Item>
        </Descriptions>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ maxWidth: '600px' }}>
          <Form.Item
            label="处理结果"
            validateStatus={errors.result ? 'error' : ''}
            help={errors.result?.message}
          >
            <Controller
              name="result"
              control={control}
              render={({ field }) => (
                <TextArea {...field} rows={4} placeholder="请输入处理结果" />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交
              </Button>
              <Link to="/complaint">
                <Button>取消</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ComplaintHandle;

