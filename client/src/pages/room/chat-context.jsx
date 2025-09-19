import { createContext, useContext, useEffect, useState } from 'react';

const Context = createContext();

export const useChat = () => useContext(Context);

function ChatProvider({ children }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [unread, setUnread] = useState(0);
  const [typing, setTyping] = useState([]);

  useEffect(() => {
    localStorage.setItem(
      'messages', 
      JSON.stringify(messages)
    );
  }, [messages]);

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