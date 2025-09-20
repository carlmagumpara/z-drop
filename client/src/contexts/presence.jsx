import { createContext, useContext, useState, useEffect } from 'react';
import { socket } from '@/shared/socket';
import { generateName } from '@/shared/names';

const PresenceContext = createContext();

export const usePresence = () => useContext(PresenceContext);

function PresenceProvider({ children }) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [username, setUserName] = useState(localStorage.getItem("username"));
  const [auto_dowload, setAutoDownload] = useState(localStorage.getItem("auto_download") === 'true');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    files: 0,
    users: 0,
  });

  useEffect(() => {
    const onConnect = () => {
      if(!username) {
        const name = `${generateName()}_${Math.floor(Math.random() * 1000)}`.replace(/ /g,"_");

        localStorage.setItem("username", name);
        localStorage.setItem("auto_download", true);
        setUserName(name);
        setAutoDownload(true);

        socket.emit(
          "user_online",
          name,
        );
      } else {
        socket.emit(
          "user_online",
          username,
        );
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
  }, [username]);

  console.log('analytics', analytics);

  return (
    <PresenceContext.Provider
      value={{
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