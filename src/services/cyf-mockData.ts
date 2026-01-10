/* eslint-disable @typescript-eslint/no-unused-vars */
import dayjs from 'dayjs';
import type { 
  BrandResponse, CategoryResponse, TagResponse, 
  ProductDetailResponse, ProductConfigResponse, BrandStatus, 
  CategoryStatus, TagStatus, ProductStatus, ProductConfigStatus,
  StockResponse
} from './api-type';

// 模拟品牌数据
export const mockBrands: BrandResponse[] = [
  { brand_id: 'b1', name: 'ThinkPad', code: 'THINKPAD', status: '启用' as BrandStatus, logo: null, description: null, created_at: dayjs().toISOString(), creator_id: 'admin', updated_at: dayjs().toISOString(), remark: undefined },
  { brand_id: 'b2', name: 'Legion (拯救者)', code: 'LEGION', status: '启用' as BrandStatus, logo: null, description: null, created_at: dayjs().toISOString(), creator_id: 'admin', updated_at: dayjs().toISOString(), remark: undefined },
  { brand_id: 'b3', name: 'YOGA', code: 'YOGA', status: '启用' as BrandStatus, logo: null, description: null, created_at: dayjs().toISOString(), creator_id: 'admin', updated_at: dayjs().toISOString(), remark: undefined },
  { brand_id: 'b4', name: 'Xiaoxin (小新)', code: 'XIAOXIN', status: '启用' as BrandStatus, logo: null, description: null, created_at: dayjs().toISOString(), creator_id: 'admin', updated_at: dayjs().toISOString(), remark: undefined },
  { brand_id: 'b5', name: 'Motorola', code: 'MOTO', status: '启用' as BrandStatus, logo: null, description: null, created_at: dayjs().toISOString(), creator_id: 'admin', updated_at: dayjs().toISOString(), remark: undefined },
];

// 模拟分类数据
export const mockCategories: CategoryResponse[] = [
  { category_id: 'c1', name: '轻薄本', code: 'ULTRABOOK', parent_id: null, status: '启用' as CategoryStatus },
  { category_id: 'c2', name: '游戏本', code: 'GAMING', parent_id: null, status: '启用' as CategoryStatus },
  { category_id: 'c3', name: '台式机', code: 'DESKTOP', parent_id: null, status: '启用' as CategoryStatus },
  { category_id: 'c4', name: '平板电脑', code: 'TABLET', parent_id: null, status: '启用' as CategoryStatus },
  { category_id: 'c5', name: '手机', code: 'PHONE', parent_id: null, status: '启用' as CategoryStatus },
];

// 模拟标签数据
export const mockTags: TagResponse[] = [
  { tag_id: 't1', name: '热销爆款', priority: 1, status: '启用' as TagStatus },
  { tag_id: 't2', name: '新品上市', priority: 2, status: '启用' as TagStatus },
  { tag_id: 't3', name: '限时特惠', priority: 3, status: '启用' as TagStatus },
  { tag_id: 't4', name: '经典产品', priority: 4, status: '启用' as TagStatus },
  { tag_id: 't5', name: '商务旗舰', priority: 5, status: '启用' as TagStatus },
];

