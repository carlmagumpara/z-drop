import { createContext, useContext, useEffect, useState } from 'react';

const Context = createContext();

export const useChat = () => useContext(Context);

function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [typing, setTyping] = useState([]);
  const [chat, setShow] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [offcanvasswidth, setOffCanvasWidth] = useState(0);
  const [emoji, setEmoji] = useState(false);

  useEffect(() => {
    if(chat) {
      setUnread(0);
    }
  }, [chat]);

  const mergeConsecutiveSystemMessages = (data) => {
    const result = [];
    let buffer = [];

    const flushBuffer = () => {
      if (buffer.length === 0) return;
      const [first, ...rest] = buffer;
      result.push({
        id: first.id,
        system: true,
        messages: buffer.map(m => m.message),
        dateTime: first.dateTime || null
      });
      buffer = [];
    };

    for (const item of data) {
      if (item.system) {
        buffer.push(item);
      } else {
        flushBuffer();
        result.push(item);
      }
    }

    flushBuffer();
    return result;
  };

  function formatMessages(messages) {
    const seenPerSender = {};

    const data = messages
      .slice()
      .reverse()
      .map(msg => {
        if (msg.system) {
          return { 
            ...msg, 
            showReaders: [] 
          };
        }

        const sender = msg.username;
        if (!seenPerSender[sender]) {
          seenPerSender[sender] = new Set();
        }

        const readers = (msg.readBy || []).filter(
          r => !seenPerSender[sender].has(r)
        );

        readers.forEach(r => seenPerSender[sender].add(r));

        const reactions = Object.values(
          msg.reactions.reduce((acc, [_, emoji]) => {
            acc[emoji] = acc[emoji] || [emoji, 0];
            acc[emoji][1]++;
            return acc;
          }, {})
        );

        return { 
          ...msg, 
          showReaders: readers,
          showReactions: reactions,
        };
      })
      .reverse();

      return mergeConsecutiveSystemMessages(data);
  };

  const toogleChat = () => setShow(!chat);

  return (
    <Context.Provider
      value={{
        messages: formatMessages(messages),
        setMessages,
        typing, 
        setTyping,
        unread, 
        setUnread,
        cursorPosition, 
        setCursorPosition,
        emoji, 
        setEmoji,
        chat,
        toogleChat,
        offcanvasswidth,
        setOffCanvasWidth
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default ChatProvider;