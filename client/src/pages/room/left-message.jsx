import { useEffect, useState } from 'react';
import { Image } from 'react-bootstrap';
import Avatar from 'boring-avatars';
import Picker from 'emoji-picker-react';
import useOnScreen from '@/hooks/use-on-screen';
import { usePresence } from '@/contexts/presence';
import { socket } from '@/shared/socket';
import useSound from './sounds';
import AddReaction from '@/assets/add-reaction.png';

function LeftMessage({ item, room_id, isLast }) {
  const sounds = useSound();
  const [hover, setHover] = useState(false);
  const [ref, isVisible] = useOnScreen({
    threshold: 0.1,
  });
  const { user_id, username } = usePresence();
  
  useEffect(() => {
    if(isVisible && !item.readers.find(reader => reader.user_id === user_id)) {
      socket.emit("on-message", {
        room_id,
        type: 'read',
        data: {
          id: uuidv4(),
          room_id,
          message_id: item.id,
          username,
          user_id,
        },
      });
    }
  }, [isVisible]);

  return (
    <div 
      ref={ref}
      className={`message left position-relative ${isLast ? 'animate__animated animate__fadeInUp' : ''}`}
    >
      <div className="avatar" aria-hidden="true">
        <Avatar
          name={item.username}
          size={44}
          variant="beam"
        />
      </div>
      <div>
        <div 
          className="bubble"
        >
          <p>{item.message}</p>
          <div className="meta left">
            <p className="mb-0">{item.username}</p>
            <p className="mb-0">{item.dateTime}</p>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center pt-1">
          {item.readers.length ? (
            <div className="d-flex justify-content-start align-items gap-1">
              <span className="small">✓</span> {item.readers.filter(reader => reader.user_id !== user_id).map(reader => (
                <div 
                  className="animate__animated animate__fadeInDown animate__faster"
                  key={reader.user_id}
                  id={`${reader.user_id}-chat-avatar`}
                >
                  <Avatar
                    name={reader.username}
                    size={15}
                    variant="beam"
                  />
                </div>
              ))}
            </div>
          ) : <div />}
          {(item.reactions ?? []).length ? (
            <div className="d-flex justify-content-end align-items gap-1 h6">
              {(item.reactions ?? []).map((emoji, index) => (
                <span key={`${emoji[0]}-${index}`} className="animate__animated animate__bounceIn">
                  {`${emoji[0]} ${emoji[1]}`}
                </span>
              ))}
            </div>
          ) : <div />}
        </div>
      </div>
      <div
        onMouseOver={() => setHover(true)}
        onMouseOut={() => setHover(false)}
        className="p-1 reaction"
      >
        {hover ? (
          <div
            onMouseOver={() => setHover(true)}
            onMouseOut={() => setHover(false)}
            className="position-absolute"
            style={{
              top: -50,
              right: 0,
              zIndex: 999
            }}
          >
            <Picker 
              reactionsDefaultOpen={true}
              allowExpandReactions={false}
              onReactionClick={emojiObject => {
                const emoji = emojiObject.emoji;
                socket.emit("on-message", {
                  room_id,
                  type: 'react',
                  data: {
                    id: uuidv4(),
                    room_id,
                    message_id: item.id,
                    username,
                    user_id,
                    emoji,
                  },
                });
                setHover(false);
                sounds.pop?.play();
              }}
            />
          </div>
        ) : null}
        <Image
          src={AddReaction}
          style={{
            width: 15
          }}
        />
      </div>
    </div>
  )
}

export default LeftMessage;