import Avatar from 'boring-avatars';
import moment from 'moment';

function RightMessage({ item }) {

  const truncate = (str, n = 10) => str.length > n ? str.slice(0, n) + "..." : str;

  const formatTime = (date) => {
    const diffInSeconds = moment().diff(moment(date), "seconds");
    if (diffInSeconds < 5) {
      return "just now";
    }

    return moment(date).fromNow();
  };

  return (
    <div className="message right">
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
        <div className="meta right">
          {`${truncate(item.username)} · ${formatTime(item.dateTime)}`}
        </div>
        {item.readBy.length ? (
          <div className="d-flex justify-content-start align-items gap-1">
            <span className="small">✓</span> {item.readBy.map(reader => (
              <Avatar
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