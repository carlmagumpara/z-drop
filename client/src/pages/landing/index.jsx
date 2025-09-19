import 'animate.css';
import '../../radar.scss'

import { useNavigate } from 'react-router';
import { Container, Button } from 'react-bootstrap';
import { IoHeart } from 'react-icons/io5';
import { v4 as uuidv4 } from 'uuid';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="radar-container">
      <div
        className="w-100 vh-100 d-flex flex-column radar "
      >
        <div className="w-100 flex-grow-1">
          <div className="w-100 d-flex justify-content-center align-items-center h-100">
            <div className="text-center ">
              <h1 className="display-1 animate__animated animate__flipInX">TalkDrop</h1>
              <h1 className="mb-5 animate__animated animate__flipInX animate__delay-1s">Instant share, instant connect.</h1>
              <Button
                size="lg"
                onClick={() => navigate(`/r/${uuidv4()}`)}
              >
                Start Transferring Files
              </Button>
            </div>
          </div>
        </div>
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