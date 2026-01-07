import React, { useEffect, useMemo, useState } from 'react';
import { Card, Space, Typography, Form, Input, DatePicker, Select, InputNumber, Button, Divider, Tag, Flex, List, Modal, Table } from 'antd';
import dayjs from 'dayjs';
import {
  getSeckillRounds,
  createSeckillRoundApi,
  addSeckillProductApi,
  addSeckillConfigApi,
  getProducts,
  getProductConfigs,
} from '../../services/api';
import type {
  SeckillRoundResponse,
  SeckillRoundCreateRequest,
  SeckillProductCreateRequest,
  SeckillConfigCreateRequest,
  ProductListItem,
  ProductConfigResponse,
} from '../../services/api-type';
import { marketingMock } from '../../services/marketing-mock';
import { globalMessage } from '../../utils/globalMessage';
import { globalErrorHandler } from '../../utils/globalAxiosErrorHandler';

const { Title, Text } = Typography;

interface MockProduct {
  seckill_product_id: string;
  round_id: string;
  product_id: string;
  product_name: string;
  type: '立减' | '打折';
  reduce_amount?: number;
  discount?: number;
  configs?: Array<{
    seckill_product_config_id: string;
    config_id: string;
    config1?: string;
    config2?: string;
    config3?: string;
    shelf_num: number;
    seckill_price: number;
  }>;
}

interface RoundWithProducts extends SeckillRoundResponse {
  products?: MockProduct[];
}

