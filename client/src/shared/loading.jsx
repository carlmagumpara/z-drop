import React from 'react';
import { Image } from 'react-bootstrap';
import { BarLoader } from 'react-spinners';
import DataTransfer from '@/assets/data-transfer.gif';

function LoaderFull() {
  return (
    <div
      className="full-loader w-100 d-flex justify-content-center align-items-center bg-white"
    >
      <div
        className="d-flex flex-column align-items-center"
      >
        <Image
          src={DataTransfer}
        />
      </div>
    </div>
  )
}

export default LoaderFull;