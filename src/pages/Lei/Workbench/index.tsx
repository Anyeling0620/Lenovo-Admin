import { useMemo, useState } from "react";
import { Card, Col, List, Row, Segmented, Space, Tag, Typography } from "antd";
import { AdminRole } from "../../../utils/permission";

type WorkItem = {
  key: string;
  title: string;
  allowed: AdminRole[];
  description: string;
  stats?: { label: string; value: number | string }[];
  actions: { label: string; apis: string[] }[];
};

const { Title, Paragraph, Text } = Typography;

const identityOptions = [
  { label: "超管", value: AdminRole.SUPER_ADMIN },
  { label: "系统管理员", value: AdminRole.SYSTEM_ADMIN },
  { label: "商品经理", value: AdminRole.PRODUCT_MANAGER },
  { label: "仓储经理", value: AdminRole.WAREHOUSE_MANAGER },
  { label: "订单经理", value: AdminRole.ORDER_MANAGER },
  { label: "售后", value: AdminRole.AFTER_SALES },
  { label: "营销", value: AdminRole.MARKETING },
  { label: "客服", value: AdminRole.CUSTOMER_SERVICE },
];

const workItems: WorkItem[] = [
  {
    key: "system",
    title: "系统 / 权限",
    allowed: [AdminRole.SUPER_ADMIN, AdminRole.SYSTEM_ADMIN],
    description: "管理员、身份、权限、在线会话。",
    stats: [
      { label: "管理员总数", value: 48 },
      { label: "在线管理员", value: 9 },
      { label: "身份数量", value: 8 },
      { label: "权限点", value: 112 },
    ],
    actions: [
      { label: "管理员管理", apis: ["GET /admin/system/admins", "POST /admin/system/admins"] },
      { label: "绑定/调整身份", apis: ["POST /admin/system/admins/:id/identities", "PATCH /admin/system/admins/:admin_id/identities/:identity_id/expire"] },
      { label: "权限菜单", apis: ["GET /admin/system/permissions", "GET /admin/system/identities"] },
      { label: "踢下线/禁用/重置密码", apis: ["POST /admin/system/admins/:id/logout", "POST /admin/system/admins/:id/disable", "POST /admin/system/admins/:id/reset-password"] },
    ],
  },
  {
    key: "product",
    title: "商品 / 货架",
    allowed: [AdminRole.SUPER_ADMIN, AdminRole.PRODUCT_MANAGER, AdminRole.WAREHOUSE_MANAGER],
    description: "品牌、商品、标签、配置、库存、货架。",
    stats: [
      { label: "商品总数", value: 1280 },
      { label: "在售商品", value: 940 },
      { label: "低库存告警", value: 24 },
      { label: "货架条目", value: 1860 },
    ],
    actions: [
      { label: "品牌与商品", apis: ["GET /admin/brands", "UPLOAD /admin/products", "PATCH /admin/products/:id/status"] },
      { label: "标签与配置", apis: ["POST /admin/tags", "POST /admin/product-tags", "POST /admin/products/:product_id/configs"] },
      { label: "库存调整", apis: ["PATCH /admin/stocks/:config_id"] },
      { label: "货架操作", apis: ["GET /admin/shelf/products", "POST /admin/shelf/items", "PATCH /admin/shelf/products/:id/carousel"] },
    ],
  },
  {
    key: "order",
    title: "订单 / 售后",
    allowed: [AdminRole.SUPER_ADMIN, AdminRole.SYSTEM_ADMIN, AdminRole.ORDER_MANAGER, AdminRole.AFTER_SALES],
    description: "订单生命周期、售后、投诉。",
    stats: [
      { label: "今日订单数", value: 362 },
      { label: "待发货", value: 58 },
      { label: "售后待处理", value: 17 },
      { label: "投诉待处理", value: 6 },
    ],
    actions: [
      { label: "订单流转", apis: ["GET /admin/orders", "POST /admin/orders/:order_id/ship", "POST /admin/orders/:order_id/pending-receive"] },
      { label: "售后处理", apis: ["GET /admin/after-sales", "POST /admin/after-sales/:after_sale_id/handle"] },
      { label: "投诉处理", apis: ["GET /admin/complaints", "POST /admin/complaints/:complaint_id/handle"] },
    ],
  },
  {
    key: "marketing",
    title: "营销",
    allowed: [AdminRole.SUPER_ADMIN, AdminRole.SYSTEM_ADMIN, AdminRole.MARKETING],
    description: "优惠券、代金券、秒杀配置。",
    stats: [
      { label: "有效优惠券", value: 12 },
      { label: "核销率", value: "42%" },
      { label: "代金券余额(k)", value: 680 },
      { label: "今日秒杀场次", value: 3 },
    ],
    actions: [
      { label: "优惠券", apis: ["GET /admin/marketing/coupons", "POST /admin/marketing/coupons", "GET /admin/marketing/coupons/:id/stats"] },
      { label: "代金券发放", apis: ["GET /admin/marketing/vouchers", "POST /admin/marketing/vouchers/:id/issue"] },
      { label: "秒杀配置", apis: ["POST /admin/marketing/seckill-rounds", "POST /admin/marketing/seckill-products", "POST /admin/marketing/seckill-configs"] },
    ],
  },
  {
    key: "service",
    title: "客服",
    allowed: [AdminRole.SUPER_ADMIN, AdminRole.SYSTEM_ADMIN, AdminRole.CUSTOMER_SERVICE],
    description: "会话、消息、已读/结束/撤回。",
    stats: [
      { label: "活跃会话", value: 34 },
      { label: "未读消息", value: 128 },
      { label: "平均首响(分钟)", value: 2.8 },
    ],
    actions: [
      { label: "会话列表", apis: ["GET /admin/service/sessions"] },
      { label: "消息收发", apis: ["GET /admin/service/sessions/:room_id/messages", "POST /admin/service/messages/:message_id/read"] },
      { label: "结束/撤回", apis: ["POST /admin/service/sessions/:room_id/end", "POST /admin/service/messages/:message_id/withdraw"] },
    ],
  },
];

