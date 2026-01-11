/* eslint-disable @typescript-eslint/no-explicit-any */
/** 后端统一返回结构 */
export interface ApiResponse<T> {
    name: string | undefined;
    url: string | undefined;
    total: number;
    list: never[];
    code: number
    data: T
    message: string
}

import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig
} from 'axios'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL;
console.log('[API CONFIG] Base URL:', apiBaseURL, 'Environment:', import.meta.env.MODE);
console.warn('[API CONFIG] ⚠️ AXIOS TIMEOUT SET TO 45 SECONDS FOR TIDB CLOUD LATENCY');

const service: AxiosInstance = axios.create({
    baseURL: apiBaseURL,
    timeout: 45000,  // 增加到 45 秒，充分覆盖 TiDB Cloud 远程查询延迟
    withCredentials: true // ⭐ 关键：携带 HttpOnly Cookie（session）
})
service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 如果 url 不以 http 开头，且不以 /admin 开头，才添加前缀
        // 目标：
        // - 'login'        -> '/admin/login'
        // - '/login'       -> '/admin/login'
        // - '/system/xxx'  -> '/admin/system/xxx'
        // - '/admin/xxx'   -> '/admin/xxx' (不重复)
        // - 'admin/xxx'    -> '/admin/xxx' (容错)
        if (config.url && !config.url.startsWith('http')) {
            // 先把 'admin/xxx' 纠正成 '/admin/xxx'
            if (config.url.startsWith('admin/')) config.url = '/' + config.url;

            // 只要不是以 /admin 开头，就补 /admin 前缀（同时处理相对/绝对路径）
            if (!config.url.startsWith('/admin')) {
                // 去掉可能的多余斜杠，避免出现 '/admin//xxx'
                const cleaned = config.url.startsWith('/') ? config.url.slice(1) : config.url;
                config.url = `/admin/${cleaned}`;
            }

            // 最后做一次归一化，防止误拼接导致的 '/admin/admin/xxx'
            config.url = config.url.replace(/^\/admin\/(admin\/)+/, '/admin/');
        }
        
        // 完整 URL 用于调试
        const fullUrl = (config.baseURL || '') + (config.url || '');
        console.log('[API] Request:', {
            method: config.method?.toUpperCase(),
            url: fullUrl,
            timeout: config.timeout
        });
        
        // 当 cookie 被过滤时，使用 localStorage 中的 sessionId 作为备选认证
        const sessionId = localStorage.getItem('admin_sessionId');
        if (sessionId) {
            config.headers['X-Session-ID'] = sessionId;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);
service.interceptors.response.use(
    <T>(response: AxiosResponse<ApiResponse<T>>) => {
        const { code, data, message } = response.data
        if (code.toString().startsWith('2')) {
            return data
        }
        if (code === 401) {
            window.dispatchEvent(new Event('SESSION_EXPIRED'))
        }
        return Promise.reject(new Error(message || '业务错误'))
    },
    (error) => {
        // http 错误 / 网络错误
        return Promise.reject(error)
    }
)
type RequestConfig = Omit<AxiosRequestConfig, 'url' | 'method'>

const request = {
    get<T>(url: string, config?: RequestConfig): Promise<T> {
        return service.get(url, config)
    },

    post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
        return service.post(url, data, config)
    },

    put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
        return service.put(url, data, config)
    },

    delete<T>(url: string, config?: RequestConfig): Promise<T> {
        return service.delete(url, config)
    },
    patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
        return service.patch(url, data, config)
    },

    upload<T>(url: string, data: FormData, config?: RequestConfig): Promise<T> {
        return service.post(url, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            ...config
        })
    },

    uploadPatch<T>(url: string, data: FormData, config?: RequestConfig): Promise<T> {
        return service.patch(url, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            ...config
        })
    },
}

export default request
