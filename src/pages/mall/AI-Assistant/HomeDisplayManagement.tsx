import { useState } from "react";
import {
  Table,
  Button,
  Space,
  Card,
  Row,
  Col,
  Select,
  Typography,
  Tag,
  Modal,
  Form,
  Switch,
  Divider,
  Image,
  DatePicker,
  Upload,
  Input
} from "antd";
import { 
  PlusOutlined, 
  SearchOutlined, 
  PlusOutlined as UploadPlusOutlined
} from "@ant-design/icons";
import { useRequest } from 'ahooks';
import dayjs from 'dayjs';
import globalErrorHandler from "../../../utils/globalAxiosErrorHandler";
import { globalMessage } from "../../../utils/globalMessage";
import { getImageUrl } from "../../../utils/imageUrl";
import { getHomePush, setHomePush, getShelfProducts } from "../../../services/api";
import type { ShelfProductResponse } from "../../../services/api-type";

const { Title } = Typography;
const { Option } = Select;

const HomeDisplayManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    keyword: ''
  });
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  // 获取首页展示列表
  const { 
    data: homeDisplays = [], 
    loading: displaysLoading, 
    run: fetchHomeDisplays 
  } = useRequest(
    async () => {
      const response = await getHomePush();
      return response;
    },
    {
      refreshDeps: [filters],
      onError: (error) => globalErrorHandler.handle(error, globalMessage.error)
    }
  );

  // 获取上架商品列表（用于选择）
  const { data: shelfProducts } = useRequest(() => getShelfProducts({ status: '在售' }));

  const handleAdd = () => {
    form.resetFields();
    setFileList([]);
    setIsModalVisible(true);
  };

  const onFinish = async (values: any) => {
    try {
      const { shelf_product_id, is_carousel, start_time, end_time } = values;
      const formattedStartTime = start_time ? dayjs(start_time).format('YYYY-MM-DD HH:mm:ss') : '';
      const formattedEndTime = end_time ? dayjs(end_time).format('YYYY-MM-DD HH:mm:ss') : '';
      
      const imageFile = fileList.length > 0 ? fileList[0].originFileObj : undefined;

      await setHomePush({
        shelf_product_id,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        is_carousel,
        imageFile
      });

      globalMessage.success('首页展示创建成功');
      setIsModalVisible(false);
      fetchHomeDisplays();
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList.slice(-1));
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      '下架': { color: 'red', text: '下架' },
      '在售': { color: 'green', text: '在售' },
      '售罄': { color: 'orange', text: '售罄' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return <Tag color={statusInfo?.color}>{statusInfo?.text}</Tag>;
  };

  const columns = [
    {
      title: '展示图片',
      dataIndex: 'carousel_image',
      key: 'carousel_image',
      width: 80,
      render: (image: string | null) => (
        <Image 
          width={60} 
          height={60} 
          src={image ? getImageUrl(image) : '/placeholder-image.png'} 
          alt="展示图片"
          style={{ objectFit: 'cover' }}
        />
      )
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '轮播展示',
      dataIndex: 'is_carousel',
      key: 'is_carousel',
      width: 100,
      render: (isCarousel: boolean) => (
        <Tag color={isCarousel ? 'blue' : 'default'}>
          {isCarousel ? '是' : '否'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 150,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 150,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>首页展示管理</Title>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAdd}
              >
                添加展示
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 筛选条件 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              placeholder="选择状态"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setFilters({...filters, status: value})}
            >
              <Option value="在售">在售</Option>
              <Option value="下架">下架</Option>
              <Option value="售罄">售罄</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Input
              placeholder="搜索产品名称" // API filtering might need backend support, frontend filtering is usually easier for small lists
              prefix={<SearchOutlined />}
              disabled // Assuming API doesn't support keyword search yet for getHomePush based on definition, or implemented in frontend
              // onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </Col>
        </Row>

        {/* 首页展示列表 */}
        <Table
          columns={columns}
          dataSource={homeDisplays}
          rowKey="home_push_id"
          loading={displaysLoading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 添加展示模态框 */}
      <Modal
        title="添加首页展示"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
        >
           <Form.Item
            label="选择上架商品"
            name="shelf_product_id"
            rules={[{ required: true, message: '请选择上架商品' }]}
          >
            <Select 
              placeholder="请选择商品" 
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {shelfProducts?.map((product: ShelfProductResponse) => (
                <Option key={product.shelf_product_id} value={product.shelf_product_id}>
                  {product.product_name} (ID: {product.shelf_product_id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
               <Form.Item
                label="轮播展示"
                name="is_carousel"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

           <Form.Item 
            label="展示图片" 
            name="image"
            extra="如果不上传，将使用商品主图"
          >
             <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handleUploadChange}
                beforeUpload={() => false}
                maxCount={1}
              >
                {fileList.length < 1 && (
                  <div>
                    <UploadPlusOutlined />
                    <div style={{ marginTop: 8 }}>上传图片</div>
                  </div>
                )}
              </Upload>
          </Form.Item>

           <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="开始时间"
                name="start_time"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="请选择开始时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="结束时间"
                name="end_time"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="请选择结束时间"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HomeDisplayManagement;