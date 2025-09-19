import '../../chat.scss';
import { useEffect, useState, useRef } from 'react';
import { Form, InputGroup, Button, OverlayTrigger, Popover } from 'react-bootstrap';
import Avatar from 'boring-avatars';
import moment from 'moment';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { IoMdSend } from 'react-icons/io';
import EmojiPicker from 'emoji-picker-react';
import { socket } from '../../socket';
import { usePresence } from '@/contexts/presence';
import { useChat } from './chat-context';
import { popSfx, bubbleSfx, messageSfx } from './sounds';
import useSound from '@/hooks/use-sound';
import { v4 as uuidv4 } from 'uuid';
import RightMessage from './right-message';
import LeftMessage from './left-message';

function Chat({ roomId = '', visibility }) {
  const [playPopSfx] = useSound(popSfx);
  const [playBubbleSfx] = useSound(bubbleSfx);
  const [playMessageSfx] = useSound(messageSfx);
  const { username } = usePresence();
  const { messages, setMessages, typing, setTyping, setUnread } = useChat();
  const [cursorPosition, setCursorPosition] = useState(0);
  const [emoji, setEmoji] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if(visibility) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    
    socket.on("message", (data) => {
      switch(data.type) {
        case 'message':
          setMessages(prevState => [
            ...prevState,
            data.data
          ]);
          if(data.data.username !== username) {
            playPopSfx();
            if(!visibility) {
              setUnread(prevState => prevState + 1);
            }
          } else {
            playMessageSfx();
          }
          break;
        case 'typing':
          if(data.data.username !== username) {
            setTyping(prevState => {
              if(!prevState.includes(data.data.username)) {
                playBubbleSfx();

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
          setMessages(prevState => prevState.map(item => item.id === data.data.message_id ? {
            ...item,
            readBy: [
              ...item.readBy, 
              data.data.username
            ]
          } : item));
          break;
        case 'all-messages':
          setMessages(prevState => [
              ...prevState, 
              ...data.data
            ].filter((obj, index, self) => index === self.findIndex(o => o.id === obj.id))
          );
          break;
        default:
          console.log('invalid type');
      }
    });

    return () => {
      socket.off("message");
    };
  }, [visibility]);

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
      roomId,
      type: 'message',
      data: {
        ...values,
        id: uuidv4(),
        username,
        readBy: [],
        system: false,
        dateTime: new Date()
      },      
    });
    setEmoji(false);
    resetForm();
  };

  return (
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
        <Form onSubmit={handleSubmit}>
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
          <div className="w-100 d-flex flex-column" style={{ height: 400 }}>
            <div className="flex-grow-1 chat-window overflow-y-auto">
              <div className="messages p-3">
                {messages.map(item => (
                  <div key={item.id}>
                    {item.system ? <p className="small text-center text-secondary mb-0">{item.message}</p> : (
                      <>
                        {item.username === username ? (
                          <RightMessage 
                            item={item}
                            roomId={roomId}
                          />
                        ) : (
                          <LeftMessage 
                            item={item}
                            roomId={roomId}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
            <div className="flex-shrink-1 position-relative">
              {typing.length ? (
                <p 
                  className="position-absolute small text-secondary" 
                  style={{ left: 15, bottom: 30, zIndex: 999 }}
                >
                  {formatTyping(typing)}
                </p>
              ) : null}
              <InputGroup>
                <Button
                  variant="light"
                  className="rounded-0"
                  onClick={() => setEmoji(!emoji)}
                >
                  😃
                </Button>
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
                      roomId,
                      type: 'typing',
                      data: {
                        system: false,
                        username,
                      },      
                    });
                    setFieldValue('message', event.target.value);
                  }}
                  onBlur={handleBlur}
                  onSelect={event => setCursorPosition(event.target.selectionEnd)}
                />
                <Button
                  type="submit" 
                  variant="light"
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
  )
}

export default Chat;