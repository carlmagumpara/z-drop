import { useState } from 'react';
import { Toast, Button } from 'react-bootstrap';
import { LuExpand, LuShrink } from 'react-icons/lu';
import { whoopSfx, popSfx } from './sounds';
import useSound from '@/hooks/use-sound';

function CustomToast({ children, title = '' }) {
  const [playPopSfx] = useSound(popSfx);
  const [playWhoopSfx] = useSound(whoopSfx);
  const [show, setShow] = useState(false);

  return (
    <Toast className="border-0 mb-2">
      <Toast.Header 
        closeButton={false}
        className="d-flex justify-content-between align-items-center w-100 border-0"
      >
        <strong className="me-auto">{title}</strong>
        <Button
          className="border-0 rounded-circle p-0"
          variant="light"
          size="sm"
          style={{ 
            width: 30,
            height: 30,
            lineHeight: 1 
          }}
          onClick={() => {
            if(show) {
              playWhoopSfx();
            } else {
              playPopSfx();
            }
            setShow(!show);
          }}
        >
          {show ? <LuShrink size={15} /> : <LuExpand size={15} />}
        </Button>
      </Toast.Header>
      <Toast.Body
        className={`p-0 ${show ? '' : 'd-none'}`}
      >
        {children(show)}
      </Toast.Body>
    </Toast>
  )
}

export default CustomToast;