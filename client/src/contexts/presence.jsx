import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '@/shared/socket';
import { generateName } from '@/shared/names';

const PresenceContext = createContext();

export const usePresence = () => useContext(PresenceContext);

function PresenceProvider({ children }) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [user_id, setUserId] = useState(localStorage.getItem("user_id"));
  const [username, setUserName] = useState(localStorage.getItem("username"));
  const [auto_dowload, setAutoDownload] = useState(localStorage.getItem("auto_download") === 'true');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    files: 0,
    users: 0,
  });

  useEffect(() => {
    const onConnect = () => {
      if(!user_id || !username) {
        const _user_id = uuidv4();
        const _username = `${generateName()}_${Math.floor(Math.random() * 1000)}`.replace(/ /g,"_");

        localStorage.setItem("user_id", _user_id);
        localStorage.setItem("username", _username);
        localStorage.setItem("auto_download", true);

        setUserId(_user_id);
        setUserName(_username);
        setAutoDownload(true);

        socket.emit("user_online", {
          username: _username,
          user_id: _user_id,
        });
      } else {
        socket.emit("user_online", {
          user_id,
          username
        });
      }
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onUpdateUsers = (value) => {
      setUsers(value);
    };

    const onTotalUsers = (value) => {
      console.log("total_users", value);

      setAnalytics(prevState => ({
        ...prevState,
        users: value ?? 0,
      }));
    };

    const onTotalFiles = (value) => {
      console.log("total_files", value);

      setAnalytics(prevState => ({
        ...prevState,
        files: value ?? 0,
      }));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('update_users', onUpdateUsers);
    socket.on('total_users', onTotalUsers);
    socket.on('total_files', onTotalFiles);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('update_users', onUpdateUsers);
      socket.off('total_users', onTotalUsers);
      socket.off('total_files', onTotalFiles);
    };
  }, [user_id, username]);

  console.log('analytics', analytics);

  return (
    <PresenceContext.Provider
      value={{
        user_id,
        username,
        setUserName,
        auto_dowload, 
        setAutoDownload,
        users,
        analytics,
        isConnected
      }}
    >
      {children}
    </PresenceContext.Provider>
  )
}

export default PresenceProvider;