/* eslint-disable @typescript-eslint/no-explicit-any */
/** 后端统一返回结构 */
export interface ApiResponse<T> {
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

const service: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    withCredentials: true // ⭐ 关键：携带 HttpOnly Cookie（session）
})
service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config
    },
    (error) => Promise.reject(error)
)
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
}

export default request
