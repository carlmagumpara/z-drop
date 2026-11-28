import { Modal, Button, Form, InputGroup } from '@/ui';
import qrCodeModule from 'react-qr-code';
import { resolveCjsDefault } from '@/shared/cjs-default';
import { IoQrCodeOutline, IoCopyOutline } from 'react-icons/io5';
import { useGlobalModal } from '../global-modal';
import { useMessage } from '../message';

const RQRCode = resolveCjsDefault(qrCodeModule);

function QRCode({ url = '' }) {
  const messageApi = useMessage();
  const { show, handleClose } = useGlobalModal();

  const copyToClipBoard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success('Room link copied to clipboard');
    } catch {
      messageApi.error('Could not copy the link');
    }
  };

  return (
    <Modal show={show} centered onHide={handleClose} className="max-w-md">
      <Modal.Header closeButton onHide={handleClose}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
            <IoQrCodeOutline size={20} />
          </span>
          <div>
            <Modal.Title>Invite people</Modal.Title>
            <p className="mt-1 text-xs text-slate-500">
              Scan the code or share the link to bring others into this room.
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="mx-auto mb-6 w-fit rounded-2xl bg-white p-4 shadow-lg shadow-black/30">
          <RQRCode value={url} size={184} bgColor="#ffffff" fgColor="#0f172a" />
        </div>

        <Form onSubmit={(event) => event.preventDefault()}>
          <Form.Group className="mb-0">
            <Form.Label>Room link</Form.Label>
            <InputGroup>
              <Form.Control
                value={url}
                readOnly
                className="min-w-0 grow rounded-none border-0 bg-transparent focus:ring-0"
                aria-label="Room link"
              />
              <Button
                variant="light"
                className="shrink-0 rounded-none border-0 border-l border-white/10 bg-white/5 px-4"
                onClick={() => copyToClipBoard(url)}
                title="Copy link"
                aria-label="Copy link"
              >
                <IoCopyOutline size={17} />
              </Button>
            </InputGroup>
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default QRCode;
