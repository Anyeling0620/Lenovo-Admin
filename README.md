
# 联想商城管理端（`Lenovo-Admin`）

这是联想商城三件套中的**管理面板/中后台**项目，用于运营人员与管理员对商城的商品、营销、订单、售后、权限等进行管理。

为避免一个 README 过长，本项目把“按菜单的详细使用说明”和“常见问题/排错”拆分到了 `docs/` 目录。你可以把这里当作**入口页**。

---

## ✅ 快速入口（推荐从这里开始）

- 文档导航：[`docs/README.md`](docs/README.md)
- 常见问题与排错（FAQ）：[`docs/faq.md`](docs/faq.md)
	- 新增商品后台有了但前台不显示：
		- [FAQ：新增商品但前台不显示](docs/faq.md#1-我在后台新增商品成功了但前台商城不显示)

## 📚 分模块使用手册

- 商品与库存：[`docs/goods-and-stock.md`](docs/goods-and-stock.md)
- 商城运营位（上架/首页/新品）：[`docs/mall-ops.md`](docs/mall-ops.md)
- 营销中心（优惠券/代金券/秒杀）：[`docs/marketing.md`](docs/marketing.md)
- 订单与售后（订单/发货/售后/投诉）：[`docs/orders-and-aftersale.md`](docs/orders-and-aftersale.md)
- 用户与权限（管理员/身份/在线管理）：[`docs/users-and-permissions.md`](docs/users-and-permissions.md)

---

## 一、跑起来（开发/联调）

### 0) 依赖关系：你先要有后端

管理端本身不提供数据，必须连接你这套项目里的后端（`lenovo-shop-server`）。

管理端默认认为后端根地址是 `http://localhost:3003`（可在 `lenovo-admin/.env` 修改）。

### 1) 安装依赖

优先使用 `pnpm`（项目已锁定 `packageManager`）。

```bash
pnpm install
```

### 2) 配置环境变量（务必检查）

打开 `lenovo-admin/.env`：

```properties
VITE_API_BASE_URL=http://localhost:3003
VITE_PUBLIC_LENOVO_IMAGE_PATH=static/images/lenovo/
```

说明：

- `VITE_API_BASE_URL`：后端根地址
- `VITE_PUBLIC_LENOVO_IMAGE_PATH`：图片静态资源相对路径（部署目录不同需同步调整）

### 3) 启动管理端

```bash
pnpm dev
```

启动后访问：

- `http://localhost:3010`

---

## 二、登录与使用说明（简版）

- 登录入口：访问站点后未登录会跳转到登录页
- 登录页有滑块拼图验证：通过验证后才会提交登录
- 默认演示账号在登录页内置（是否可用取决于后端是否已初始化该账号）

---

## ✅ 我该先看哪一份文档？（场景建议）

- 我能启动项目，但不知道后台怎么操作：从 [`docs/README.md`](docs/README.md) 进。
- 我新增了商品但前台不显示：直达 [`docs/faq.md`](docs/faq.md) 的第 1 条。
- 我要把商品变成“可售”：看 [`docs/goods-and-stock.md`](docs/goods-and-stock.md) 的最小验证清单。
- 我要配首页/新品展示位：看 [`docs/mall-ops.md`](docs/mall-ops.md)。



