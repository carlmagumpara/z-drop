import { createContext, useContext, useState } from 'react';

const Context = createContext();

export const useChat = () => useContext(Context);

function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [typing, setTyping] = useState([]);

  return (
    <Context.Provider
      value={{
        messages, 
        setMessages,
        typing, 
        setTyping,
        unread, 
        setUnread,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default ChatProvider;