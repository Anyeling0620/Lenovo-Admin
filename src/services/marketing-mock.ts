import type {
  CouponCenterRequest,
  CouponCenterResponse,
  CouponCreateRequest,
  CouponResponse,
  CouponStatsResponse,
  CouponUserResponse,
  VoucherResponse,
  VoucherCreateRequest,
  VoucherUserResponse,
  IssueVoucherRequest,
  SeckillRoundResponse,
  SeckillRoundCreateRequest,
  SeckillProductCreateRequest,
  SeckillConfigCreateRequest,
  SeckillType,
  ProductListItem,
} from './api-type';

const delay = (ms = 220) => new Promise(resolve => setTimeout(resolve, ms));

const mockCoupons: CouponResponse[] = [
  {
    coupon_id: 'coupon_1001',
    name: '新人满减50',
    type: '满减',
    amount: 50,
    discount: 0,
    threshold: 299,
    start_time: '2025-01-01T00:00:00Z',
    expire_time: '2025-03-31T23:59:59Z',
    is_stackable: true,
    center: null,
    products: [],
  },
  {
    coupon_id: 'coupon_1002',
    name: '老客9折券',
    type: '折扣',
    amount: 0,
    discount: 9,
    threshold: 199,
    start_time: '2025-02-01T00:00:00Z',
    expire_time: '2025-04-30T23:59:59Z',
    is_stackable: false,
    center: null,
    products: [],
  },
  {
    coupon_id: 'coupon_1003',
    name: '配件满200减30',
    type: '满减',
    amount: 30,
    discount: 0,
    threshold: 200,
    start_time: '2024-12-20T00:00:00Z',
    expire_time: '2025-02-28T23:59:59Z',
    is_stackable: true,
    center: null,
    products: [],
  },
];

const mockCenters: CouponCenterResponse[] = [
  {
    coupon_center_id: 'center_1',
    coupon_id: 'coupon_1001',
    coupon_name: '新人满减50',
    start_time: '2025-01-01T00:00:00Z',
    end_time: '2025-03-31T23:59:59Z',
    total_num: 5000,
    limit_num: 1,
  },
  {
    coupon_center_id: 'center_2',
    coupon_id: 'coupon_1002',
    coupon_name: '老客9折券',
    start_time: '2025-02-01T00:00:00Z',
    end_time: '2025-04-15T23:59:59Z',
    total_num: 2000,
    limit_num: 2,
  },
];

mockCoupons.forEach(coupon => {
  const center = mockCenters.find(item => item.coupon_id === coupon.coupon_id);
  coupon.center = center ?? null;
});

const mockCouponUsers: Record<string, CouponUserResponse[]> = {
  coupon_1001: Array.from({ length: 6 }).map((_, index) => ({
    user_coupon_id: `u-c1-${index + 1}`,
    user_id: `user_${index + 1}`,
    user_account: `user${index + 1}@mail.com`,
    status: index % 2 === 0 ? 'USED' : 'NOT_USED',
    receive_time: '2025-01-05T10:00:00Z',
    use_time: index % 2 === 0 ? '2025-01-12T09:30:00Z' : null,
    order_id: index % 2 === 0 ? `order_${1000 + index}` : null,
    actual_amount: index % 2 === 0 ? 249 : 0,
  })),
  coupon_1002: Array.from({ length: 4 }).map((_, index) => ({
    user_coupon_id: `u-c2-${index + 1}`,
    user_id: `vip_${index + 1}`,
    user_account: `vip${index + 1}@lenovo.com`,
    status: 'NOT_USED',
    receive_time: '2025-02-03T12:20:00Z',
    use_time: null,
    order_id: null,
    actual_amount: 0,
  })),
  coupon_1003: [],
};

const mockCouponStats: Record<string, CouponStatsResponse> = {
  coupon_1001: { total: 5000, used: 1730, unused: 3270 },
  coupon_1002: { total: 2000, used: 320, unused: 1680 },
  coupon_1003: { total: 800, used: 95, unused: 705 },
};

const mockProducts: ProductListItem[] = [
  {
    product_id: 'p1001',
    name: 'ThinkPad X1 Carbon 2025',
    brand_id: 'b01',
    brand_name: 'ThinkPad',
    category_id: 'c-notebook',
    category_name: '笔记本',
    status: '正常',
    main_image: '',
    created_at: '2025-01-05T10:00:00Z',
  },
  {
    product_id: 'p1002',
    name: '拯救者 R9000P 2025',
    brand_id: 'b02',
    brand_name: '拯救者',
    category_id: 'c-notebook',
    category_name: '游戏本',
    status: '正常',
    main_image: '',
    created_at: '2025-02-10T10:00:00Z',
  },
  {
    product_id: 'p1003',
    name: '小新 Pad Pro',
    brand_id: 'b03',
    brand_name: '小新',
    category_id: 'c-tablet',
    category_name: '平板',
    status: '正常',
    main_image: '',
    created_at: '2024-12-20T10:00:00Z',
  },
];

