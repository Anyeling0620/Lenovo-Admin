import type { OrderListItem, OrderDetailResponse, AfterSaleResponse, ComplaintResponse } from '../../services/api-type';
import dayjs from 'dayjs';

// 模拟订单列表数据
export const mockOrders: OrderListItem[] = Array.from({ length: 20 }, (_, i) => ({
  order_id: `order_${i + 1}`,
  order_no: `ORD${String(i + 1).padStart(8, '0')}`,
  user_id: `user_${(i % 10) + 1}`,
  user_account: `user${(i % 10) + 1}`,
  status: ['已取消', '待支付', '已支付', '待发货', '已发货', '待收货', '已收货', '已完成'][i % 8],
  pay_amount: (Math.random() * 10000 + 100).toFixed(2),
  actual_pay_amount: (Math.random() * 10000 + 100).toFixed(2),
  pay_time: ['已支付', '待发货', '已发货', '待收货', '已收货', '已完成'].includes(['已取消', '待支付', '已支付', '待发货', '已发货', '待收货', '已收货', '已完成'][i % 8]) 
    ? dayjs().subtract(i, 'day').format('YYYY-MM-DD HH:mm:ss') 
    : null,
  created_at: dayjs().subtract(i + 1, 'day').format('YYYY-MM-DD HH:mm:ss'),
  items: [
    {
      order_item_id: `item_${i + 1}_1`,
      product_id: `product_${(i % 5) + 1}`,
      config_id: `config_${(i % 5) + 1}`,
      quantity: (i % 3) + 1,
      pay_amount_snapshot: (Math.random() * 5000 + 100).toFixed(2),
      name: `商品${(i % 5) + 1}`,
    },
  ],
}));

// 模拟售后列表数据
export const mockAfterSales: AfterSaleResponse[] = Array.from({ length: 15 }, (_, i) => ({
  after_sale_id: `after_sale_${i + 1}`,
  after_sale_no: `AS${String(i + 1).padStart(8, '0')}`,
  order_id: `order_${(i % 10) + 1}`,
  order_item_id: `item_${(i % 10) + 1}_1`,
  type: ['退货', '换货', '退款'][i % 3],
  status: ['申请中', '已退款', '已同意', '已拒绝', '已寄回', '已寄出', '已完成'][i % 7] as any,
  user_id: `user_${(i % 10) + 1}`,
  apply_time: dayjs().subtract(i, 'day').format('YYYY-MM-DD HH:mm:ss'),
  reason: `售后原因${i + 1}：商品质量问题或不符合预期`,
}));

// 模拟投诉列表数据
export const mockComplaints: ComplaintResponse[] = Array.from({ length: 10 }, (_, i) => ({
  after_sale_complaint_id: `complaint_${i + 1}`,
  user_id: `user_${(i % 10) + 1}`,
  user_account: `user${(i % 10) + 1}`,
  after_sale_id: `after_sale_${(i % 5) + 1}`,
  content: `投诉内容${i + 1}：对售后处理结果不满意，希望重新处理`,
  is_handled: i % 3 === 0,
  handle_result: i % 3 === 0 ? `处理结果${i + 1}：已重新审核并处理` : null,
  status: ['正常', '撤回', '用户删除'][i % 3] as any,
}));

// 模拟订单详情数据
export const mockOrderDetail: OrderDetailResponse = {
  order_id: 'order_1',
  order_no: 'ORD00000001',
  status: '待发货',
  pay_amount: '5999.00',
  actual_pay_amount: '5999.00',
  pay_type: '微信支付',
  receiver: '张三',
  phone: '13800138000',
  address: '北京市朝阳区xxx街道xxx号',
  logistics_no: null,
  items: [
    {
      order_item_id: 'item_1_1',
      product_id: 'product_1',
      product_name: '联想ThinkPad X1 Carbon',
      config_id: 'config_1',
      quantity: 1,
      config1: '16GB内存',
      config2: '512GB SSD',
      config3: '黑色',
    },
  ],
};

