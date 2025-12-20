import type { AxiosError, AxiosResponse } from 'axios';

type GlobalErrorType =
  | 'network_error'    // 网络错误（无网络/跨域/DNS解析失败等）
  | 'timeout_error'    // 请求超时
  | 'cancel_error'     // 请求取消
  | 'http_status_error'// HTTP 状态码错误（4xx/5xx，无业务码）
  | 'business_error'   // 后端业务码错误（有响应但业务失败）
  | 'invalid_config_error' // Axios 配置错误
  | 'invalid_url_error'    // 非法 URL 错误
  | 'not_support_error'    // 不支持的操作错误
  | 'too_many_redirects_error' // 重定向过多错误
  | 'unknown_error';   // 未知错误

/**
 * 标准化错误结构（全局通用）
 */
interface GlobalErrorInfo {
  type: GlobalErrorType;        // 错误类型
  message: string;              // 友好提示文案
  originalError: unknown;       // 原始错误对象（调试用）
  status: number | null;        // HTTP 状态码（无则null）
  businessCode: string | null;  // 后端自定义业务码（无则null）
  response: AxiosResponse | null;// 完整响应对象（有则返回）
  errorCode: string | null;     // Axios 原始错误码（如 ERR_NETWORK，调试用）
}

/**
 * 全局 Axios 错误处理器类
 * 用于统一处理 Axios 请求中的各种错误情况，包括网络错误、超时、取消请求、HTTP 状态码错误和业务码错误等。
 * 提供错误解析、友好提示生成和错误处理等功能，支持自定义错误提示配置。
 * 
 * 核心功能：
 * - 错误解析：将原始错误转换为标准化的错误信息结构
 * - 友好提示：提供用户友好的错误提示信息
 * - 错误处理：支持自定义提示方式处理错误
 * - 错误类型判断：提供多种错误类型的判断方法
 * 
 * 示例：
 * 
 * 构造函数参数：
 * @param customConfig 可选的自定义配置对象，包含：
 *   - networkErrorMsg: 网络错误提示
 *   - timeoutErrorMsg: 超时错误提示
 *   - cancelErrorMsg: 取消请求提示
 *   - invalidConfigMsg: 配置错误提示
 *   - invalidUrlMsg: 非法URL提示
 *   - notSupportMsg: 不支持操作提示
 *   - tooManyRedirectsMsg: 重定向过多提示
 *   - unknownErrorMsg: 未知错误提示
 *   - httpStatusMsgMap: HTTP状态码对应的提示映射
 *   - businessCodeMsgMap: 业务码对应的提示映射
 * 
 * 使用限制：
 * - 主要用于处理 Axios 请求错误
 * - 自定义配置会与默认配置进行合并，不会完全覆盖
 * - 错误日志默认会在控制台输出，生产环境可根据需要关闭
 */
class GlobalAxiosErrorHandler {
  // 默认提示配置（可全局覆盖，也可单例自定义）
  private defaultConfig = {
    // 基础错误提示（补充新增错误类型的默认提示）
    networkErrorMsg: '网络连接异常，请检查网络设置',
    timeoutErrorMsg: '请求超时，请稍后重试',
    cancelErrorMsg: '请求已取消',
    invalidConfigMsg: '请求配置错误，请联系开发人员',
    invalidUrlMsg: '请求地址非法，请联系开发人员',
    notSupportMsg: '当前环境不支持该操作',
    tooManyRedirectsMsg: '请求重定向过多，请联系开发人员',
    unknownErrorMsg: '操作失败，请稍后重试',
    // HTTP 状态码默认提示（补充更多常见状态码）
    httpStatusMsgMap: {
      400: '请求参数错误，请检查输入内容',
      401: '登录状态已失效，请重新登录',
      403: '暂无权限访问该资源',
      404: '请求的资源不存在',
      405: '请求方法不允许',
      406: '请求格式不被支持',
      408: '请求超时，请稍后重试',
      413: '请求数据过大，请精简内容',
      414: '请求地址过长，请联系开发人员',
      422: '请求参数验证失败，请检查输入',
      429: '请求过于频繁，请稍后重试',
      500: '服务器内部错误，请稍后重试',
      502: '网关错误，请稍后重试',
      503: '服务暂不可用，请稍后重试',
      504: '网关超时，请稍后重试',
      505: 'HTTP版本不支持',
    } as Record<number, string>,
    // 后端业务码默认提示（可按业务扩展，比如TOKEN_INVALID/PARAM_ERROR等）
    businessCodeMsgMap: {} as Record<string, string>
  };

