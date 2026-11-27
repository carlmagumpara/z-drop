import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '@/shared/socket';
import { generateName } from '@/shared/names';
import Loading from '@/shared/loading';

const PresenceContext = createContext();

export const usePresence = () => useContext(PresenceContext);

function getOrCreateIdentity() {
  let user_id = localStorage.getItem('user_id');
  let username = localStorage.getItem('username');

  if (!user_id || !username) {
    user_id = uuidv4();
    username = `${generateName()}_${Math.floor(Math.random() * 1000)}`.replace(/ /g, '_');

    localStorage.setItem('user_id', user_id);
    localStorage.setItem('username', username);
    localStorage.setItem('auto_download', 'true');
  }

  return { user_id, username };
}

function PresenceProvider({ children }) {
  const [identity] = useState(getOrCreateIdentity);
  const [is_connected, setIsConnected] = useState(socket.connected);
  const [user_id, setUserId] = useState(identity.user_id);
  const [username, setUserName] = useState(identity.username);
  const [auto_dowload, setAutoDownload] = useState(localStorage.getItem('auto_download') === 'true');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    files: 0,
    users: 0,
  });

  useEffect(() => {
    const announce = () => {
      setIsConnected(true);
      socket.emit('user_online', { user_id, username });
    };

    const onDisconnect = () => setIsConnected(false);
    const onUpdateUsers = value => setUsers(value);
    const onTotalUsers = value => setAnalytics(prev => ({ ...prev, users: value ?? 0 }));
    const onTotalFiles = value => setAnalytics(prev => ({ ...prev, files: value ?? 0 }));

    socket.on('connect', announce);
    socket.on('disconnect', onDisconnect);
    socket.on('update_users', onUpdateUsers);
    socket.on('total_users', onTotalUsers);
    socket.on('total_files', onTotalFiles);

    // The socket can already be open before this effect runs (e.g. first load).
    if (socket.connected) announce();

    return () => {
      socket.off('connect', announce);
      socket.off('disconnect', onDisconnect);
      socket.off('update_users', onUpdateUsers);
      socket.off('total_users', onTotalUsers);
      socket.off('total_files', onTotalFiles);
    };
  }, [user_id, username]);

  if (!username || !user_id || !is_connected) {
    return <Loading />;
  }

  return (
    <PresenceContext.Provider
      value={{
        user_id,
        username,
        auto_dowload,
        setUserId,
        setUserName,
        setAutoDownload,
        users,
        analytics,
        is_connected,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export default PresenceProvider;
