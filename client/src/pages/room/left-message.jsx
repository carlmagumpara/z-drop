import { useEffect } from 'react';
import Avatar from 'boring-avatars';
import moment from 'moment';
import useOnScreen from '@/hooks/use-on-screen';
import { usePresence } from '@/contexts/presence';
import { socket } from '../../socket';

function LeftMessage({ item, roomId }) {
  const [ref, isVisible] = useOnScreen({
    threshold: 0.1,
  });
  const { username } = usePresence();

  useEffect(() => {
    if(isVisible && !item.readBy.includes(username)) {
      socket.emit("on-message", {
        roomId,
        type: 'read',
        data: {
          message_id: item.id,
          username,
        },      
      });
    }
  }, [isVisible]);

  const truncate = (str, n = 10) => str.length > n ? str.slice(0, n) + "..." : str;

  const formatTime = (date) => {
    const diffInSeconds = moment().diff(moment(date), "seconds");
    if (diffInSeconds < 5) {
      return "just now";
    }

    return moment(date).fromNow();
  };

  return (
    <div className="message left" ref={ref}>
      <div className="avatar" aria-hidden="true">
        <Avatar
          name={item.username}
          size={44}
          variant="beam"
        />
      </div>
      <div>
        <div className="bubble">
          {item.message}
        </div>
        <div className="meta left">
          {`${truncate(item.username)} · ${formatTime(item.dateTime)}`}
        </div>
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
        ) : null}
      </div>
    </div>
  )
}

export default LeftMessage;