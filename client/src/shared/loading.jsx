import React from 'react';
import { Image } from 'react-bootstrap';
import { BarLoader } from 'react-spinners';

function LoaderFull() {
  return (
    <div
      className="full-loader w-100 d-flex justify-content-center align-items-center bg-white"
    >
      <div
        className="d-flex flex-column align-items-center"
      >
        <BarLoader />
      </div>
    </div>
  )
}

export default LoaderFull;