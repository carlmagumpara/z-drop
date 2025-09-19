import { useState } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import RQRCode from 'react-qr-code';
import { FaCopy } from 'react-icons/fa';
import { useGlobalModal, MODAL_TYPES } from '../global-modal';
import { useMessage } from '../message';

function QRCode({ url = '' }) {
  const messageApi = useMessage();
  const { show, handleClose } = useGlobalModal();

  const copyToClipBoard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      messageApi.success(`${url} copied!`);
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
                onClick={copyToClipBoard}
              >
                <FaCopy />
              </Button>
            </InputGroup>
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default QRCode;