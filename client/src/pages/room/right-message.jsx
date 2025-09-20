import { useEffect, useState } from 'react';
import { Image } from 'react-bootstrap';
import Avatar from 'boring-avatars';
import moment from 'moment';
import Picker from 'emoji-picker-react';
import { usePresence } from '@/contexts/presence';
import { socket } from '@/shared/socket';
import useSound from './sounds';;
import AddReaction from '@/assets/add-reaction.png';

function RightMessage({ item, roomId }) {
  const sounds = useSound();
  const [hover, setHover] = useState(false);
  const { user_id, username } = usePresence();

  const formatTime = (date) => {
    const diffInSeconds = moment().diff(moment(date), "seconds");
    if (diffInSeconds < 5) {
      return "just now";
    }

    return moment(date).fromNow();
  };

  return (
    <div 
      className="message right position-relative"
    >
      <div 
        className="avatar"
      >
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
          <div className="meta right">
            <p className="mb-0">{item.username}</p>
            <p className="mb-0">{formatTime(item.dateTime)}</p>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center pt-1">
          {item.readers.length ? (
            <div className="d-flex justify-content-start align-items gap-1">
              <span className="small">✓</span> {item.readers.map(reader => (
                <Avatar
                  key={reader}
                  name={reader}
                  size={15}
                  variant="beam"
                />
              ))}
            </div>
          ) : <div />}
          {(item.reactions ?? []).length ? (
            <div className="d-flex justify-content-end align-items gap-1 h6">
              {(item.reactions ?? []).map((emoji, index) => (
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
              left: 0,
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

export default RightMessage;