type MockSeckillConfig = {
  seckill_product_config_id: string;
  seckill_product_id: string;
  config_id: string;
  config1: string;
  config2?: string;
  config3?: string;
  shelf_num: number;
  seckill_price: number;
};

type MockSeckillProduct = {
  seckill_product_id: string;
  round_id: string;
  product_id: string;
  product_name: string;
  type: SeckillType;
  reduce_amount?: number;
  discount?: number;
  configs: MockSeckillConfig[];
};

type MockSeckillRound = SeckillRoundResponse & { products: MockSeckillProduct[] };

const mockSeckillRounds: MockSeckillRound[] = [
  {
    seckill_round_id: 'round_1001',
    title: '元旦秒杀专场',
    start_time: '2025-01-01T08:00:00Z',
    end_time: '2025-01-01T23:59:59Z',
    status: '启用',
    products: [],
  },
  {
    seckill_round_id: 'round_1002',
    title: '开工大促',
    start_time: '2025-02-10T08:00:00Z',
    end_time: '2025-02-11T23:59:59Z',
    status: '启用',
    products: [],
  },
];

const mockVouchers: VoucherResponse[] = [
  {
    voucher_id: 'voucher_2001',
    title: '满500减100 代金券',
    original_amount: 100,
    start_time: '2025-01-01T00:00:00Z',
    end_time: '2025-04-30T23:59:59Z',
  },
  {
    voucher_id: 'voucher_2002',
    title: '老客专享 200 元',
    original_amount: 200,
    start_time: '2025-02-01T00:00:00Z',
    end_time: '2025-05-31T23:59:59Z',
  },
];

const mockVoucherUsers: Record<string, VoucherUserResponse[]> = {
  voucher_2001: Array.from({ length: 5 }).map((_, i) => ({
    user_voucher_id: `vu-1-${i + 1}`,
    user_id: `user_${i + 1}`,
    user_account: `user${i + 1}@mail.com`,
    get_time: '2025-01-08T10:00:00Z',
    use_up_time: i % 2 === 0 ? '2025-01-18T11:00:00Z' : null,
    remain_amount: i % 2 === 0 ? 0 : 40,
  })),
  voucher_2002: Array.from({ length: 3 }).map((_, i) => ({
    user_voucher_id: `vu-2-${i + 1}`,
    user_id: `vip_${i + 1}`,
    user_account: `vip${i + 1}@lenovo.com`,
    get_time: '2025-02-05T12:30:00Z',
    use_up_time: null,
    remain_amount: 200,
  })),
};

