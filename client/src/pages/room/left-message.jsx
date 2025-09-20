import { useEffect, useState } from 'react';
import { Image } from 'react-bootstrap';
import Avatar from 'boring-avatars';
import moment from 'moment';
import Picker from 'emoji-picker-react';
import useOnScreen from '@/hooks/use-on-screen';
import { usePresence } from '@/contexts/presence';
import { socket } from '@/shared/socket';
import useSound from './sounds';
import AddReaction from '@/assets/add-reaction.png';

function LeftMessage({ item, roomId }) {
  const sounds = useSound();
  const [hover, setHover] = useState(false);
  const [ref, isVisible] = useOnScreen({
    threshold: 0.1,
  });
  const { user_id, username } = usePresence();
  
  useEffect(() => {
    if(isVisible && !item.readBy.find(user => user.user_id === user_id)) {
      socket.emit("on-message", {
        roomId,
        type: 'read',
        data: {
          message_id: item.id,
          username,
          user_id,
        },
      });
    }
  }, [isVisible]);

  const formatTime = (date) => {
    const diffInSeconds = moment().diff(moment(date), "seconds");
    if (diffInSeconds < 5) {
      return "just now";
    }

    return moment(date).fromNow();
  };

  return (
    <div 
      ref={ref}
      className="message left position-relative" 
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
            <p className="mb-0">{formatTime(item.dateTime)}</p>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center pt-1">
          {item.showReaders.length ? (
            <div className="d-flex justify-content-start align-items gap-1">
              <span className="small">✓</span> {item.showReaders.map(reader => (
                <Avatar
                  key={reader}
                  name={reader}
                  size={15}
                  variant="beam"
                />
              ))}
            </div>
          ) : <div />}
          {(item.showReactions ?? []).length ? (
            <div className="d-flex justify-content-end align-items gap-1 h6">
              {(item.showReactions ?? []).map((emoji, index) => (
                <span key={`${emoji[0]}-index`} className="animate__animated animate__bounceIn">
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
                  roomId,
                  type: 'react',
                  data: {
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