import { message } from "antd";
import request from "../utils/request";
import { API_PATHS } from "./api-paths";

export const logout = async () => {
    try {
        await request.post<null>(API_PATHS.LOGOUT);
        window.dispatchEvent(new Event('SESSION_EXPIRED'))
    } catch (error) {
        message.error(error as string || '登出失败');
    }
}