// 商品模板
const productTemplates = [
  { name: "ThinkPad X1 Carbon Gen 12", subTitle: "AI 商务旗舰", brandId: "b1", categoryId: "c1", price: 14999 },
  { name: "Legion Y9000P 2024", subTitle: "i9-14900HX 满血战神", brandId: "b2", categoryId: "c2", price: 10999 },
  { name: "Xiaoxin Pro 16", subTitle: "锐龙7 8845H 高能本", brandId: "b4", categoryId: "c1", price: 5999 },
  { name: "YOGA Air 14", subTitle: "轻盈灵动 OLED", brandId: "b3", categoryId: "c1", price: 8499 },
  { name: "moto razr 40 Ultra", subTitle: "折叠屏 骁龙8+", brandId: "b5", categoryId: "c5", price: 5699 },
  { name: "ThinkPad T14 Gen 4", subTitle: "商务精英首选", brandId: "b1", categoryId: "c1", price: 8999 },
  { name: "Legion R9000P 2024", subTitle: "RTX 4090 电竞旗舰", brandId: "b2", categoryId: "c2", price: 15999 },
  { name: "Xiaoxin Air 14", subTitle: "超薄便携", brandId: "b4", categoryId: "c1", price: 4999 },
  { name: "YOGA Pro 14s", subTitle: "3K OLED 专业创作", brandId: "b3", categoryId: "c1", price: 9999 },
  { name: "moto edge 40 Pro", subTitle: "曲面屏 骁龙8 Gen2", brandId: "b5", categoryId: "c5", price: 4399 },
];

// 生成模拟商品数据
export const generateMockProducts = (count: number): any[] => {
  return Array.from({ length: count }).map((_, i) => {
    const tpl = productTemplates[i % productTemplates.length];
    // 调整状态分布
    let statusStr: ProductStatus = '正常';
    if (i % 4 === 0) statusStr = '下架';
    if (i % 15 === 0) statusStr = '删除';

    // 生成随机图片URL
    const imageIndex = Math.floor(Math.random() * 10) + 1;
    const mainImage = `https://picsum.photos/800/800?random=${imageIndex}&product=${i}`;
    
    // 模拟标签
    const tags = [];
    if (i % 2 === 0) tags.push({tag_id: 't1', tag_name: '热销爆款'});
    if (i % 3 === 0) tags.push({tag_id: 't2', tag_name: '新品上市'});
    if (i % 5 === 0) tags.push({tag_id: 't3', tag_name: '限时特惠'});

    return {
      product_id: `prod-${1000 + i}`,
      brand_id: tpl.brandId,
      brand_name: mockBrands.find(b => b.brand_id === tpl.brandId)?.name || tpl.brandId,
      category_id: tpl.categoryId,
      category_name: mockCategories.find(c => c.category_id === tpl.categoryId)?.name || tpl.categoryId,
      name: `${tpl.name} ${i > 4 ? `(批次${i})` : ''}`,
      sub_title: tpl.subTitle,
      description: `<p>这是 ${tpl.name} 的详细描述...<br/>产品特点：<br/>1. 高性能处理器<br/>2. 超长续航<br/>3. 轻薄便携<br/>4. 优质售后服务</p>`,
      main_image: mainImage,
      created_at: dayjs().subtract(i, 'day').toISOString(),
      creator_id: `admin-${Math.floor(Math.random() * 5) + 1}`,
      updated_at: dayjs().subtract(Math.floor(Math.random() * 10), 'hour').toISOString(),
      status: statusStr,
      stockTotal: Math.floor(Math.random() * 200),
      sale_price_range: `¥${tpl.price}`,
      tags: tags,
      // 模拟 banner 和 appearance 数据
      banners: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, idx) => ({
        product_banner_id: `bn-${i}-${idx}`,
        image: `https://picsum.photos/800/400?random=${imageIndex + idx}&banner=${i}`,
        sort: idx + 1
      })),
      appearances: Array.from({ length: Math.floor(Math.random() * 4) + 2 }).map((_, idx) => ({
        product_appearance_id: `app-${i}-${idx}`,
        image: `https://picsum.photos/1000/800?random=${imageIndex + idx + 5}&appearance=${i}`
      }))
    };
  });
};

