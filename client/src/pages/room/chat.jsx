import { Fragment, useEffect, useState, useRef } from 'react';
import { Form, InputGroup, Button, OverlayTrigger, Offcanvas, Badge } from 'react-bootstrap';
import Avatar from 'boring-avatars';
import moment from 'moment';
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
    if(chat) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ 
          behavior: "auto" 
        });

        setOffCanvasWidth(offcanvasRef.current?.dialog?.clientWidth);
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

    socket.on("chat-history", (data) => {
      console.log("chat-history", data);
      setMessages(data);
    });

    return () => {
      socket.off("message");
      socket.off("chat-history");
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

  const onSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
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
    <Offcanvas 
      show={chat} 
      onHide={toogleChat}
      placement="end"
      backdrop={false}
      ref={offcanvasRef}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          Chat
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body 
        className="p-0 d-flex flex-column"
      >
        <Formik
          initialValues={{
            message: ''
          }}
          validationSchema={Yup.object({
            message: Yup.string().required('Required'),
          })}
          onSubmit={onSubmit}
        >
         {({
           values,
           errors,
           touched,
           handleChange,
           handleBlur,
           handleSubmit,
           isSubmitting,
           setFieldValue
         }) => (
            <Form 
              onSubmit={handleSubmit}
            >
              <div 
                className="w-100 d-flex flex-column position-relative"
                style={{
                  height: 'calc(100vh - 70px)'
                }}
              >
                {emoji ? (
                  <div
                    className="position-absolute"
                    style={{ 
                      bottom: 50 ,
                      zIndex: 999
                    }}
                  >
                    <EmojiPicker 
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
                  className="flex-grow-1 chat-window overflow-y-auto"
                  onClick={() => setEmoji(false)}
                >
                  <div 
                    className="messages p-3"
                  >
                    {messages.map((item, index) => {
                      const isLast = index === messages.length - 1;

                      return (
                        <Fragment key={item.id}>
                          {item.system ? (
                            <>
                              {item.messages.length === 1 ? (
                                <p style={{ fontSize: 11 }} className="text-center text-secondary mb-0">
                                  {item.messages[0]}
                                </p>
                              ) : (
                              <details>
                                <summary>View Updates</summary>
                                {item.messages.map((message, index) => (
                                  <p 
                                    key={index}
                                    style={{ fontSize: 11 }} 
                                    className="text-center text-secondary mb-0"
                                  >
                                    {message}
                                  </p>
                                ))}
                              </details>
                              )}
                            </>
                          ) : (
                            <>
                              {item.user_id === user_id ? (                            
                                <RightMessage
                                  item={item}
                                  room_id={room_id}
                                  isLast={isLast}
                                />
                              ) : (
                                <LeftMessage 
                                  item={item}
                                  room_id={room_id}
                                  isLast={isLast}
                                />
                              )}
                            </>
                          )}
                        </Fragment>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                </div>
                
                {(!isBottom && unread !== 0) ? (
                  <div className="position-relative w-100">
                    <div
                      className="position-absolute d-flex justify-content-center align-items-center w-100"
                      style={{
                        bottom: 30
                      }}
                    >
                      <Badge 
                        style={{
                          cursor: 'pointer'
                        }}
                        bg="primary"
                        onClick={() => {
                          setUnread(0);
                          bottomRef.current?.scrollIntoView({ 
                            behavior: "smooth" 
                          })
                        }}
                      >
                        {`You have ${unread} new message(s)`}
                      </Badge>
                    </div>
                  </div>
                ) : null}
                {typing.length ? (
                  <p 
                    className="position-absolute small text-secondary" 
                    style={{ left: 15, bottom: 30, zIndex: 999 }}
                  >
                    {formatTyping(typing)}
                  </p>
                ) : null}
                <div className="flex-shrink-1 position-relative">
                  <InputGroup>
                    <Form.Control
                      ref={inputRef}
                      name="message"
                      placeholder="Enter your message here..."
                      className="rounded-0 border-0"
                      autoComplete="off"
                      spellCheck="false"
                      value={values.message}
                      onChange={event => {
                        socket.emit("on-message", {
                          room_id,
                          type: 'typing',
                          data: {
                            room_id,
                            system: false,
                            username,
                            user_id,
                          },      
                        });
                        setFieldValue('message', event.target.value);
                      }}
                      onBlur={handleBlur}
                      onSelect={event => setCursorPosition(event.target.selectionEnd)}
                    />
                    <Button
                      variant="light"
                      className="rounded-0 bg-white border-0"
                      onClick={() => setEmoji(!emoji)}
                    >
                      😃
                    </Button>
                    <Button
                      type="submit" 
                      variant="danger"
                      className="rounded-0"
                      disabled={isSubmitting}
                    >
                      <IoMdSend />
                    </Button>
                  </InputGroup>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </Offcanvas.Body>
    </Offcanvas>
  )
}

export default Chat;