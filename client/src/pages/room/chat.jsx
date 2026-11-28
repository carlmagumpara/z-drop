import { Fragment, useEffect, useState, useRef } from 'react';
import { Form, InputGroup, Button, Badge } from '@/ui';
import Avatar from 'boring-avatars';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { IoMdSend } from 'react-icons/io';
import EmojiPicker from 'emoji-picker-react';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';
import { useChat } from './chat-context';
import useSound from './sounds';
import { v4 as uuidv4 } from 'uuid';
import RightMessage from './right-message';
import LeftMessage from './left-message';
import { getMessages } from '@/shared/api';

function Chat({ room_id = '' }) {
  const sounds = useSound();
  const { user_id, username } = usePresence();
  const {
    messages, 
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
    setOffCanvasWidth
  } = useChat();
  const [isBottom, setIsBottom] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const offcanvasRef = useRef(null);

  useEffect(() => {
    const chatHistory = async () => {
      try {
        const data = await getMessages(room_id);

        setMessages(data);
      } catch (error) {
        console.log(error);
      }      
    };

    chatHistory();
  }, []);

  useEffect(() => {
    if(chat) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ 
          behavior: "auto" 
        });

        setOffCanvasWidth(offcanvasRef.current?.clientWidth);
      }, 0);
    } else {
      setOffCanvasWidth(0);
    }
  }, [chat]);

  useEffect(() => {
    const handleScroll = () => {
      const isAtBottom = chatMessagesRef.current?.scrollHeight - (chatMessagesRef.current?.scrollTop + chatMessagesRef.current?.clientHeight) <= 15;

      if(isAtBottom) {
        setUnread(0);
      }

      setIsBottom(isAtBottom);
    };

     chatMessagesRef.current?.addEventListener("scroll", handleScroll);

    return () => chatMessagesRef.current?.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    socket.on("message", (data) => {
      switch(data.type) {
        case 'message':
          setMessages(prevState => [
            ...prevState,
            data.data
          ]);
          if(data.data.username !== username) {
            sounds.pop?.play();
            if(!chat || !isBottom) {
              setUnread(prevState => prevState + 1);
            }
          } else {
            setTimeout(() => {
              bottomRef.current?.scrollIntoView({ 
                behavior: "smooth" 
              });
            }, 500);
            sounds.messageenvoyeiphoneapple?.play();
          }
          break;
        case 'typing':
          if(data.data.username !== username) {
            setTyping(prevState => {
              if(!prevState.includes(data.data.username)) {
                sounds.bubble?.play();

                return [
                  ...prevState,
                  data.data.username
                ]
              }

              return prevState;
            });

            if(typingRef.current) {
              clearTimeout(typingRef.current);
            }

            typingRef.current = setTimeout(() => {
              setTyping(prevState => prevState.filter(item => item !== data.data.username));
              typingRef.current = null;
            }, 1000);
          }
          break;
        case 'read':
          setTimeout(() => {
            setMessages(prevState => prevState.map(item => item.id === data.data.message_id ? {
              ...item,
              readers: [
                ...(item.readers ?? []), 
                data.data
              ]
            } : item));
          }, 100);
          break;
        case 'react':
          setMessages(prevState =>
            prevState.map(item => {
              if (item.id !== data.data.message_id) {
                return item
              };
              const reactions = item.reactions ?? [];
              let updatedReactions;
              if (!reactions.some(r => r.user_id === data.data.user_id)) {
                updatedReactions = [...reactions, data.data];
              } else {
                const existing = reactions.find(r => r.user_id === data.data.user_id);
                if (existing.emoji === data.data.emoji) {
                  updatedReactions = reactions.filter(r => r.user_id !== data.data.user_id);
                } else {
                  updatedReactions = reactions.map(r =>
                    r.user_id === data.data.user_id ? data.data : r
                  );
                }
              }

              return {
                ...item,
                reactions: updatedReactions,
              };
            })
          );
          break;
        default:
          console.log('invalid type');
      }
    });

    // socket.on("chat-history", (data) => {
    //   console.log("chat-history", data);
    //   setMessages(data);
    // });

    return () => {
      socket.off("message");
      // socket.off("chat-history");
    };
  }, [chat, isBottom]);

  const formatTyping = (users = []) => {
    if (users.length === 0) {
      return '';
    }

    if (users.length === 1) {
      return `${users[0]} is typing...`;
    }

    if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`;
    }

    return 'Multiple users are typing...';
  };

  const onSubmit = async (values, { resetForm }) => {
    socket.emit("on-message", {
      room_id,
      type: 'message',
      data: {
        ...values,
        room_id,
        id: uuidv4(),
        user_id,
        username,
        readers: [],
        reactions: [],
        system: false,
        dateTime: new Date()
      },      
    });
    setEmoji(false);
    resetForm();
  };

  return (
    <aside
      ref={offcanvasRef}
      aria-hidden={!chat}
      className={`fixed inset-y-0 right-0 z-[1045] flex w-full max-w-md flex-col border-l border-white/10 bg-[#0b1220]/95 shadow-2xl shadow-black/60 backdrop-blur-xl transition-transform duration-300 ${chat ? 'translate-x-0' : 'pointer-events-none translate-x-full'}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-white">Room chat</h2>
          <p className="mt-0.5 text-xs text-slate-500">Talk while your files travel</p>
        </div>
        <button
          type="button"
          aria-label="Close chat"
          onClick={toogleChat}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl leading-none text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
        >
          &times;
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Formik
          initialValues={{ message: '' }}
          validationSchema={Yup.object({
            message: Yup.string().required('Required'),
          })}
          onSubmit={onSubmit}
        >
          {({ values, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
            <Form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="relative flex min-h-0 flex-1 flex-col">
                {emoji ? (
                  <div className="absolute bottom-12 left-0 z-[999] max-w-full">
                    <EmojiPicker
                      theme="dark"
                      width={350}
                      onEmojiClick={emojiObject => {
                        const emoji = emojiObject.emoji;
                        const start = values.message.substring(0, cursorPosition);
                        const end = values.message.substring(cursorPosition);
                        const newText = start + emoji + end;
                        setFieldValue('message', newText);
                        const newCursorPosition = cursorPosition + emoji.length;
                        setCursorPosition(newCursorPosition);
                        if (inputRef.current) {
                          inputRef.current.focus();
                          setTimeout(() => {
                            inputRef.current.selectionStart = newCursorPosition;
                            inputRef.current.selectionEnd = newCursorPosition;
                          }, 0);
                        }
                      }}
                    />
                  </div>
                ) : null}

                <div
                  ref={chatMessagesRef}
                  className="chat-window grow overflow-y-auto"
                  onClick={() => setEmoji(false)}
                >
                  <div className="messages p-4">
                    {messages.map((item) => (
                      <Fragment key={item.id}>
                        {item.system ? (
                          item.messages.length === 1 ? (
                            <p className="mb-3 text-center text-[11px] text-slate-500">
                              {item.messages[0]}
                            </p>
                          ) : (
                            <details className="mb-3">
                              <summary className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-400">
                                View updates
                              </summary>
                              {item.messages.map((message, index) => (
                                <p key={index} className="mb-0 text-center text-[11px] text-slate-500">
                                  {message}
                                </p>
                              ))}
                            </details>
                          )
                        ) : item.user_id === user_id ? (
                          <RightMessage item={item} room_id={room_id} />
                        ) : (
                          <LeftMessage item={item} room_id={room_id} />
                        )}
                      </Fragment>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                </div>

                {!isBottom && unread !== 0 ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                    <Badge
                      className="pointer-events-auto cursor-pointer shadow-lg"
                      onClick={() => {
                        setUnread(0);
                        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      {unread} new {unread === 1 ? 'message' : 'messages'}
                    </Badge>
                  </div>
                ) : null}

                {typing.length ? (
                  <p className="pointer-events-none absolute bottom-3 left-5 z-[999] text-xs text-slate-400 animate-[soft-blink_1.6s_ease-in-out_infinite]">
                    {formatTyping(typing)}
                  </p>
                ) : null}

                <div className="shrink-0 border-t border-white/10 bg-white/[0.02] p-3">
                  <InputGroup>
                    <Form.Control
                      ref={inputRef}
                      name="message"
                      placeholder="Write a message…"
                      className="min-w-0 grow rounded-none border-0 bg-transparent px-4 focus:ring-0"
                      autoComplete="off"
                      spellCheck="false"
                      value={values.message}
                      onChange={event => {
                        socket.emit('on-message', {
                          room_id,
                          type: 'typing',
                          data: { room_id, system: false, username, user_id },
                        });
                        setFieldValue('message', event.target.value);
                      }}
                      onBlur={handleBlur}
                      onSelect={event => setCursorPosition(event.target.selectionEnd)}
                    />
                    <Button
                      variant="light"
                      className="shrink-0 rounded-none border-0 border-l border-white/10 bg-transparent px-4"
                      onClick={() => setEmoji(!emoji)}
                      aria-label="Emoji"
                    >
                      😃
                    </Button>
                    <Button
                      type="submit"
                      className="shrink-0 rounded-none px-4"
                      disabled={isSubmitting}
                      aria-label="Send message"
                    >
                      <IoMdSend />
                    </Button>
                  </InputGroup>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </aside>
  );
}

export default Chat;