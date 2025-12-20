import request from "../utils/request";
import { API_PATHS } from "./api-paths";

export const logout = async () => {
    try {
        await request.post<null>(API_PATHS.LOGOUT);
    } finally {
        window.dispatchEvent(new Event('SESSION_EXPIRED'))
    }
}

export interface AdminLoginParams {
    account: string;
    password: string;
}


export interface AdminLoginResponse {
    admin_id: string;
    name: string;
    nickname: string;
    avatar: string | null;
    email: string | null;
}

export const adminLogin = async (params: AdminLoginParams) => {
    const deviceType = /Mobile/.test(navigator.userAgent) ? 'mobile' : 'pc';
    const deviceName = navigator.userAgent.slice(0, 40);
    const response = await request.post<AdminLoginResponse>(API_PATHS.LOGIN, params, {
        headers: {
            'X-Device-Type': deviceType,
            'X-Device-Name': deviceName,
        }
    });
    return response;
}



export interface PermissionInfo {
    id: string; // 权限ID
    name: string; // 权限名称
    code?: string; // 权限编码（若Permission表需要，可后续添加）
    type: string; // 权限类型
    module: string; // 所属模块
    parentId: string | null; // 父权限ID
    children?: PermissionInfo[]; // 子权限（可选，构建权限树）
}

// 新增：身份语义化信息
export interface IdentityInfo {
    id: string; // 身份ID
    name: string; // 身份名称
    code: string; // 身份编码
    description?: string; // 身份描述
    isSystem: boolean; // 是否系统预设
}

// 新增：专区语义化信息（关联Category表，假设Category有name字段）
export interface CategoryInfo {
    id: string; // 专区ID
    name: string; // 专区名称
    // 可根据Category表补充其他字段，如parentId、sort等
}

// 新增：权限信息API响应类型
export interface AdminPermissionResponse {
    permissions: PermissionInfo[]; // 权限列表（语义化）
    permissionsTree: PermissionInfo[]; // 权限树（可选，前端渲染菜单用）
    identities: IdentityInfo[]; // 身份列表（语义化）
    categories: CategoryInfo[]; // 专区列表（语义化）
}
export const getPermissions = async (): Promise<AdminPermissionResponse> => {
    const response = await request.get<AdminPermissionResponse>(API_PATHS.GET_PERMISSIONS);
    return response;
}