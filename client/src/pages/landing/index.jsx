import 'animate.css';
import '../../radar.scss'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container, Button } from 'react-bootstrap';
import { IoHeart } from 'react-icons/io5';
import { v4 as uuidv4 } from 'uuid';

const imageModules = import.meta.glob('@/assets/formats/*.{png,jpg,jpeg,gif,svg}', { 
  eager: true, 
  as: 'url' 
});
const imageUrls = Object.values(imageModules);

function Landing() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const generated = Array.from({ length: imageUrls.length }, () => ({
      src: imageUrls[Math.floor(Math.random() * imageUrls.length)],
      top: `${Math.random() * 90}`,
      left: `${Math.random() * 90}`,
      duration: `${4 + Math.random() * 4}s`
    }));

    setItems(generated);

    const onMouseMove = (event) => setMousePosition({
      x: event.clientX,
      y: event.clientY,
    });

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
              <Button
                size="lg"
                onClick={() => navigate(`/r/${uuidv4()}`)}
              >
                Start Transferring Files
              </Button>
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