import { useEffect } from "react";
import useAuthStore from "../store/auth";
// import useAdminInfoStore from "../store/adminInfo";
import globalErrorHandler from "../utils/globalAxiosErrorHandler";
import { useNavigate } from "react-router-dom";
import { globalMessage } from "../utils/globalMessage";


const handleLoginUserInfo = async () => {
    try {
        // const userInfo = await getUserInfo();
        // useAdminInfoStore.getState().setAdminInfo(userInfo);
    } catch (error) {
        globalErrorHandler.handle(error, globalMessage.error);
    }
}

const useAuthLifecycle = () => {
    const nav = useNavigate();
    useEffect(() => {

        const handleLogin = () => {
            useAuthStore.getState().login();
            setTimeout(() => {
                handleLoginUserInfo();
            }, 100);
        }

        const handleLogout = () => {
            useAuthStore.getState().logout();
            // useAdminInfoStore.getState().clearAdminInfo(); 
            setTimeout(() => {
                nav('/',{
                    replace:true,
                })
            }, 50);
        }
        
        // 添加性能监控
        const startTime = performance.now();
        
        window.addEventListener("logout", handleLogout);
        window.addEventListener("login", handleLogin);
        
        const endTime = performance.now();
        console.log(`[性能监控] useAuthLifecycle 初始化耗时: ${endTime - startTime}ms`);
        
        return () => {
            window.removeEventListener("login", handleLogin);
            window.removeEventListener("logout", handleLogout);
        }
    }, [])
}


export default useAuthLifecycle;