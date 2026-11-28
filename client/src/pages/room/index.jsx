import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Form, Button, Badge } from '@/ui';
import { v4 as uuidv4 } from 'uuid';
import Avatar from 'boring-avatars';
import { FaQrcode } from 'react-icons/fa';
import { IoMdChatboxes } from 'react-icons/io';
import {
  IoDocumentLock,
  IoLockClosedOutline,
  IoPeople,
  IoSparklesOutline,
} from 'react-icons/io5';
import { socket } from '@/shared/socket';
import { getRoom, saveRoom } from '@/shared/room-store';
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
  const [searchParams] = useSearchParams();
  const { handleShow } = useGlobalModal();
  const messageApi = useMessage();
  const { user_id, username } = usePresence();
  const { chat, unread, toogleChat, offcanvasswidth } = useChat();
  const isPrivate = searchParams.get('private') === '1';
  
  const [users, setUsers] = useState([]);
  const [receiving, setReceiving] = useState([]);
  const [sending, setSending] = useState([]);

  const pc = useRef(null);
  const fileInputRef = useRef(null);
  const channel = useRef(null);
  const targetId = useRef(null);
  const [positions, setPositions] = useState([]);
  const sounds = useSound();
  const [room_status, setRoomStatus] = useState(null);
  const formikRef = useRef(null);  
  const [status, setStatus] = useState("disconnected");
  const [percentage, setPercentage] = useState(0);

  const size = 70;
  const maxTries = 500;

  useEffect(() => {
    const positionUsers = () => {
      // Leave extra room for the avatar's name label so it never clips.
      const horizontalPadding = 10;
      const verticalPadding = 16;
      const nodeHeight = size + 36;
      const radar = document.querySelector('.radar');

      if (!radar) return;

      const parentWidth = radar.clientWidth;
      const parentHeight = radar.clientHeight;

      // available space in percent
      const availableWidthPercent = 100 - horizontalPadding * 2 - (size / parentWidth) * 100;
      const availableHeightPercent =
        100 - verticalPadding * 2 - (nodeHeight / parentHeight) * 100;

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

            // random % value within available space
            x = horizontalPadding + Math.random() * availableWidthPercent;
            y = verticalPadding + Math.random() * availableHeightPercent;

            for (let p of placed) {
              const dx = (p.x - x) * parentWidth / 100;
              const dy = (p.y - y) * parentHeight / 100;
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
              y,
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
        url: `${window.location.origin}/r/${room_id}?modal=false&private=${isPrivate ? 1 : 0}`,
      });
    }

    const handleBeforeUnload = () => {
      if(room_status?.status === 'success') {
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
    const join = () => {
      socket.emit("join-room", {
        room_id,
        username,
        user_id,
        room: getRoom(room_id),
        private: isPrivate,
      });
    };

    join();
    // Vercel Functions close long-lived sockets at their max duration.
    socket.on("connect", join);

    socket.on("joined", (data) => {
      messageApi.info(`${data.username} joined the room`);
      socket.emit("on-message", {
        room_id,
        type: 'message',
        data: {
          room_id,
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
        saveRoom(data.data);
        setRoomStatus(data);
      }
    });

    socket.on("left", (data) => {
      setTimeout(() => {
        sounds.simplewhoosh?.play();
        setUsers(prevState => prevState.filter(item => item[0] !== data.user_id));
        messageApi.info(`${data.username} left the room`);
        socket.emit("on-message", {
          room_id,
          type: 'message',
          data: {
            room_id,
            id: uuidv4(),
            system: true,
            message: `${data.username} left the room`,
          },      
        });
      }, 500);
    });
    
    socket.on("room-users", (message) => {
      setUsers([...new Set(message)]);
    });

    return () => {
      socket.off("connect", join);
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
      pc.current = new RTCPeerConnection(iceConfig);

      pc.current.ondatachannel = (e) => {
        const channel = e.channel;
        const files = {}; // { fileId: { name, type, chunks: [], percentage } }

        channel.onmessage = (msg) => {
          if (typeof msg.data === "string") {
            if (msg.data.startsWith("META:")) {
              const meta = JSON.parse(msg.data.replace("META:", ""));
              files[meta.fileId] = {
                name: meta.fileName,
                type: meta.fileType,
                chunks: [],
                percentage: 0,
              };

              setReceiving((prev) => [
                ...prev,
                {
                  id: meta.fileId,
                  name: meta.fileName,
                  type: meta.fileType,
                  url: null,
                  percentage: 0,
                },
              ]);
            } 
            else if (msg.data.startsWith("PERCENTAGE:")) {
              const percentage = parseInt(msg.data.replace("PERCENTAGE:", ""));
              const current = Object.values(files).slice(-1)[0];
              if (current) {
                current.percentage = percentage;
                setReceiving((prev) =>
                  prev.map((item) =>
                    item.id === current.id ? { ...item, percentage } : item
                  )
                );
                setPercentage(percentage);
              }
            } 
            else if (msg.data === "EOF") {
              const currentId = Object.keys(files).slice(-1)[0]; // last fileId
              const current = files[currentId];
              if (current) {
                const blob = new Blob(current.chunks, { type: current.type });
                const url = URL.createObjectURL(blob);

                setReceiving((prev) =>
                  prev.map((item) =>
                    item.id === currentId ? { ...item, url, percentage: 100 } : item
                  )
                );

                delete files[currentId]; // clean up
                sounds.messagenotification?.play();

                socket.emit("files-counter", { status: "success" });
                setPercentage(0);
              }
            }
          } else {
            // binary chunk
            const current = Object.values(files).slice(-1)[0];
            if (current) current.chunks.push(msg.data);
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
      fileType: file.type,
    };

    channel.current.send("META:" + JSON.stringify(metadata));

    setSending((prevState) => [
      ...prevState,
      {
        id: metadata.fileId,
        name: metadata.fileName,
        type: metadata.fileType,
        url: null,
        percentage: 0,
      },
    ]);

    const chunkSize = 16 * 1024;
    let offset = 0;
    const reader = new FileReader();

    const sendChunk = (chunk) => {
      if (channel.current.bufferedAmount > 64 * 1024) {
        // too full → wait for "bufferedamountlow"
        channel.current.onbufferedamountlow = () => {
          channel.current.onbufferedamountlow = null;
          channel.current.send(chunk);
          offset += chunkSize;
          continueReading();
        };
      } else {
        channel.current.send(chunk);
        offset += chunkSize;
        continueReading();
      }
    };

    const continueReading = () => {
      const percentage = Math.min((offset / file.size) * 100, 100);
      channel.current.send("PERCENTAGE:" + percentage);

      setSending((prevState) =>
        prevState.map((item) =>
          item.id === metadata.fileId
            ? { ...item, percentage: parseInt(percentage) }
            : item
        )
      );

      setPercentage(parseInt(percentage));

      if (offset < file.size) {
        readSlice(offset);
      } else {
        channel.current.send("EOF");
        setPercentage(0);
      }
    };

    const readSlice = (o) => {
      const slice = file.slice(o, o + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      sendChunk(e.target.result);
    };

    // set a low threshold for backpressure handling
    channel.current.bufferedAmountLowThreshold = 32 * 1024;

    readSlice(0);
  };

  const onSubmit = async (values) => {
    socket.emit("join-room", {
      room_id,
      username,
      user_id,
      room: getRoom(room_id),
      private: isPrivate,
      ...values
    });
  };

  const statusStyles = {
    connected: {
      label: 'Connected',
      dot: 'bg-emerald-400',
      chip: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    },
    connecting: {
      label: 'Connecting…',
      dot: 'bg-amber-400 animate-pulse',
      chip: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
    },
    disconnected: {
      label: 'Disconnected',
      dot: 'bg-slate-400',
      chip: 'border-white/10 bg-white/5 text-slate-300',
    },
    failed: {
      label: 'Connection failed',
      dot: 'bg-rose-400',
      chip: 'border-rose-400/25 bg-rose-400/10 text-rose-300',
    },
    closed: {
      label: 'Connection closed',
      dot: 'bg-slate-400',
      chip: 'border-white/10 bg-white/5 text-slate-300',
    },
  };

  const connection = statusStyles[status] ?? statusStyles.disconnected;
  const inviteUrl = `${window.location.origin}/r/${room_id}?modal=false&private=${isPrivate ? 1 : 0}`;

  if (!room_status) {
    return <Loading />;
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#060a12] text-slate-100 transition-[padding] duration-300"
      style={{ paddingRight: offcanvasswidth }}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="grid-bg absolute inset-0" />
        <div className="glow-orb absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-sky-600/20" />
        <div className="glow-orb absolute right-0 top-1/3 h-72 w-72 rounded-full bg-violet-700/15" />
      </div>

      {room_status?.status === 'success' ? (
        <>
          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-6 pt-24 sm:px-6 lg:px-8">
            {/* Room heading */}
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.5)] animate-[soft-blink_2s_ease-in-out_infinite]" />
                  Room is live
                </p>
                <h1 className="mt-3 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {room_status?.data?.name || 'Untitled room'}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                    Room ID <code className="font-mono text-slate-200">{room_id}</code>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                    Password{' '}
                    <code className="font-mono text-slate-200">
                      {room_status?.data?.password || 'None'}
                    </code>
                  </span>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${connection.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${connection.dot}`} />
                    {connection.label}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Badge className="gap-1.5 px-3 py-2">
                  <IoPeople size={14} /> {users.length} here
                </Badge>
                <Button
                  variant="light"
                  onClick={() => handleShow(MODAL_TYPES.QR_CODE, { url: inviteUrl })}
                  title="Invite with QR code"
                >
                  <FaQrcode />
                  <span className="hidden sm:inline">Invite</span>
                </Button>
                <Button variant="primary" className="relative" onClick={toogleChat}>
                  <IoMdChatboxes />
                  <span className="hidden sm:inline">Chat</span>
                  {!chat && unread ? (
                    <Badge
                      key={unread}
                      bg="danger"
                      className="absolute -right-2 -top-2 h-6 min-w-6 px-1.5 text-[11px] shadow-lg"
                    >
                      {unread}
                    </Badge>
                  ) : null}
                </Button>
              </div>
            </div>

            {/* Radar stage */}
            <div className="mt-7 flex items-center justify-center gap-2 text-center text-sm text-slate-400">
              <IoSparklesOutline size={16} className="shrink-0 text-sky-400" />
              Click a person below to send them a file — the transfer goes straight to their device.
            </div>

            <div className="radar relative mt-5 min-h-[58vh] flex-1 overflow-hidden rounded-3xl border border-white/10 bg-[#0a1120]/60 shadow-2xl shadow-black/40">
              {/* Radar sweep and crosshair */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                <div className="absolute left-1/2 top-0 h-full w-px bg-linear-to-b from-transparent via-white/5 to-transparent" />
                <div className="absolute left-0 top-1/2 h-px w-full bg-linear-to-r from-transparent via-white/5 to-transparent" />
                <span className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(56,189,248,0.08)_35deg,transparent_70deg,transparent_360deg)] animate-[radar-sweep_14s_linear_infinite]" />
                <div className="absolute right-4 top-4">
                  <span className="rounded-full border border-white/10 bg-[#0d1524]/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 backdrop-blur">
                    Peer-to-peer room
                  </span>
                </div>
              </div>

              {positions.map((p) => {
                const transferring = targetId.current === p.socket_id && percentage !== 0;

                return (
                  <button
                    key={p.user_id}
                    id={p.user_id}
                    type="button"
                    className="group absolute flex animate-[avatar-pop_0.45s_ease-out_both] flex-col items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    onClick={() => {
                      if (p.user_id === user_id) {
                        sounds.pop?.play();
                        return;
                      }

                      startConnection(p.socket_id);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = null;
                      }

                      fileInputRef.current.click();
                    }}
                  >
                    <div
                      className="progress-ring shadow-lg shadow-black/40 transition-transform duration-200 group-hover:scale-110"
                      style={{
                        padding: transferring ? 3 : 0,
                        background: transferring
                          ? `conic-gradient(#38bdf8 ${percentage}%, rgba(255,255,255,0.1) 0%)`
                          : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="flex h-[70px] w-[70px] items-center justify-center">
                        <Avatar name={p.username} size={size} variant="beam" />
                      </span>
                    </div>
                    <span className="rounded-full border border-white/10 bg-[#0d1524]/90 px-3 py-1 text-xs font-medium text-slate-300 shadow-lg shadow-black/30 backdrop-blur transition group-hover:border-sky-400/40 group-hover:text-white">
                      {p.user_id === user_id ? 'You' : p.username}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Transfer dock */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Suspense fallback={null}>
                <CustomToast title={`Receiving files (${receiving.length})`} visibility={false}>
                  {() => <FileList files={receiving} download={true} />}
                </CustomToast>
              </Suspense>
              <Suspense fallback={null}>
                <CustomToast title={`Sending files (${sending.length})`} visibility={false}>
                  {() => <FileList files={sending} download={false} />}
                </CustomToast>
              </Suspense>
            </div>
          </div>

          <Form.Group className="hidden">
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
            <Chat room_id={room_id} />
          </Suspense>
        </>
      ) : (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <Formik
            innerRef={formikRef}
            initialValues={{ password: '' }}
            validationSchema={() =>
              Yup.object().shape({ password: Yup.string().required('A password is required') })
            }
            onSubmit={onSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
              <Form onSubmit={handleSubmit} autoComplete="off" className="w-full max-w-md">
                <div className="animate-[fade-scale-in_0.3s_ease-out_both] rounded-3xl border border-white/10 bg-[#0d1524]/90 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-9">
                  <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-2xl text-rose-400">
                    <IoDocumentLock />
                  </span>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Private room</h1>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    This room is password protected. Enter the password shared with you to join.
                  </p>

                  <Form.Group className="mt-7">
                    <Form.Label htmlFor="room-password">Room password</Form.Label>
                    <Form.Control
                      id="room-password"
                      type="password"
                      name="password"
                      placeholder="Enter room password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.password && touched.password ? 'is-invalid' : undefined}
                    />
                    {errors.password && touched.password ? (
                      <Form.Control.Feedback>{errors.password}</Form.Control.Feedback>
                    ) : null}
                  </Form.Group>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <Link
                      to="/"
                      className="text-sm text-slate-400 underline-offset-4 transition hover:text-white hover:underline"
                    >
                      Leave room
                    </Link>
                    <Button type="submit" disabled={isSubmitting}>
                      <IoLockClosedOutline size={17} />
                      {isSubmitting ? 'Joining…' : 'Join room'}
                    </Button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </div>
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