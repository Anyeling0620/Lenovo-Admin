import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Space, Tag, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { getComplaints } from '../../../services/api';
import type { ComplaintResponse, ComplaintStatus } from '../../../services/api-type';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { mockComplaints } from '../mockData';

const { Option } = Select;

const ComplaintManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ComplaintResponse[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const complaints = await getComplaints();
      setData(complaints);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      // API拉取失败时使用模拟数据
      setData(mockComplaints);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const getStatusTag = (status: ComplaintStatus) => {
    const statusMap: Record<ComplaintStatus, { color: string; text: string }> = {
      '正常': { color: 'blue', text: '正常' },
      '撤回': { color: 'orange', text: '撤回' },
      '用户删除': { color: 'red', text: '用户删除' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const filteredData = data.filter((item) => {
    const matchKeyword = !searchKeyword || 
      item.user_account.includes(searchKeyword) || 
      item.after_sale_id.includes(searchKeyword);
    const matchStatus = !statusFilter || item.status === statusFilter;
    return matchKeyword && matchStatus;
  });

  const columns: ColumnsType<ComplaintResponse> = [
    {
      title: '投诉ID',
      dataIndex: 'after_sale_complaint_id',
      key: 'after_sale_complaint_id',
      width: 150,
      fixed: 'left',
    },
    {
      title: '用户账号',
      dataIndex: 'user_account',
      key: 'user_account',
      width: 120,
    },
    {
      title: '售后ID',
      dataIndex: 'after_sale_id',
      key: 'after_sale_id',
      width: 120,
    },
    {
      title: '投诉内容',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
    },
    {
      title: '处理状态',
      key: 'is_handled',
      width: 100,
      render: (_, record) => (
        <Tag color={record.is_handled ? 'green' : 'orange'}>
          {record.is_handled ? '已处理' : '未处理'}
        </Tag>
      ),
    },
    {
      title: '处理结果',
      dataIndex: 'handle_result',
      key: 'handle_result',
      width: 200,
      ellipsis: true,
      render: (result: string | null) => result || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ComplaintStatus) => getStatusTag(status),
      filters: [
        { text: '正常', value: '正常' },
        { text: '撤回', value: '撤回' },
        { text: '用户删除', value: '用户删除' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {!record.is_handled && (
            <Link to={`/complaint/handle/${record.after_sale_complaint_id}`}>
              <Tooltip title="处理投诉">
                <Button type="link" icon={<EditOutlined />} size="small">
                  处理
                </Button>
              </Tooltip>
            </Link>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '8px' }}>
      <Card
        title="投诉管理"
        extra={
          <Space>
            <Input
              placeholder="搜索用户账号或售后ID"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              allowClear
            >
              <Option value="正常">正常</Option>
              <Option value="撤回">撤回</Option>
              <Option value="用户删除">用户删除</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadComplaints}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="after_sale_complaint_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ComplaintManagement;