const Seckill: React.FC = () => {
  const [rounds, setRounds] = useState<RoundWithProducts[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'ended'>('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productFetchLoading, setProductFetchLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productList, setProductList] = useState<ProductListItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [productConfigs, setProductConfigs] = useState<ProductConfigResponse[]>([]);
  const [productConfigLoading, setProductConfigLoading] = useState(false);

  const [roundForm] = Form.useForm();
  const [productForm] = Form.useForm();

  const roundOptions = useMemo(
    () => rounds.map(r => ({ label: r.title, value: r.seckill_round_id })),
    [rounds]
  );

  const filteredRounds = useMemo(() => {
    const now = dayjs();
    return rounds.filter(r => {
      const start = dayjs(r.start_time);
      const end = dayjs(r.end_time);
      const status = now.isBefore(start) ? 'upcoming' : now.isAfter(end) ? 'ended' : 'ongoing';
      return statusFilter === 'all' || statusFilter === status;
    });
  }, [rounds, statusFilter]);

  const filteredProducts = useMemo(() => {
    const keyword = productSearch.trim().toLowerCase();
    if (!keyword) return productList;
    return productList.filter(p =>
      p.name.toLowerCase().includes(keyword) || p.product_id.toLowerCase().includes(keyword)
    );
  }, [productList, productSearch]);

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const res = await getSeckillRounds();
      // 如果后端未返回商品/配置，补空数组保持 UI 正常
      setRounds(res.map(item => ({ ...item, products: (item as any).products || [] })));
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      const mockRes = await marketingMock.listSeckillRounds();
      setRounds(mockRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds();
  }, []);

  const fetchProducts = async () => {
    setProductFetchLoading(true);
    try {
      const res = await getProducts();
      setProductList(res);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      const mock = await marketingMock.listProducts();
      setProductList(mock);
    } finally {
      setProductFetchLoading(false);
    }
  };

  const openProductPicker = () => {
    setProductModalOpen(true);
    if (!productList.length) {
      fetchProducts();
    }
  };

  const loadProductConfigs = async (productId: string) => {
    if (!productId) {
      setProductConfigs([]);
      return;
    }
    setProductConfigLoading(true);
    try {
      const res = await getProductConfigs(productId);
      setProductConfigs(res);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      const mock = await marketingMock.listProductConfigs(productId);
      setProductConfigs(mock);
      if (mock.length) {
        globalMessage.info('已切换为模拟配置');
      }
    } finally {
      setProductConfigLoading(false);
    }
  };

  const confirmProduct = () => {
    if (!selectedProduct) return;
    productForm.setFieldsValue({
      product_id: selectedProduct.product_id,
      product_name: selectedProduct.name,
      config_id: undefined,
      config1: undefined,
      config2: undefined,
      config3: undefined,
      shelf_num: undefined,
      seckill_price: undefined,
    });
    setProductConfigs([]);
    loadProductConfigs(selectedProduct.product_id);
    setProductModalOpen(false);
  };

  const handleCreateRound = async (values: any) => {
    const payload: SeckillRoundCreateRequest = {
      title: values.title,
      start_time: values.timeRange[0].toISOString(),
      end_time: values.timeRange[1].toISOString(),
      status: values.status,
      remark: values.remark,
    };
    setCreateLoading(true);
    try {
      await createSeckillRoundApi(payload);
      globalMessage.success('创建秒杀轮次成功');
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      await marketingMock.createSeckillRound(payload);
      globalMessage.success('已在模拟环境创建轮次');
    } finally {
      setCreateLoading(false);
      fetchRounds();
      roundForm.resetFields();
    }
  };

  const handleAddProduct = async (values: any) => {
    const productPayload: SeckillProductCreateRequest & { product_name?: string } = {
      round_id: values.round_id,
      product_id: values.product_id,
      product_name: values.product_name,
      type: values.type,
      reduce_amount: values.type === '立减' ? values.reduce_amount : undefined,
      discount: values.type === '打折' ? values.discount : undefined,
    };
    setProductLoading(true);
    let createdProductId = '';
    try {
      const res = await addSeckillProductApi(productPayload);
      createdProductId = res.seckill_product_id;
      globalMessage.success('已添加秒杀商品');
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      const res = await marketingMock.addSeckillProduct(productPayload);
      createdProductId = res.seckill_product_id;
      globalMessage.success('已在模拟环境添加商品');
    }

    // 配置可选
    if (values.config_id && createdProductId) {
      const configPayload: SeckillConfigCreateRequest & {
        config1?: string;
        config2?: string;
        config3?: string;
        seckill_product_id: string;
      } = {
        seckill_product_id: createdProductId,
        config_id: values.config_id,
        config1: values.config1,
        config2: values.config2,
        config3: values.config3,
        shelf_num: Number(values.shelf_num || 0),
        seckill_price: Number(values.seckill_price || 0),
      };
      try {
        await addSeckillConfigApi(configPayload);
        globalMessage.success('已添加秒杀配置');
      } catch (error) {
        globalErrorHandler.handle(error, globalMessage.error);
        await marketingMock.addSeckillConfig(configPayload);
        globalMessage.success('已在模拟环境添加配置');
      }
    }

    setProductLoading(false);
    productForm.resetFields();
    fetchRounds();
  };

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <Title level={4} style={{ margin: 0 }}>秒杀活动</Title>
        <Text type="secondary">后端未连通时将使用本地模拟数据</Text>
      </Flex>

      <Card size="small" title="创建秒杀轮次">
        <Form form={roundForm} layout="vertical" onFinish={handleCreateRound} initialValues={{ status: '启用' }}>
          <Flex gap={12} wrap="wrap">
            <Form.Item name="title" label="轮次标题" rules={[{ required: true, message: '请输入轮次标题' }]} style={{ minWidth: 220 }}>
              <Input placeholder="如：元旦秒杀专场" />
            </Form.Item>
            <Form.Item name="timeRange" label="时间范围" rules={[{ required: true, message: '请选择时间段' }]} style={{ minWidth: 320 }}>
              <DatePicker.RangePicker showTime style={{ width: '100%' }}
                disabledDate={current => current && current < dayjs().add(-1, 'day')}
              />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ minWidth: 180 }}>
              <Select options={[{ label: '启用', value: '启用' }, { label: '禁用', value: '禁用' }, { label: '已结束', value: '已结束' }]} />
            </Form.Item>
            <Form.Item name="remark" label="备注" style={{ minWidth: 240, flex: 1 }}>
              <Input placeholder="可选" />
            </Form.Item>
          </Flex>
          <Button type="primary" htmlType="submit" loading={createLoading}>创建轮次</Button>
        </Form>
      </Card>

      <Card size="small" title="添加秒杀商品与配置">
        <Form form={productForm} layout="vertical" onFinish={handleAddProduct}>
          <Flex gap={12} wrap="wrap">
            <Form.Item name="round_id" label="所属轮次" rules={[{ required: true, message: '请选择轮次' }]} style={{ minWidth: 220 }}>
              <Select options={roundOptions} placeholder="选择轮次" />
            </Form.Item>
            <Form.Item label="选择商品" required style={{ minWidth: 260 }}>
              <Space>
                <Button onClick={openProductPicker}>选择商品</Button>
                {selectedProduct && (
                  <Text type="secondary">已选：{selectedProduct.name}（ID: {selectedProduct.product_id}）</Text>
                )}
              </Space>
            </Form.Item>
            <Form.Item name="product_id" hidden rules={[{ required: true, message: '请选择商品' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="product_name" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="type" label="秒杀类型" rules={[{ required: true, message: '请选择类型' }]} style={{ minWidth: 160 }}>
              <Select options={[{ label: '立减', value: '立减' }, { label: '打折', value: '打折' }]} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
              {({ getFieldValue }) => getFieldValue('type') === '立减' ? (
                <Form.Item name="reduce_amount" label="立减金额" rules={[{ required: true, message: '请输入立减金额' }]} style={{ minWidth: 160 }}>
                  <InputNumber style={{ width: '100%' }} min={0} placeholder="元" />
                </Form.Item>
              ) : (
                <Form.Item name="discount" label="折扣" rules={[{ required: true, message: '请输入折扣' }]} style={{ minWidth: 160 }}>
                  <InputNumber style={{ width: '100%' }} min={0} max={10} step={0.1} placeholder="如 9 代表 9 折" />
                </Form.Item>
              )}
            </Form.Item>
          </Flex>

          <Divider orientation="left">可选配置（SKU 价格/库存）</Divider>
          <Flex gap={12} wrap="wrap">
            <Form.Item name="config_id" label="选择配置" style={{ minWidth: 240 }}>
              <Select
                placeholder={selectedProduct ? '选择商品配置（可选）' : '请先选择商品'}
                options={productConfigs.map(cfg => ({
                  label: `${cfg.config1} / ${cfg.config2}${cfg.config3 ? ' / ' + cfg.config3 : ''}（售价¥${cfg.sale_price}）`,
                  value: cfg.product_config_id,
                  cfg,
                }))}
                loading={productConfigLoading}
                disabled={!selectedProduct}
                allowClear
                onChange={(value, option) => {
                  const cfg = (option as any)?.cfg as ProductConfigResponse | undefined;
                  if (cfg) {
                    productForm.setFieldsValue({
                      config1: cfg.config1,
                      config2: cfg.config2,
                      config3: cfg.config3 ?? undefined,
                    });
                  } else {
                    productForm.setFieldsValue({ config1: undefined, config2: undefined, config3: undefined });
                  }
                }}
              />
            </Form.Item>
            <Form.Item name="config1" label="规格1" style={{ minWidth: 160 }}>
              <Input placeholder="如 16G+512G" />
            </Form.Item>
            <Form.Item name="config2" label="规格2" style={{ minWidth: 160 }}>
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item name="config3" label="规格3" style={{ minWidth: 160 }}>
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item name="shelf_num" label="库存" style={{ minWidth: 140 }}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="件" />
            </Form.Item>
            <Form.Item name="seckill_price" label="秒杀价" style={{ minWidth: 160 }}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="元" />
            </Form.Item>
          </Flex>

          <Button type="primary" htmlType="submit" loading={productLoading}>添加商品</Button>
        </Form>
      </Card>

      <Card
        size="small"
        title="秒杀轮次列表"
        loading={loading}
        extra={
          <Space>
            <Text type="secondary">筛选</Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={[
                { label: '全部', value: 'all' },
                { label: '进行中', value: 'ongoing' },
                { label: '未开始', value: 'upcoming' },
                { label: '已结束', value: 'ended' },
              ]}
            />
          </Space>
        }
      >
        <List
          dataSource={filteredRounds}
          renderItem={round => (
            <List.Item key={round.seckill_round_id}>
              <div style={{ width: '100%' }}>
                <Flex align="center" justify="space-between" wrap="wrap">
                  <Space size={12} align="center">
                    <Title level={5} style={{ margin: 0 }}>{round.title}</Title>
                    <Tag color={round.status === '启用' ? 'green' : round.status === '禁用' ? 'red' : 'blue'}>{round.status}</Tag>
                    <Text type="secondary">{dayjs(round.start_time).format('YYYY-MM-DD HH:mm')} ~ {dayjs(round.end_time).format('YYYY-MM-DD HH:mm')}</Text>
                  </Space>
                </Flex>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        open={productModalOpen}
        title="选择商品"
        onCancel={() => setProductModalOpen(false)}
        onOk={confirmProduct}
        okButtonProps={{ disabled: !selectedProduct, loading: productFetchLoading }}
        destroyOnClose
        width={900}
      >
        <Space style={{ marginBottom: 12 }}>
          <Input
            placeholder="输入关键词搜索（名称或ID）"
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Button onClick={fetchProducts} loading={productFetchLoading}>刷新列表</Button>
        </Space>
        <Table
          rowKey="product_id"
          dataSource={filteredProducts}
          loading={productFetchLoading}
          pagination={{ pageSize: 8 }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedProduct ? [selectedProduct.product_id] : [],
            onChange: (_, rows) => setSelectedProduct(rows[0]),
          }}
          columns={[
            { title: '商品ID', dataIndex: 'product_id', width: 140 },
            { title: '名称', dataIndex: 'name' },
            { title: '品牌', dataIndex: 'brand_name', width: 140 },
            { title: '分类', dataIndex: 'category_name', width: 160 },
            { title: '状态', dataIndex: 'status', width: 100 },
          ]}
        />
      </Modal>
    </Space>
  );
};

export default Seckill;
