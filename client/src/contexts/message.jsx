import { createContext, useContext } from 'react';
import { message } from 'antd';

const MessageContext = createContext();

export const useMessage = () => useContext(MessageContext);

function MessageProvider({ children }) {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <MessageContext.Provider
      value={messageApi}
    >
      {contextHolder}
      {children}
    </MessageContext.Provider>
  )
}

export default MessageProvider;