  /**
   * 构造函数（支持实例化时自定义配置，适配不同业务）
   * @param customConfig 自定义提示配置
   */
  constructor(customConfig?: Partial<typeof GlobalAxiosErrorHandler.prototype.defaultConfig>) {
    if (customConfig) {
      // 合并默认配置和自定义配置（深层合并，避免覆盖整个对象）
      this.defaultConfig = {
        ...this.defaultConfig,
        httpStatusMsgMap: {
          ...this.defaultConfig.httpStatusMsgMap,
          ...customConfig.httpStatusMsgMap
        },
        businessCodeMsgMap: {
          ...this.defaultConfig.businessCodeMsgMap,
          ...customConfig.businessCodeMsgMap
        },
        ...(customConfig as Omit<typeof customConfig, 'httpStatusMsgMap' | 'businessCodeMsgMap'>)
      };
    }
  }


  /**
   * 解析错误信息并格式化为全局错误信息对象
   * @param error - 未知的错误对象
   * @returns 返回格式化后的全局错误信息对象
   */
  public parse(error: unknown): GlobalErrorInfo {
    // 初始化错误信息对象，设置默认值
    const errorInfo: GlobalErrorInfo = {
      type: 'unknown_error',
      message: this.defaultConfig.unknownErrorMsg,
      originalError: error,
      status: null,
      businessCode: null,
      response: null,
      errorCode: null // 新增：保存 Axios 原始错误码
    };

    // 1. 非 Error 类型错误（如直接 throw '错误信息'）
    if (!(error instanceof Error)) {
      errorInfo.message = typeof error === 'string' ? error : this.defaultConfig.unknownErrorMsg;
      return errorInfo;
    }

    // 2. 判断是否为 Axios 错误
    if ((error as AxiosError).isAxiosError) {
      const axiosError = error as AxiosError<{
        code?: string;    // 后端业务码
        message?: string; // 后端提示文案
        msg?: string;     // 兼容部分后端用 msg 字段
      }>;

      // 保存 Axios 原始错误码（方便调试）
      errorInfo.errorCode = axiosError.code || null;

      // 2.1 无响应：网络/超时/取消/配置错误等
      if (!axiosError.response) {
        switch (axiosError.code) {
          // 网络错误（通用：无网络/跨域/服务器拒绝连接）
          case 'ERR_NETWORK':
            errorInfo.type = 'network_error';
            errorInfo.message = this.defaultConfig.networkErrorMsg;
            break;
          // 超时错误（v1.x 标准码）
          case 'ERR_TIMEOUT':
            errorInfo.type = 'timeout_error';
            errorInfo.message = this.defaultConfig.timeoutErrorMsg;
            break;
          // 请求取消
          case 'ERR_CANCELED':
            errorInfo.type = 'cancel_error';
            errorInfo.message = this.defaultConfig.cancelErrorMsg;
            break;
          // 超时/连接中止（v0.x 兼容 + Node.js 底层错误）
          case 'ECONNABORTED':
          case 'ETIMEDOUT':
            errorInfo.type = 'timeout_error';
            errorInfo.message = this.defaultConfig.timeoutErrorMsg;
            break;
          // Node.js DNS 解析失败（ENOTFOUND/EAI_AGAIN 归类为网络错误）
          case 'ENOTFOUND':
          case 'EAI_AGAIN':
            errorInfo.type = 'network_error';
            errorInfo.message = '域名解析失败，请检查网络设置';
            break;
          // Node.js 服务器拒绝连接
          case 'ECONNREFUSED':
            errorInfo.type = 'network_error';
            errorInfo.message = '服务器拒绝连接，请稍后重试';
            break;
          // Node.js 管道破裂
          case 'EPIPE':
            errorInfo.type = 'network_error';
            errorInfo.message = this.defaultConfig.networkErrorMsg;
            break;
          // 重定向过多（浏览器专属）
          case 'ERR_FR_TOO_MANY_REDIRECTS':
            errorInfo.type = 'too_many_redirects_error';
            errorInfo.message = this.defaultConfig.tooManyRedirectsMsg;
            break;
          // 不支持的操作（如浏览器用 Node.js 配置）
          case 'ERR_NOT_SUPPORT':
            errorInfo.type = 'not_support_error';
            errorInfo.message = this.defaultConfig.notSupportMsg;
            break;
          // 无效配置（如 baseURL 非法、method 不合法）
          case 'ERR_INVALID_CONFIG':
            errorInfo.type = 'invalid_config_error';
            errorInfo.message = this.defaultConfig.invalidConfigMsg;
            break;
          // 非法 URL（如 http:// 少写 /）
          case 'ERR_INVALID_URL':
            errorInfo.type = 'invalid_url_error';
            errorInfo.message = this.defaultConfig.invalidUrlMsg;
            break;
          // 未知无响应错误
          default:
            errorInfo.type = 'unknown_error';
            errorInfo.message = this.defaultConfig.unknownErrorMsg;
            break;
        }
        return errorInfo;
      }

      // 2.2 有响应：HTTP 状态码错误 + 后端业务码错误
      errorInfo.status = axiosError.response.status;
      errorInfo.response = axiosError.response;
      errorInfo.type = 'http_status_error';

      // 2.2.1 优先解析后端业务码（兼容 code/message 和 code/msg 两种格式）
      const responseData = axiosError.response.data;
      if (responseData?.code) {
        errorInfo.type = 'business_error';
        errorInfo.businessCode = responseData.code;
        // 提示优先级：后端 message → 后端 msg → 业务码配置 → HTTP 状态码提示 → 默认提示
        errorInfo.message = responseData.message
          || responseData.msg
          || this.defaultConfig.businessCodeMsgMap[responseData.code]
          || this.defaultConfig.httpStatusMsgMap[axiosError.response.status]
          || this.defaultConfig.unknownErrorMsg;
      } else {
        // 2.2.2 无业务码：用 HTTP 状态码提示（兜底未知状态码）
        errorInfo.message = this.defaultConfig.httpStatusMsgMap[axiosError.response.status]
          || `请求失败（状态码：${axiosError.response.status}）`
          || this.defaultConfig.unknownErrorMsg;
      }
    } else {
      // 3. 非 Axios 的普通 Error（如代码逻辑错误 throw new Error('xxx')）
      errorInfo.message = error.message || this.defaultConfig.unknownErrorMsg;
    }

    return errorInfo;
  }

