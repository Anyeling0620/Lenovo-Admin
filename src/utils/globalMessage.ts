import type { MessageInstance } from 'antd/es/message/interface';

let instance: MessageInstance | null = null;

export const setGlobalMessage = (api: MessageInstance) => {
  instance = api;
};

export const getGlobalMessage = (): MessageInstance => {
  if (!instance) throw new Error('全局message未初始化');
  return instance;
};

export const globalMessage = {
  open: (...args: Parameters<MessageInstance['open']>) => getGlobalMessage().open(...args),
  success: (...args: Parameters<MessageInstance['success']>) => getGlobalMessage().success(...args),
  error: (...args: Parameters<MessageInstance['error']>) => getGlobalMessage().error(...args),
  info: (...args: Parameters<MessageInstance['info']>) => getGlobalMessage().info(...args),
  warning: (...args: Parameters<MessageInstance['warning']>) => getGlobalMessage().warning(...args),
  loading: (...args: Parameters<MessageInstance['loading']>) => getGlobalMessage().loading(...args),
  destroy: (...args: Parameters<MessageInstance['destroy']>) => getGlobalMessage().destroy(...args),
};

export type { MessageInstance };

