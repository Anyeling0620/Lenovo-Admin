/**
 * 🔧 Goods API 诊断脚本
 * 
 * 使用方法：
 * 1. 打开 https://admin.jxutcm.top 并登录
 * 2. 按 F12 打开开发者工具
 * 3. 切换到 Console 标签页
 * 4. 复制并粘贴以下代码运行
 */

(async function diagnoseGoodsAPI() {
    console.log('%c🔧 开始诊断 Goods API 问题', 'font-size: 16px; font-weight: bold; color: #667eea');
    console.log('='.repeat(60));
    
    // 获取当前配置
    const apiBase = import.meta.env?.VITE_API_BASE_URL || '未知';
    const sessionId = localStorage.getItem('admin_sessionId');
    
    console.log('📍 当前 API 地址:', apiBase);
    console.log('🔑 Session ID:', sessionId ? '已设置 (' + sessionId.slice(0, 20) + '...)' : '❌ 未设置');
    console.log('');
    
    // 定义要测试的 API
    const goodsAPIs = [
        { name: '品牌列表', path: '/admin/brands' },
        { name: '分类列表', path: '/admin/categories' },
        { name: '商品列表', path: '/admin/products' },
        { name: '库存列表', path: '/admin/stocks' },
        { name: '标签列表', path: '/admin/tags' },
        { name: '商品统计', path: '/admin/products/stats' },
    ];
    
    const otherAPIs = [
        { name: '账户信息', path: '/admin/account/profile' },
        { name: '管理员列表', path: '/admin/system/admins' },
        { name: '订单列表', path: '/admin/orders' },
    ];
    
    console.log('%c📦 测试 Goods 相关 API', 'font-weight: bold; color: #dc3545');
    console.log('-'.repeat(40));
    
    for (const api of goodsAPIs) {
        await testAPI(api.name, apiBase + api.path, sessionId);
    }
    
    console.log('');
    console.log('%c🔄 对比测试其他 API', 'font-weight: bold; color: #28a745');
    console.log('-'.repeat(40));
    
    for (const api of otherAPIs) {
        await testAPI(api.name, apiBase + api.path, sessionId);
    }
    
    console.log('');
    console.log('%c📊 诊断总结', 'font-size: 14px; font-weight: bold; color: #667eea');
    console.log('='.repeat(60));
    console.log('如果 Goods API 全部失败但其他 API 正常:');
    console.log('  1. 检查后端是否实现了 /admin/brands 等路由');
    console.log('  2. 检查数据库中 Brand, Category, Product 等表是否存在');
    console.log('  3. 查看后端日志获取详细错误信息');
    console.log('');
    console.log('如果所有 API 都失败:');
    console.log('  1. 检查 API 地址配置是否正确');
    console.log('  2. 检查是否已登录并有有效的 Session');
    console.log('  3. 检查 CORS 配置');
    
    async function testAPI(name, url, sessionId) {
        try {
            console.log(`🔄 测试 ${name}: ${url}`);
            
            const headers = {
                'Content-Type': 'application/json'
            };
            if (sessionId) {
                headers['X-Session-ID'] = sessionId;
            }
            
            const startTime = performance.now();
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: headers
            });
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(0);
            
            // 检查 HTTP 状态
            console.log(`   HTTP ${response.status} ${response.statusText} (${duration}ms)`);
            
            if (!response.ok) {
                console.log(`   ❌ HTTP 错误: ${response.status}`);
                if (response.status === 404) {
                    console.log(`   💡 提示: 后端可能未实现该路由`);
                } else if (response.status === 401) {
                    console.log(`   💡 提示: 未授权，请检查登录状态`);
                } else if (response.status === 500) {
                    console.log(`   💡 提示: 后端内部错误，请查看服务器日志`);
                }
                return;
            }
            
            const data = await response.json();
            
            // 检查业务状态码
            if (data.code !== undefined) {
                if (data.code.toString().startsWith('2')) {
                    const result = data.data;
                    const isArray = Array.isArray(result);
                    const count = isArray ? result.length : 'N/A';
                    console.log(`   ✅ 成功 | code: ${data.code} | 数据量: ${count}`);
                    
                    if (isArray && result.length === 0) {
                        console.log(`   ⚠️ 警告: 返回空数组，数据库可能没有数据`);
                    }
                } else if (data.code === 401) {
                    console.log(`   ❌ 业务错误: 未授权 (code: 401)`);
                    console.log(`   💡 提示: Session 可能已过期，请重新登录`);
                } else {
                    console.log(`   ❌ 业务错误: ${data.message} (code: ${data.code})`);
                }
            } else {
                console.log(`   ⚠️ 响应格式异常: 缺少 code 字段`);
                console.log(`   原始响应:`, data);
            }
            
        } catch (error) {
            console.log(`   ❌ 网络错误: ${error.message}`);
            if (error.message.includes('Failed to fetch')) {
                console.log(`   💡 可能原因:`);
                console.log(`      - API 服务器未启动或不可访问`);
                console.log(`      - CORS 配置问题`);
                console.log(`      - 网络连接问题`);
            }
        }
        console.log('');
    }
})();
