import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const MessageContext = createContext();

export const useMessage = () => useContext(MessageContext);

const VARIANTS = {
  info: 'border-sky-400/25 bg-[#0d1524]/95 text-sky-200 shadow-sky-950/40',
  success: 'border-emerald-400/25 bg-[#0d1524]/95 text-emerald-200 shadow-emerald-950/40',
  error: 'border-rose-400/25 bg-[#0d1524]/95 text-rose-200 shadow-rose-950/40',
  warning: 'border-amber-400/25 bg-[#0d1524]/95 text-amber-200 shadow-amber-950/40',
};

const DOTS = {
  info: 'bg-sky-400',
  success: 'bg-emerald-400',
  error: 'bg-rose-400',
  warning: 'bg-amber-400',
};

function MessageProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Set());

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  const push = useCallback((type, content) => {
    const id = ++nextId.current;
    setMessages((prev) => [...prev, { id, type, content }]);

    const timer = setTimeout(() => {
      setMessages((prev) => prev.filter((item) => item.id !== id));
      timers.current.delete(timer);
    }, 3000);
    timers.current.add(timer);
  }, []);

  const messageApi = useMemo(() => ({
    info: (content) => push('info', content),
    success: (content) => push('success', content),
    error: (content) => push('error', content),
    warning: (content) => push('warning', content),
  }), [push]);

  return (
    <MessageContext.Provider value={messageApi}>
      {children}
      <div className="pointer-events-none fixed left-1/2 top-20 z-[1070] flex -translate-x-1/2 flex-col items-center gap-2">
        {messages.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`animate-[toast-in_0.2s_ease-out_both] pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl border px-4 py-2.5 text-center text-sm font-medium shadow-xl backdrop-blur-xl ${VARIANTS[item.type] ?? VARIANTS.info}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${DOTS[item.type] ?? DOTS.info}`} />
            {item.content}
          </div>
        ))}
      </div>
    </MessageContext.Provider>
  );
}

export default MessageProvider;