  /**
   * 快捷方法：仅获取友好提示文案（全局通用）
   * @param error 原始错误
   * @returns 友好提示字符串
   */
  public getFriendlyMessage(error: unknown): string {
    return this.parse(error).message;
  }

  /**
   * 增强版错误处理：支持按错误类型自定义提示逻辑
   * @param error 原始错误
   * @param options 处理配置
   *  - notify: 通用提示方法（如 toast.error）
   *  - customMsg?: 全局自定义提示
   *  - typeHandlers?: 按错误类型自定义处理（如 401 跳转登录）
   */
  public handle(
    error: unknown,
    notify: (msg: string) => void,
    customMsg?: string,
  ): void {
    const errorInfo = this.parse(error);
    const finalMsg = customMsg || errorInfo.message;
    notify(finalMsg);
  }

  // ===== 增强版辅助方法：覆盖更多业务场景 =====
  /** 判断是否是网络错误（含 DNS 解析失败、服务器拒绝连接） */
  public isNetworkError(error: unknown): boolean {
    return this.parse(error).type === 'network_error';
  }

  /** 判断是否是超时错误 */
  public isTimeoutError(error: unknown): boolean {
    return this.parse(error).type === 'timeout_error';
  }

  /** 判断是否是 401 未授权（登录过期/未登录） */
  public isUnauthorizedError(error: unknown): boolean {
    return this.parse(error).status === 401;
  }

