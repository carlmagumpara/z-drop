import { useEffect, useState } from 'react';
import Avatar from 'boring-avatars';
import moment from 'moment';
import Picker from 'emoji-picker-react';
import { socket } from '../../socket';

function RightMessage({ item }) {
  const [hover, setHover] = useState(false);

  const truncate = (str, n = 10) => str.length > n ? str.slice(0, n) + "..." : str;

  const formatTime = (date) => {
    const diffInSeconds = moment().diff(moment(date), "seconds");
    if (diffInSeconds < 5) {
      return "just now";
    }

    return moment(date).fromNow();
  };

  return (
    <div className="message right position-relative">
      <div className="avatar" aria-hidden="true">
        <Avatar
          name={item.username}
          size={44}
          variant="beam"
        />
      </div>
      <div>
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
              onReactionClick={() => {}} 
            />
          </div>
        ) : null}
        <div 
          className="bubble"
          onMouseOver={() => setHover(true)}
          onMouseOut={() => setHover(false)}
        >
          {item.message}
        </div>
        <div className="meta right">
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

export default RightMessage;