const WorkbenchPage = () => {
  const [activeRole, setActiveRole] = useState<AdminRole>(AdminRole.SUPER_ADMIN);

  const visibleWorkItems = useMemo(
    () => workItems.filter((item) => item.allowed.includes(activeRole)),
    [activeRole]
  );

  return (
    <div style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto", paddingRight: 8 }}>
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex items-center justify-between">
          <Title level={3} className="m-0">
            工作台（模拟数据）
          </Title>
          <Segmented
            options={identityOptions}
            value={activeRole}
            onChange={(val) => setActiveRole(val as AdminRole)}
          />
        </div>

        {visibleWorkItems.map((item) => (
          <Card key={item.key} title={item.title} extra={<Tag color="blue">{activeRole}</Tag>}>
            <Paragraph className="mb-3">{item.description}</Paragraph>
            {item.stats && (
              <Row gutter={[16, 16]} className="mb-2">
                {item.stats.map((s) => (
                  <Col xs={12} md={6} key={s.label}>
                    <Card size="small" bordered>
                      <Text strong>{s.label}</Text>
                      <div className="text-lg">{s.value}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
            <Row gutter={[16, 16]}>
              {item.actions.map((action) => (
                <Col xs={24} md={12} key={action.label}>
                  <Card size="small" bordered>
                    <Text strong>{action.label}</Text>
                    <List
                      size="small"
                      dataSource={action.apis}
                      renderItem={(api) => (
                        <List.Item className="py-1">
                          <Text type="secondary" className="text-xs">
                            API: {api}
                          </Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        ))}
      </Space>
    </div>
  );
};

export default WorkbenchPage;
