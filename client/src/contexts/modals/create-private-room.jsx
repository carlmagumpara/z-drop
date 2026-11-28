import { useNavigate } from 'react-router';
import { Modal, Button, Form } from '@/ui';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { IoDocumentLockOutline, IoLockClosedOutline } from 'react-icons/io5';
import { useGlobalModal } from '../global-modal';
import { usePresence } from '@/contexts/presence';
import { createRoom } from '@/shared/api';

function CreatePrivateRoom() {
  const navigate = useNavigate();
  const { show, handleClose } = useGlobalModal();
  const { user_id } = usePresence();

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const data = await createRoom({ ...values, owner_id: user_id });
      handleClose();
      navigate(`/r/${data.room_id}?private=1`);
    } catch (error) {
      console.log(error);
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{ name: '', password: '' }}
      validationSchema={() =>
        Yup.object().shape({
          name: Yup.string().required('A room name is required'),
          password: Yup.string().required('A password is required'),
        })
      }
      onSubmit={onSubmit}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
      }) => (
        <Modal show={show} centered onHide={handleClose} className="max-w-md">
          <Modal.Header closeButton onHide={handleClose}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
                <IoDocumentLockOutline size={20} />
              </span>
              <div>
                <Modal.Title>Create private room</Modal.Title>
                <p className="mt-1 text-xs text-slate-500">
                  Only people with the password can join.
                </p>
              </div>
            </div>
          </Modal.Header>

          <Form onSubmit={handleSubmit} autoComplete="off">
            <Modal.Body>
              <Form.Group>
                <Form.Label htmlFor="private-room-name">Room name</Form.Label>
                <Form.Control
                  id="private-room-name"
                  name="name"
                  placeholder="e.g. Weekend project"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.name && touched.name ? 'is-invalid' : undefined}
                />
                {errors.name && touched.name ? (
                  <Form.Control.Feedback>{errors.name}</Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <Form.Group className="mb-0">
                <Form.Label htmlFor="private-room-password">Password</Form.Label>
                <Form.Control
                  id="private-room-password"
                  type="password"
                  name="password"
                  placeholder="Choose a password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.password && touched.password ? 'is-invalid' : undefined}
                />
                {errors.password && touched.password ? (
                  <Form.Control.Feedback>{errors.password}</Form.Control.Feedback>
                ) : null}
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="link" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <IoLockClosedOutline size={17} />
                {isSubmitting ? 'Creating…' : 'Create room'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </Formik>
  );
}

export default CreatePrivateRoom;