// 模拟商品配置
export const generateMockProductConfigs = (productId: string): ProductConfigResponse[] => {
  const configs = [
    { config1: '黑色', config2: '16GB', config3: '512GB', sale_price: 8999, original_price: 9999 },
    { config1: '银色', config2: '16GB', config3: '1TB', sale_price: 9999, original_price: 10999 },
    { config1: '深空灰', config2: '32GB', config3: '1TB', sale_price: 11999, original_price: 12999 },
    { config1: '蓝色', config2: '8GB', config3: '256GB', sale_price: 7999, original_price: 8999 },
  ];
  
  return configs.map((config, index) => ({
    product_config_id: `config-${productId}-${index}`,
    product_id: productId,
    config1: config.config1,
    config2: config.config2,
    config3: config.config3,
    sale_price: config.sale_price,
    original_price: config.original_price,
    status: '正常' as ProductConfigStatus,
    image: `https://picsum.photos/300/300?random=${index}&config=${productId}`,
    stock: {
      stock_id: `stock-${productId}-${index}`,
      stock_num: Math.floor(Math.random() * 100),
      warn_num: 10,
      freeze_num: Math.floor(Math.random() * 5)
    }
  }));
};

// 模拟商品统计数据
export const mockProductStats = {
  total: 25,
  normal: 18,
  off: 6,
  deleted: 1,
  brands: 5
};

// 查找商品详情
export const findMockProductDetail = (productId: string): any => {
  const products = generateMockProducts(25);
  return products.find(p => p.product_id === productId);
};

// 模拟数据存储 - 用于持久化模拟数据
let mockStocksCache: StockResponse[] = [];

// 生成模拟库存数据（符合API结构）
export const generateMockStocks = (): StockResponse[] => {
  // 如果缓存中有数据，直接返回
  if (mockStocksCache.length > 0) {
    return mockStocksCache;
  }
  
  const stocks: StockResponse[] = [];
  const products = generateMockProducts(25);
  
  products.forEach(product => {
    const configs = generateMockProductConfigs(product.product_id);
    configs.forEach((config, index) => {
      stocks.push({
        stock_id: `stock-${Date.now()}-${index}`,
        stock_num: Math.floor(Math.random() * 200),
        warn_num: 10,
        freeze_num: Math.floor(Math.random() * 5),
        config_id: config.product_config_id,
        product_id: product.product_id,
        product_name: product.name,
        config1: config.config1,
        config2: config.config2,
        config3: config.config3,
        // 添加API中定义的字段
        updated_at: new Date().toISOString(),
        last_in_time: new Date(Date.now() - 86400000).toISOString(), // 昨天
        last_out_time: new Date(Date.now() - 3600000).toISOString(), // 1小时前
      });
    });
  });
  
  // 缓存生成的数据
  mockStocksCache = stocks;
  return stocks;
};

// 查找库存
export const findMockStock = (stockId: string): StockResponse | undefined => {
  // 确保缓存已初始化
  if (mockStocksCache.length === 0) {
    generateMockStocks();
  }
  return mockStocksCache.find(stock => stock.stock_id === stockId);
};

// 查找配置
export const findMockConfig = (configId: string): ProductConfigResponse & { product_name: string } | null => {
  const products = generateMockProducts(25);
  for (const product of products) {
    const configs = generateMockProductConfigs(product.product_id);
    const config = configs.find(c => c.product_config_id === configId);
    if (config) {
      return {
        ...config,
        product_name: product.name,
      };
    }
  }
  return null;
};

// 更新库存（使用configId）
export const updateMockStock = (configId: string, data: { 
  stock_num: number; 
  warn_num: number; 
}): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 确保缓存已初始化
      if (mockStocksCache.length === 0) {
        generateMockStocks();
      }
      
      // 查找并更新库存
      const stockIndex = mockStocksCache.findIndex(stock => stock.config_id === configId);
      if (stockIndex !== -1) {
        // 更新库存数据
        mockStocksCache[stockIndex] = {
          ...mockStocksCache[stockIndex],
          stock_num: data.stock_num,
          warn_num: data.warn_num,
          updated_at: new Date().toISOString(),
        };
        console.log('成功更新库存 by configId:', configId, data);
        resolve(true);
      } else {
        console.log('未找到库存 by configId:', configId);
        resolve(false);
      }
    }, 300);
  });
};