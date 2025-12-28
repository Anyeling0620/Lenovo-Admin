import { useMemo, useState } from "react";
import { Card, Col, Row, Segmented, Space, Statistic, Tag, Typography, Divider, Tooltip, Badge } from "antd";
import { AdminRole } from "../../../utils/permission";

type DashboardSection = {
  key: string;
  title: string;
  allowed: AdminRole[];
  apiNote: string;
  stats: { label: string; value: number | string; trend?: string; highlight?: boolean }[];
};

const { Title, Paragraph, Text } = Typography;

type TrendPeriod = "daily" | "monthly" | "quarterly";

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

const mockSections: DashboardSection[] = [
  {
    key: "order",
    title: "订单与售后",
    allowed: [AdminRole.SUPER_ADMIN, AdminRole.SYSTEM_ADMIN, AdminRole.ORDER_MANAGER, AdminRole.AFTER_SALES],
    apiNote: "接口：GET /admin/orders；GET /admin/after-sales；GET /admin/complaints",
    stats: [
      { label: "今日订单数", value: 362, trend: "较昨日 +6%" },
      { label: "待发货", value: 58, highlight: true },
      { label: "售后待处理", value: 17, highlight: true },
      { label: "投诉未处理", value: 6, highlight: true },
      { label: "客单价", value: "¥5,280" },
    ],
  },
  {
    key: "product",
    title: "商品与货架",
    allowed: [AdminRole.SUPER_ADMIN, AdminRole.PRODUCT_MANAGER, AdminRole.WAREHOUSE_MANAGER],
    apiNote: "接口：GET /admin/products/stats；GET /admin/shelf/stats；GET /admin/stocks",
    stats: [
      { label: "商品总数", value: 1280 },
      { label: "在售", value: 940, trend: "环比 +3%" },
      { label: "覆盖类目", value: 12 },
      { label: "货架条目", value: 1860 },
      { label: "低库存告警", value: 24, highlight: true },
    ],
  },
  {
    key: "marketing",
    title: "营销概览",
    allowed: [AdminRole.SUPER_ADMIN, AdminRole.SYSTEM_ADMIN, AdminRole.MARKETING],
    apiNote: "接口：GET /admin/marketing/coupons；GET /admin/marketing/vouchers；GET /admin/marketing/coupons/:id/stats",
    stats: [
      { label: "有效优惠券", value: 12 },
      { label: "核销率", value: "42%" },
      { label: "代金券余额(k)", value: 680 },
      { label: "今日秒杀场次", value: 3 },
    ],
  },
  {
    key: "system",
    title: "系统与权限",
    allowed: [AdminRole.SUPER_ADMIN, AdminRole.SYSTEM_ADMIN],
    apiNote: "接口：GET /admin/system/admins；/system/identities；/system/permissions；/system/admins/online",
    stats: [
      { label: "管理员数", value: 48 },
      { label: "在线管理员", value: 9, trend: "实时" },
      { label: "身份数", value: 8 },
      { label: "权限点", value: 112 },
    ],
  },
  {
    key: "service",
    title: "客服概览",
    allowed: [AdminRole.SUPER_ADMIN, AdminRole.SYSTEM_ADMIN, AdminRole.CUSTOMER_SERVICE],
    apiNote: "接口：GET /admin/service/sessions；GET /admin/service/sessions/:room_id/messages",
    stats: [
      { label: "活跃会话", value: 34 },
      { label: "未读消息", value: 128, highlight: true },
      { label: "平均首响(分钟)", value: 2.8 },
    ],
  },
];

const trendData: Record<TrendPeriod, { label: string; value: number }[]> = {
  daily: [
    { label: "D-6", value: 120 },
    { label: "D-5", value: 132 },
    { label: "D-4", value: 118 },
    { label: "D-3", value: 150 },
    { label: "D-2", value: 141 },
    { label: "D-1", value: 166 },
    { label: "今天", value: 158 },
  ],
  monthly: [
    { label: "M-5", value: 3200 },
    { label: "M-4", value: 3450 },
    { label: "M-3", value: 3380 },
    { label: "M-2", value: 3720 },
    { label: "M-1", value: 4100 },
    { label: "本月", value: 3980 },
  ],
  quarterly: [
    { label: "Q1", value: 8900 },
    { label: "Q2", value: 9400 },
    { label: "Q3", value: 10200 },
    { label: "Q4", value: 9800 },
  ],
};

