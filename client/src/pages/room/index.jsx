import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Container, Row, Col, Form, Button, InputGroup, ToastContainer, Badge } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import Avatar from 'boring-avatars';
import { FaQrcode } from 'react-icons/fa';
import { IoMdChatboxes } from 'react-icons/io';
import { IoDocumentLock } from 'react-icons/io5';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';
import { useMessage } from '@/contexts/message';
import { useGlobalModal, MODAL_TYPES } from '@/contexts/global-modal';
import useSound from './sounds';
import ChatProvider, { useChat } from './chat-context';
import { iceConfig } from './config';
import Loading from '@/shared/loading';
import { Formik } from 'formik';
import * as Yup from 'yup';

const FileList = lazy(() => import('./file-list'));
const CustomToast = lazy(() => import('./toast'));
const Chat = lazy(() => import('./chat'));

function Room() {
  const navigate = useNavigate();
  const { room_id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleShow } = useGlobalModal();
  const messageApi = useMessage();
  const { user_id, username } = usePresence();
  const { chat, unread, toogleChat, offcanvasswidth } = useChat();
  const [users, setUsers] = useState([]);
  const [receiving, setReceiving] = useState([]);
  const [sending, setSending] = useState([]);
  const fileInputRef = useRef(null);
  const pc = useRef(null);
  const [logs, setLogs] = useState([]);
  const channel = useRef(null);
  const targetId = useRef(null);
  const [targetIdChanges, setTargetIdChanges] = useState(null);
  const [positions, setPositions] = useState([]);
  const sounds = useSound();
  const [room_status, setRoomStatus] = useState(null);
  const formikRef = useRef(null);  
  const [status, setStatus] = useState("disconnected");

  const size = 60;
  const maxTries = 500;

  useEffect(() => {
    const positionUsers = () => {
      const padding = 50; 
      const radar = document.querySelector('.radar');

      if(!radar) {
        return;
      }

      const parentWidth = radar.clientWidth;
      const parentHeight = radar.clientHeight;
      const availableWidth = parentWidth - padding * 2;
      const availableHeight = parentHeight - padding * 2;
      const startX = (parentWidth - availableWidth) / 2;
      const startY = (parentHeight - availableHeight) / 2;

      setPositions((prevPositions) => {
        let placed = [...prevPositions];

        placed = placed.filter((p) =>
          users.some((u) => u[0] === p.user_id)
        );

        users.forEach(([user_id, username, socket_id]) => {
          if (placed.find((p) => p.user_id === user_id)) return;

          let tries = 0;
          let x, y, overlap;

          do {
            overlap = false;
            x = startX + Math.random() * (availableWidth - size);
            y = startY + Math.random() * (availableHeight - size);

            for (let p of placed) {
              const dx = p.x - x;
              const dy = p.y - y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < size) {
                overlap = true;
                break;
              }
            }
            tries++;
          } while (overlap && tries < maxTries);

          if (!overlap) {
            placed.push({ 
              user_id,
              username, 
              socket_id,
              x, 
              y 
            });
          }
        });

        return placed;
      });
    };

    positionUsers();
  }, [users]);

  useEffect(() => {
    if(room_status?.status === 'success' && searchParams.get('modal') !== 'false') {
      handleShow(MODAL_TYPES.QR_CODE, {
        url: `${window.location.href}?modal=false`,
        data: room_status.data
      });
    }

    const handleBeforeUnload = (event) => {
      if(room_status.status === 'success') {
        socket.emit("leave-room", { 
          room_id, 
          username, 
          user_id,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [room_status]);

  useEffect(() => {
    socket.emit("join-room", { 
      room_id, 
      username, 
      user_id,
    });

    socket.on("joined", (data) => {
      messageApi.info(`${data.username} joined the room`);
      socket.emit("on-message", {
        room_id,
        type: 'message',
        data: {
          id: uuidv4(),
          system: true,
          message: `${data.username} joined the room`,
        },      
      });
    });

    socket.on("room-status", (data) => {
      if(data.status === 'not-found') {
        messageApi.info(data.message);
        navigate('/');
      } else if(data.status === 'wrong-password') {
        formikRef.current?.setErrors({
          password: data.message
        });
        setRoomStatus(data);
      } else {
        setRoomStatus(data);
      }
    });

    socket.on("left", (data) => {
      const user = document.getElementById(data.user_id);
      if(user) {
        user.className = 'animate__animated animate__bounceOutUp';
      }
      setTimeout(() => {
        sounds.simplewhoosh?.play();
        setUsers(prevState => prevState.filter(item => item[0] !== data.user_id));
        messageApi.info(`${data.username} left the room`);
        socket.emit("on-message", {
          room_id,
          type: 'message',
          data: {
            id: uuidv4(),
            system: true,
            message: `${data.username} left the room`,
          },      
        });
      }, 500);
    });
    
    socket.on("room-users", (message) => {
      setUsers(prevState => [...new Set(message)]);
    });

    return () => {
      socket.off("joined");
      socket.off("room-status");
      socket.off("left");
      socket.off("room-users");
    };
  }, []);

  useEffect(() => {
    socket.on("offer", async ({ from, sdp }) => {
      if(pc.current) {
        pc.current?.close();
        pc.current = null;
      }
      
      targetId.current = from;
      setTargetIdChanges(from);
      pc.current = new RTCPeerConnection(iceConfig);

      pc.current.ondatachannel = (e) => {
        let received = [];
        let fileName = "";
        let fileType = "";
        let fileId = "";

        e.channel.onmessage = (msg) => {
          if (typeof msg.data === "string") {
            if (msg.data.startsWith("META:")) {
              const meta = JSON.parse(msg.data.replace("META:", ""));
              fileName = meta.fileName;
              fileType = meta.fileType;
              fileId = meta.fileId;
              setReceiving(prevState => ([
                ...prevState,
                {
                  id: fileId,
                  name: fileName,
                  type: fileType,
                  url: null,
                  percentage: 0
                }
              ]));
            } else if (msg.data.startsWith("PERCENTAGE:")) {
              const percentage = msg.data.replace("PERCENTAGE:", "");
              setReceiving(prevState => prevState.map(item => {
                return item.id === fileId ? {
                  ...item,
                  percentage: parseInt(percentage)
                } : item;
              }));
            } else if (msg.data === "EOF") {
              const blob = new Blob(received, { type: fileType });
              const url = URL.createObjectURL(blob);
              setReceiving(prevState => prevState.map(item => {
                return item.id === fileId ? {
                  ...item,
                  url,
                  percentage: 100
                } : item;
              }));
              received = [];
              sounds.messagenotification?.play();

              socket.emit("files-counter", { 
                status: 'success',
              });
            }
          } else {
            received.push(msg.data);
          }
        };
      };

      pc.current.onconnectionstatechange = () => {
        console.log("Connection state:", pc.current.connectionState);
        setStatus(pc.current.connectionState);
      };

      pc.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { 
            to: targetId.current, 
            candidate: e.candidate 
          });
        }
      };

      await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      socket.emit("answer", { to: from, sdp: answer });

      console.log('offer');
    });

    socket.on("answer", async ({ sdp }) => {
      await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));

      console.log('answer');
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));

        console.log('ice-candidate');
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    });

    return () => {};
  }, []);

  const startConnection = async (peerId) => {
    if(pc.current) {
      pc.current?.close();
      pc.current = null;
    }

    targetId.current = peerId;
    setTargetIdChanges(peerId);

    pc.current = new RTCPeerConnection(iceConfig);
    
    channel.current = pc.current.createDataChannel("sendDataChannel");
    channel.current.binaryType = 'arraybuffer';

    channel.current.onmessage = (e) => console.log(e);

    pc.current.onconnectionstatechange = () => {
      console.log("Connection state:", pc.current.connectionState);
      setStatus(pc.current.connectionState);
    };

    pc.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { 
          to: targetId.current, 
          candidate: e.candidate 
        });
      }
    };

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    socket.emit("offer", { to: peerId, sdp: offer });

    console.log('startConnection');
  };

  const sendFile = (file) => {
    const metadata = {
      fileId: uuidv4(),
      fileName: file.name,
      fileType: file.type
    };
    channel.current.send("META:" + JSON.stringify(metadata));

    setSending(prevState => ([
      ...prevState,
      {
        id: metadata.fileId,
        name: metadata.fileName,
        type: metadata.fileType,
        url: null,
        percentage: 0
      }
    ]));

    const chunkSize = 16 * 1024;
    let offset = 0;
    const reader = new FileReader();

    reader.onload = (e) => {
      channel.current.send(e.target.result);
      offset += chunkSize;

      const percentage = Math.min((offset / file.size) * 100, 100);
      channel.current.send("PERCENTAGE:" + percentage);
      setSending(prevState => prevState.map(item => {
        return item.id === metadata.fileId ? {
          ...item,
          percentage: parseInt(percentage)
        } : item;
      }));
      if (offset < file.size) {
        readSlice(offset);
      } else {
        channel.current.send("EOF");
      }
    };

    const readSlice = (o) => {
      const slice = file.slice(o, o + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    readSlice(0);
  };

  const onSubmit = async (values, { setSubmitting, setErrors }) => {
    socket.emit("join-room", { 
      room_id, 
      username, 
      user_id,
      ...values
    });
  };

  const statusIcons = {
    connected: "✅",
    connecting: "⏳",
    disconnected: "🔌",
    failed: "❌",
    closed: "🚪",
  };

  if(!room_status) {
    return <Loading />;
  }
  
  return (
    <>
      <div className="radar vh-100 w-100 position-relative">
        {room_status?.status === 'success' ? (
          <>
            <ToastContainer 
              className="position-fixed"
              style={{
                bottom: 15,
                left: 15,
                zIndex: 999
              }}
            >
              <p>Status: {statusIcons[status]} {status}</p>
              <Suspense fallback={null}>
                <CustomToast
                  title={`Receiving Files (${receiving.length})`}
                  visibility={false}
                >
                  {visibility => (
                    <FileList
                      files={receiving}
                      download={true}
                    />
                  )}
                </CustomToast>
              </Suspense>
              <Suspense fallback={null}>
                <CustomToast
                  title={`Sending Files (${sending.length})`}
                  visibility={false}
                >
                  {visibility => (
                    <FileList
                      files={sending}
                      download={false}
                    />
                  )}
                </CustomToast>
              </Suspense>
            </ToastContainer>
            <div
              className="position-absolute d-flex justify-content-between align-items-center gap-3"
              style={{
                right: 15 + offcanvasswidth,
                bottom: 15,
                zIndex: 999
              }}
            >
              <Button
                size="lg"
                variant="light"
                onClick={() => handleShow(MODAL_TYPES.QR_CODE, {
                  url: `${window.location.href}?modal=false`,
                  data: room_status.data
                })}
                className="animate__animated animate__bounceIn"
              >
                <FaQrcode />
              </Button>
              <Button
                size="lg"
                variant="light"
                onClick={toogleChat}
                className="animate__animated animate__bounceIn"
              >
                <IoMdChatboxes />
                {!chat ? (
                  <Badge
                    key={unread}
                    bg="danger"
                    className="position-absolute d-flex justify-content-center align-items-center animate__animated animate__bounceIn"
                    style={{
                      right: -10,
                      width: 30,
                      height: 30,
                      top: -15,
                      borderRadius: 30,
                    }}
                  >
                    {unread}
                  </Badge>
                ) : null}
              </Button>
            </div>
            <div
              style={{
                width: "100%",
                height: "100vh",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <p 
                className="text-center" 
                style={{ 
                  marginTop: 100 
                }}
              >
                Click the avatar of the user you want to send a file to.
              </p>
              {positions.map((p, i) => (
                <div
                  key={i}
                  id={p.user_id}
                  style={{
                    position: "absolute",
                    left: p.x,
                    top: p.y,
                  }}
                  className="animate__animated animate__bounceIn"
                  onClick={event => {
                    if(p.user_id === user_id) {
                      sounds.pop?.play();
                      return;
                    }

                    startConnection(p.socket_id);
                    fileInputRef.current.click();
                  }}
                >
                  <div
                    className="d-flex flex-column align-items-center gap-1"
                  >
                    <Avatar
                      name={p.username}
                      size={size}
                      variant="beam"
                    />
                    <p className="text-center small">
                      {p.user_id === user_id ? 'You' : p.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Form.Group className="mb-3 d-none">
              <Form.Label>Select File</Form.Label>
              <Form.Control
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    sendFile(file);
                  }
                }}
              />
            </Form.Group>
            <Suspense fallback={null}>
              <Chat
                room_id={room_id}
              />
            </Suspense>
          </>
        ) : (
          <Formik
            innerRef={formikRef}
            initialValues={{
              password: '',
            }}
            validationSchema={() => Yup.object().shape({
              password: Yup.string().required('Required'),
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
            setFieldValue,
            setValues
           }) => (
              <Form 
                onSubmit={handleSubmit} 
                autoComplete="off"
              >
                <Row>
                  <Col 
                    md={{ span: 4, offset: 4 }} 
                    className="vh-100 d-flex justify-content-center align-items-center"
                  >
                    <div className="w-100">
                      <h1 className="display-1 text-center text-danger">
                        <IoDocumentLock />
                      </h1>
                      <Form.Group className="mb-3">
                        <Form.Label>Room Password</Form.Label>
                        <Form.Control 
                          type="password" 
                          name="password"
                          placeholder="Enter Room Password"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={errors.password && touched.password && 'is-invalid'}
                        />
                        {errors.password && touched.password && <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>}
                      </Form.Group>
                      <div
                        className="d-flex justify-content-end align-items-center"
                      >
                        <Button 
                          disabled={isSubmitting}
                          type="submit"
                          variant="danger"
                        >
                          {isSubmitting ? 'Please wait...' : 'Submit'}
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Form>
           )}
          </Formik>
        )}
      </div>
    </>
  );
}

function Index() {
  const { username } = usePresence();

  return (
    <ChatProvider>
      <Room 
        key={username} 
      />
    </ChatProvider>
  )
}

export default Index;