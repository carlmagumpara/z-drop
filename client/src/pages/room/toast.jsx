import { useState } from 'react';
import { Toast, Button } from 'react-bootstrap';
import { LuExpand, LuShrink } from 'react-icons/lu';

function CustomToast({ children, visibility = false, title = '' }) {
  const [show, setShow] = useState(visibility);

  return (
    <Toast 
      className="border-0 mb-2 animate__animated animate__bounceIn"
      {...(!show ? {
        style: {
          width: 200
        }
      } :{})}
    >
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
          onClick={() => setShow(!show)}
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