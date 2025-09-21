import { useState } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import RQRCode from 'react-qr-code';
import { FaCopy } from 'react-icons/fa';
import { useGlobalModal, MODAL_TYPES } from '../global-modal';
import { useMessage } from '../message';

function QRCode({ url = '', data = {} }) {
  const messageApi = useMessage();
  const { show, handleClose } = useGlobalModal();

  const copyToClipBoard = async text => {
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success(`${text} copied!`);
    } catch (err) {
      messageApi.error('Failed to copy!');
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      backdrop="static"
      keyboard={false}
      className="lexmeet__default-modal"
      centered
    >
      <Modal.Header 
        className="border-0" 
        closeButton
      >
        <Modal.Title style={{ fontSize: 15 }}>
          Scan this or copy the url to send/receive from other devices.
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          className="mb-3 d-flex justify-content-center align-items-center"
        >
          <RQRCode 
            value={url}
            size={200}
          />
        </div>
        <Form>
          <Form.Group className="mb-3" >
            <Form.Label>URL</Form.Label>
            <InputGroup>
              <Form.Control
                value={url}
                readOnly
              />
              <Button 
                variant="outline-secondary"
                onClick={() => copyToClipBoard(url)}
              >
                <FaCopy />
              </Button>
            </InputGroup>
          </Form.Group>
          {data.password ? (
          <Form.Group className="mb-3" >
            <Form.Label>Room Password</Form.Label>
            <InputGroup>
              <Form.Control
                value={data.password}
                readOnly
              />
              <Button 
                variant="outline-secondary"
                onClick={() => copyToClipBoard(data.password)}
              >
                <FaCopy />
              </Button>
            </InputGroup>
          </Form.Group>
          ) : null}
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default QRCode;