export const marketingMock = {
  async listCoupons(): Promise<CouponResponse[]> {
    await delay();
    return mockCoupons.map(item => ({ ...item }));
  },
  async listCouponCenters(): Promise<CouponCenterResponse[]> {
    await delay();
    return mockCenters.map(item => ({ ...item }));
  },
  async getCouponDetail(couponId: string): Promise<CouponResponse | null> {
    await delay();
    const found = mockCoupons.find(item => item.coupon_id === couponId);
    return found ? { ...found } : null;
  },
  async createCoupon(payload: CouponCreateRequest): Promise<{ coupon_id: string }> {
    await delay();
    const newId = `coupon_${Date.now()}`;
    mockCoupons.unshift({
      coupon_id: newId,
      name: payload.name,
      type: payload.type,
      amount: Number(payload.amount || 0),
      discount: Number(payload.discount || 0),
      threshold: Number(payload.threshold || 0),
      start_time: payload.start_time,
      expire_time: payload.expire_time,
      is_stackable: Boolean(payload.is_stackable),
      center: null,
      products: [],
    });
    return { coupon_id: newId };
  },
  async listCouponUsers(couponId: string): Promise<CouponUserResponse[]> {
    await delay();
    return (mockCouponUsers[couponId] || []).map(item => ({ ...item }));
  },
  async getCouponStats(couponId: string): Promise<CouponStatsResponse> {
    await delay();
    return mockCouponStats[couponId] ?? { total: 0, used: 0, unused: 0 };
  },
  async setCouponCenter(payload: CouponCenterRequest): Promise<{ coupon_center_id: string }> {
    await delay();
    const existing = mockCenters.find(center => center.coupon_id === payload.coupon_id);
    const id = existing?.coupon_center_id ?? `center_${Date.now()}`;
    const nextCenter: CouponCenterResponse = {
      coupon_center_id: id,
      coupon_id: payload.coupon_id,
      coupon_name: mockCoupons.find(item => item.coupon_id === payload.coupon_id)?.name,
      start_time: payload.start_time,
      end_time: payload.end_time,
      total_num: payload.total_num,
      limit_num: payload.limit_num,
    };
    if (existing) {
      Object.assign(existing, nextCenter);
    } else {
      mockCenters.unshift(nextCenter);
    }
    mockCoupons.forEach(coupon => {
      coupon.center = coupon.coupon_id === payload.coupon_id ? nextCenter : coupon.center;
    });
    return { coupon_center_id: id };
  },
  async listVouchers(): Promise<VoucherResponse[]> {
    await delay();
    return mockVouchers.map(item => ({ ...item }));
  },
  async createVoucher(payload: VoucherCreateRequest): Promise<{ voucher_id: string }> {
    await delay();
    const id = `voucher_${Date.now()}`;
    mockVouchers.unshift({
      voucher_id: id,
      title: payload.title,
      original_amount: Number(payload.original_amount || 0),
      start_time: payload.start_time,
      end_time: payload.end_time,
    });
    mockVoucherUsers[id] = [];
    return { voucher_id: id };
  },
  async listVoucherUsers(voucherId: string): Promise<VoucherUserResponse[]> {
    await delay();
    return (mockVoucherUsers[voucherId] || []).map(item => ({ ...item }));
  },
  async issueVoucher(voucherId: string, payload: IssueVoucherRequest): Promise<null> {
    await delay();
    const now = new Date().toISOString();
    if (!mockVoucherUsers[voucherId]) {
      mockVoucherUsers[voucherId] = [];
    }
    payload.user_ids.forEach((userId, index) => {
      mockVoucherUsers[voucherId].push({
        user_voucher_id: `vu-${voucherId}-${Date.now()}-${index}`,
        user_id: userId,
        user_account: userId,
        get_time: now,
        use_up_time: null,
        remain_amount: mockVouchers.find(v => v.voucher_id === voucherId)?.original_amount ?? 0,
      });
    });
    return null;
  },
  async listProducts(): Promise<ProductListItem[]> {
    await delay();
    return mockProducts.map(p => ({ ...p }));
  },
  async listSeckillRounds(): Promise<MockSeckillRound[]> {
    await delay();
    return mockSeckillRounds.map(round => ({
      ...round,
      products: round.products.map(p => ({
        ...p,
        configs: p.configs.map(c => ({ ...c })),
      })),
    }));
  },
  async createSeckillRound(payload: SeckillRoundCreateRequest): Promise<{ seckill_round_id: string }> {
    await delay();
    const id = `round_${Date.now()}`;
    mockSeckillRounds.unshift({
      seckill_round_id: id,
      title: payload.title,
      start_time: payload.start_time,
      end_time: payload.end_time,
      status: payload.status ?? '启用',
      products: [],
    });
    return { seckill_round_id: id };
  },
  async addSeckillProduct(payload: SeckillProductCreateRequest & { product_name?: string }): Promise<{ seckill_product_id: string }> {
    await delay();
    const round = mockSeckillRounds.find(r => r.seckill_round_id === payload.round_id);
    const id = `sp_${Date.now()}`;
    if (round) {
      round.products.push({
        seckill_product_id: id,
        round_id: payload.round_id,
        product_id: payload.product_id,
        product_name: payload.product_name || `商品${payload.product_id}`,
        type: payload.type,
        reduce_amount: payload.reduce_amount ? Number(payload.reduce_amount) : undefined,
        discount: payload.discount ? Number(payload.discount) : undefined,
        configs: [],
      });
    }
    return { seckill_product_id: id };
  },
  async addSeckillConfig(payload: SeckillConfigCreateRequest & { config1?: string; config2?: string; config3?: string }): Promise<{ seckill_product_config_id: string }> {
    await delay();
    const product = mockSeckillRounds.flatMap(r => r.products).find(p => p.seckill_product_id === payload.seckill_product_id);
    const id = `spc_${Date.now()}`;
    if (product) {
      product.configs.push({
        seckill_product_config_id: id,
        seckill_product_id: payload.seckill_product_id,
        config_id: payload.config_id,
        config1: payload.config1 || '默认配置',
        config2: payload.config2,
        config3: payload.config3,
        shelf_num: payload.shelf_num,
        seckill_price: Number(payload.seckill_price),
      });
    }
    return { seckill_product_config_id: id };
  },
};