const Sparkline = ({ data, width = 420, height = 140 }: { data: { label: string; value: number }[]; width?: number; height?: number }) => {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const padding = 12;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const range = max === min ? 1 : max - min;

  const points = data.map((d, idx) => {
    const x = padding + (innerW * idx) / (data.length - 1 || 1);
    const y = padding + innerH - (innerH * (d.value - min)) / range;
    return { x, y };
  });

  return (
    <svg width={width} height={height} role="img" aria-label="trend sparkline">
      <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#1677ff" strokeWidth={2} />
      {points.map((p, idx) => (
        <circle key={idx} cx={p.x} cy={p.y} r={3} fill="#1677ff" />
      ))}
      <polyline
        points={`${points.map((p) => `${p.x},${p.y}`).join(" ")} ${points[points.length - 1].x},${height - padding} ${points[0].x},${height - padding}`}
        fill="rgba(22,119,255,0.08)"
        stroke="none"
      />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" strokeWidth={1} />
      <text x={padding} y={padding + 10} fontSize={11} fill="#666">
        最高 {max}
      </text>
      <text x={padding} y={height - padding + 12} fontSize={11} fill="#999">
        最低 {min}
      </text>
    </svg>
  );
};

const DashboardPage = () => {
  const [activeRole, setActiveRole] = useState<AdminRole>(AdminRole.SUPER_ADMIN);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("daily");

  const visibleSections = useMemo(
    () => mockSections.filter((section) => section.allowed.includes(activeRole)),
    [activeRole]
  );

  return (
    <div style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto", paddingRight: 8 }}>
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex items-center justify-between">
          <Title level={3} className="m-0">
            数据总览（模拟数据）
          </Title>
          <Segmented
            options={identityOptions}
            value={activeRole}
            onChange={(val) => setActiveRole(val as AdminRole)}
          />
        </div>

        <Card
          title="订单量趋势（模拟时间序列）"
          extra={
            <Segmented
              options={[
                { label: "日报", value: "daily" },
                { label: "月报", value: "monthly" },
                { label: "季报", value: "quarterly" },
              ]}
              value={trendPeriod}
              onChange={(val) => setTrendPeriod(val as TrendPeriod)}
            />
          }
        >
          <Paragraph type="secondary" className="mb-3 text-xs">
            当前接口返回全量数据，趋势为前端模拟分桶示例；真实按日/月/季可基于返回的订单创建时间自行分组统计。
          </Paragraph>
          <Sparkline data={trendData[trendPeriod]} />
          <Divider className="my-3" />
          <Row gutter={[16, 16]}>
            {trendData[trendPeriod].map((d) => (
              <Col xs={12} md={6} lg={4} key={d.label}>
                <Card size="small">
                  <Statistic title={d.label} value={d.value} />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {visibleSections.map((section) => (
          <Card key={section.key} title={section.title} extra={<Tag color="blue">{activeRole}</Tag>}>
            <Row gutter={[16, 16]}>
              {section.stats.map((item) => (
                <Col xs={24} sm={12} md={8} lg={6} key={item.label}>
                  <Card size="small" bordered>
                    <div className="flex items-center justify-between">
                      <Statistic title={item.label} value={item.value} />
                      {item.highlight ? <Badge color="red" /> : null}
                    </div>
                    {item.trend ? (
                      <Paragraph type="secondary" className="mt-1 mb-0 text-xs">
                        {item.trend}
                      </Paragraph>
                    ) : null}
                  </Card>
                </Col>
              ))}
            </Row>
            <Paragraph type="secondary" className="mt-3 mb-0 text-xs">
              {section.apiNote}
            </Paragraph>
          </Card>
        ))}
      </Space>
    </div>
  );
};

export default DashboardPage;
