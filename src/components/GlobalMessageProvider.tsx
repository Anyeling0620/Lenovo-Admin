import { useEffect } from 'react';
import { message } from 'antd';
import { setGlobalMessage } from '../utils/globalMessage';

const GlobalMessageProvider = () => {
  const [messageApi, contextHolder] = message.useMessage({
    top: 20,
    duration: 2,
    maxCount: 3,
  });

  useEffect(() => {
    setGlobalMessage(messageApi);
  }, [messageApi]);

  return contextHolder;
};

export default GlobalMessageProvider;

