import { useMemo, useState } from "react";
import { Card, Col, List, Row, Segmented, Space, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import { AdminRole } from "../../../utils/permission";

type WorkActionLink = {
  name: string;
  path?: string;
};

type WorkItemAction = {
  label: string;
  links: WorkActionLink[];
};

type WorkItem = {
  key: string;
  title: string;
  allowed: AdminRole[];
  description: string;
  stats?: { label: string; value: number | string }[];
  actions: WorkItemAction[];
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
      {
        label: "管理员管理",
        links: [
          { name: "用户列表", path: "/user/admin/list" },
          { name: "个人信息", path: "/account/info" },
        ],
      },
      {
        label: "绑定/调整身份",
        links: [{ name: "权限管理", path: "/user/admin/permission" }],
      },
      {
        label: "权限菜单",
        links: [
          { name: "权限详情", path: "/account/permission" },
          { name: "权限管理", path: "/user/admin/permission" },
        ],
      },
      {
        label: "踢下线/禁用/重置密码",
        links: [
          { name: "在线管理", path: "/user/admin/online" },
          { name: "账号安全", path: "/account/security" },
        ],
      },
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
      {
        label: "品牌与商品",
        links: [
          { name: "商品总览", path: "/goods/overview" },
          { name: "品牌·专区", path: "/goods/brand-zone" },
          { name: "商品管理", path: "/goods/manage" },
        ],
      },
      {
        label: "标签与配置",
        links: [{ name: "商品配置管理", path: "/goods/manage" }],
      },
      {
        label: "库存调整",
        links: [{ name: "库存管理", path: "/goods/category" }],
      },
      {
        label: "货架操作",
        links: [
          { name: "上架商品管理", path: "/mall/goods" },
          { name: "售货专区管理", path: "/mall/zone" },
          { name: "首页展示管理", path: "/mall/home" },
          { name: "新品展示管理", path: "/mall/new" },
        ],
      },
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
      { label: "订单流转", links: [{ name: "订单管理", path: "/order/manage" }] },
      { label: "售后处理", links: [{ name: "售后管理", path: "/after-sale" }] },
      { label: "投诉处理", links: [{ name: "投诉管理", path: "/complaint" }] },
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
      { label: "优惠券", links: [{ name: "优惠券管理", path: "/coupon/manage" }] },
      { label: "代金券发放", links: [{ name: "代金券管理", path: "/coupon/cash" }] },
      { label: "秒杀配置", links: [{ name: "秒杀活动", path: "/marketing/seckill" }] },
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
      { label: "会话列表", links: [{ name: "服务总览", path: "/customer-service/overview" }] },
      { label: "消息收发", links: [{ name: "会话中心", path: "/customer-service/session" }] },
      { label: "结束/撤回", links: [{ name: "评价管理", path: "/customer-service/evaluation" }] },
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
                      dataSource={action.links}
                      renderItem={(link) => (
                        <List.Item className="py-1">
                          {link.path ? (
                            <Link to={link.path}>
                              <Text type="secondary" className="text-xs">
                                {link.name}
                              </Text>
                            </Link>
                          ) : (
                            <Space size={6}>
                              <Tag color="red" className="m-0">
                                页面未实现
                              </Tag>
                              <Text type="secondary" className="text-xs">
                                {link.name}
                              </Text>
                            </Space>
                          )}
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
