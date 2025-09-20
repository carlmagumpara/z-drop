import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container, Button } from 'react-bootstrap';
import { IoHeart } from 'react-icons/io5';
import { v4 as uuidv4 } from 'uuid';
import CountUp from 'react-countup';
import { usePresence } from '@/contexts/presence';

const imageModules = import.meta.glob('@/assets/formats/*.{png,jpg,jpeg,gif,svg}', { 
  eager: true, 
  as: 'url' 
});
const imageUrls = Object.values(imageModules);

function Landing() {
  const navigate = useNavigate();
  const { users } = usePresence();
  const [items, setItems] = useState([]);

  const generated = () => {
    return Array.from({ length: imageUrls.length }, (_, index) => {
      const top = `${Math.random() * 90}`;
      const left = `${Math.random() * 90}`;

      return {
        top,
        left,
        originalTop: top,
        originalLeft: left,
        src: imageUrls[index],
        duration: `${4 + Math.random() * 4}s`
      }
    });
  };

  useEffect(() => {
    setItems(generated());
  }, []);  

  useEffect(() => {
    const onMouseMove = (event) => {
      setItems(prevState => prevState.map(item => ({
        ...item,
        top: parseFloat(item.originalTop) + (event.clientX / 1000),
        left: parseFloat(items.originalLeft) + (event.clientX / 1000),
      })));
    };

    window.addEventListener('mousemove', onMouseMove);

    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [items]);  

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
              <Button
                size="lg"
                className="mb-5"      
                onClick={() => navigate(`/r/${uuidv4()}`)}
              >
                Start Transferring Files
              </Button>
              <div className="d-flex justify-content-center align-items-center gap-3">
                <div>
                  <p>Total Files Sent</p>
                  <h4>
                    <CountUp
                      start={0}
                      end={100} 
                    />
                  </h4>
                </div>
                <div>
                  <p>Total Users</p>
                  <h4>
                    <CountUp
                      start={0}
                      end={users.length} 
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
        {items.map((item, i) => (
          <img
            key={i}
            src={item.src}
            alt="logo"
            className="floating-logo"
            style={{
              position: "absolute",
              top: `${item.top}vh`,
              left: `${item.left}vw`,
              width: "60px",
              opacity: 0.70,
              pointerEvents: "none",
              animation: `float ${item.duration} ease-in-out infinite`,
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