  /** 判断是否是 403 禁止访问 */
  public isForbiddenError(error: unknown): boolean {
    return this.parse(error).status === 403;
  }

  /** 判断是否是 404 资源不存在 */
  public isNotFoundError(error: unknown): boolean {
    return this.parse(error).status === 404;
  }

  /** 判断是否是后端业务码错误（支持多业务码匹配） */
  public isBusinessError(error: unknown, businessCodes?: string | string[]): boolean {
    const errorInfo = this.parse(error);
    if (errorInfo.type !== 'business_error') return false;
    if (!businessCodes) return true; // 无指定业务码 → 只要是业务错误就返回true
    const codes = Array.isArray(businessCodes) ? businessCodes : [businessCodes];
    return codes.includes(errorInfo.businessCode!);
  }

  /** 判断是否是配置错误/非法URL错误（开发环境调试用） */
  /**
   * 判断给定的错误是否为配置错误
   * @param error - 需要检查的错误对象，类型为unknown
   * @returns 返回布尔值，表示错误是否为配置错误
   */
  public isConfigError(error: unknown): boolean {
    // 解析错误对象并获取其类型
    const type = this.parse(error).type;
    // 检查错误类型是否为配置错误或无效URL错误
    return type === 'invalid_config_error' || type === 'invalid_url_error';
  }

  /**
   * 获取业务错误代码
   * @param error - 未知类型的错误对象
   * @returns 返回业务代码字符串，如果没有则返回null
   */
  public getBusinessCode(error: unknown): string | null {
    return this.parse(error).businessCode; // 调用parse方法解析错误对象并返回其中的businessCode属性
  }

  /**
   * 获取HTTP状态码
   * @param error - 未知的错误对象
   * @returns 返回HTTP状态码数字，如果无法解析则返回null
   */
  public getHttpStatus(error: unknown): number | null {
    // 调用parse方法解析错误对象，并返回其中的status属性
    return this.parse(error).status;
  }

  /**
   * 获取原始错误代码
   * @param error - 未知类型的错误对象
   * @returns 返回错误代码字符串，如果无法获取则返回null
   */
  public getOriginalErrorCode(error: unknown): string | null {
    // 调用parse方法解析错误对象，并返回其中的errorCode属性
    return this.parse(error).errorCode;
  }
}

// ========== 全局单例（项目中直接复用，无需重复实例化） ==========
// 可在项目入口（如 main.tsx）自定义全局配置，适配所有业务
export const globalErrorHandler = new GlobalAxiosErrorHandler({
  // 自定义全局基础提示
  unknownErrorMsg: '操作失败，请稍后重试',
  // 自定义 HTTP 状态码提示（覆盖默认）
  httpStatusMsgMap: {
    401: '登录过期，请重新登录',
    403: '您暂无权限执行该操作',
    429: '请求过于频繁，请稍后重试~',
    500: '服务器打盹了，请稍后再试😴',
  },
  // 自定义后端业务码提示（覆盖默认）
  businessCodeMsgMap: {
    TOKEN_INVALID: '令牌失效，请重新登录',
    TOKEN_INVALID_BY_MULTI_LOGIN: '账号已在其他设备登录',
    PARAM_ERROR: '参数错误，请检查输入',
    RESOURCE_NOT_FOUND: '资源不存在',
    PERMISSION_DENIED: '暂无权限',
    SYSTEM_BUSY: '系统繁忙，请稍后重试',
  },
  // 补充新增错误类型的自定义提示
  tooManyRedirectsMsg: '请求重定向异常，请联系开发人员',
  notSupportMsg: '当前环境不支持该操作，请更新浏览器或App',
});

export default globalErrorHandler;
export type { GlobalErrorType, GlobalErrorInfo }; // 导出类型供业务层使用