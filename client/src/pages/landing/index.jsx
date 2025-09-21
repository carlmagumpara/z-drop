import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container, Button } from 'react-bootstrap';
import { IoHeart } from 'react-icons/io5';
import { BsFillSendArrowUpFill } from 'react-icons/bs';
import { IoDocumentLock } from 'react-icons/io5';
import { v4 as uuidv4 } from 'uuid';
import CountUp from 'react-countup';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';

const imageModules = import.meta.glob('@/assets/formats/*.{png,jpg,jpeg,gif,svg}', { 
  eager: true, 
  as: 'url' 
});
const imageUrls = Object.values(imageModules);

const positions = [
  ["68.0079vh", "78.1169vw", 9.8137],
  ["16.6089vh", "66.5236vw", 4.26769],
  ["44.8406vh", "23.1708vw", 11.36872],
  ["81.8894vh", "49.8739vw", 7.05431],
  ["79.5659vh", "69.8348vw", 2.77171],
  ["75.0066vh", "17.3301vw", 5.17751],
  ["41.0161vh", "12.6346vw", 3.34194],
  ["51.2666vh", "83.3114vw", 9.8813],
  ["83.6709vh", "33.481vw", 5.1069],
  ["17.1147vh", "11.1785vw", 5.27081]
];

function Landing() {
  const navigate = useNavigate();
  const { user_id, users, analytics } = usePresence();

  useEffect(() => {
    const onMouseMove = (event) => {};

    window.addEventListener('mousemove', onMouseMove);

    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);  

  return (
    <div className="radar-container">
      <div
        className="w-100 vh-100 d-flex flex-column radar "
      >
        <div 
          className="w-100 flex-grow-1"
          style={{
            zIndex: 999
          }}
        >
          <div className="w-100 d-flex justify-content-center align-items-center h-100">
            <div className="text-center">
              <h1 className="display-1 animate__animated animate__flipInX fw-bolder">zDrop</h1>
              <h3 className="animate__animated animate__flipInX animate__delay-1s">
                Secure P2P File Sharing with Chat
              </h3>
              <h3 className="mb-5 animate__animated animate__flipInX animate__delay-2s">
                No limits, No delays — Share and Talk instantly!
              </h3>
              <div className="mb-2">
                <Button
                  size="lg"
                  onClick={() => {
                    const room_id = uuidv4();

                    socket.emit("create-room", {
                      room_id,
                      name: 'kung ano ano lang',
                      password: null,
                      owner_id: user_id,
                    });
                    navigate(`/r/${room_id}`);
                  }}
                >
                  <BsFillSendArrowUpFill /> Get Started
                </Button>
              </div>
              <div className="mb-2">
                <Button
                  variant="link"
                  className="text-dark text-decoration-none"
                  onClick={() => {
                    const room_id = uuidv4();

                    socket.emit("create-room", {
                      room_id,
                      name: 'kung ano ano lang',
                      password: '09071995',
                      owner_id: user_id,
                    });
                    navigate(`/r/${room_id}`);
                  }}
                >
                  <IoDocumentLock /> Create Room with Password
                </Button>
              </div>
              <div className="d-flex justify-content-center align-items-center gap-3">
                <div>
                  <p>Total Files Sent</p>
                  <h4>
                    <CountUp
                      start={0}
                      end={analytics.files} 
                    />
                  </h4>
                </div>
                <div>
                  <p>Total Users</p>
                  <h4>
                    <CountUp
                      start={0}
                      end={analytics.users} 
                    />
                  </h4>
                </div>
                <div>
                  <p>Online Now</p>
                  <h4>
                    <CountUp
                      start={0}
                      end={users.length} 
                    />
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        {imageUrls.map((item, index) => (
          <img
            key={index}
            src={item}
            alt="logo"
            className="floating-logo"
            style={{
              position: "absolute",
              top: positions[index][0],
              left: positions[index][1],
              width: "60px",
              opacity: 0.30,
              pointerEvents: "none",
              animation: `float ${positions[index][2]}s ease-in-out infinite`,
              zIndex: 998
            }}
          />
        ))}
        <footer className="text-center">
          <p className="footer-heart">
            Made with <IoHeart color="#ff0000" /> by <a target="_blank" rel="noopener" href="https://github.com/carlmagumpara">carlmagumpara</a>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default Landing;