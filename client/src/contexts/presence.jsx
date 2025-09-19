import { createContext, useContext, useState, useEffect } from 'react';
import { socket } from '../socket';
import { generateName } from '../names';

const PresenceContext = createContext();

export const usePresence = () => useContext(PresenceContext);

function PresenceProvider({ children }) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [username, setUserName] = useState(localStorage.getItem("username"));
  const [auto_dowload, setAutoDownload] = useState(localStorage.getItem("auto_download") === 'true');
  const [users, setUsers] = useState([]);

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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('update_users', onUpdateUsers);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('update_users', onUpdateUsers);
    };
  }, [username]);

  return (
    <PresenceContext.Provider
      value={{
        username,
        setUserName,
        auto_dowload, 
        setAutoDownload,
        users,
        isConnected
      }}
    >
      {children}
    </PresenceContext.Provider>
  )
}

export default PresenceProvider;