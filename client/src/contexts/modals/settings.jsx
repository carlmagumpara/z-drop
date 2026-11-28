import { Modal, Button, Form } from '@/ui';
import { IoDiceOutline, IoSettingsOutline } from 'react-icons/io5';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useGlobalModal } from '../global-modal';
import { usePresence } from '@/contexts/presence';
import { generateName } from '@/shared/names';
import Avatar from 'boring-avatars';

function Settings() {
  const { show, handleClose } = useGlobalModal();
  const { user_id, username, auto_dowload, setUserName, setAutoDownload } = usePresence();

  const onSubmit = async (values) => {
    localStorage.setItem('username', values.username);
    setUserName(values.username);
    setAutoDownload(values.auto_dowload);
    handleClose();
  };

  return (
    <Formik
      initialValues={{ user_id, username, auto_dowload }}
      validationSchema={() =>
        Yup.object().shape({
          username: Yup.string().required('A username is required'),
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
        setFieldValue,
      }) => (
        <Modal show={show} centered onHide={handleClose} className="max-w-md">
          <Modal.Header closeButton onHide={handleClose}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
                <IoSettingsOutline size={20} />
              </span>
              <div>
                <Modal.Title>Settings</Modal.Title>
                <p className="mt-1 text-xs text-slate-500">
                  Make the room feel like yours.
                </p>
              </div>
            </div>
          </Modal.Header>

          <Form onSubmit={handleSubmit} autoComplete="off">
            <Modal.Body>
              <div className="relative mx-auto mb-7 flex w-fit flex-col items-center">
                <div className="absolute inset-0 rounded-full bg-sky-500/20 blur-2xl" />
                <div className="relative overflow-hidden rounded-full border-2 border-white/15 shadow-xl shadow-black/40">
                  <Avatar name={values.username} size={104} variant="beam" />
                </div>
              </div>

              <Form.Group>
                <Form.Label htmlFor="settings-username">Username</Form.Label>
                <Form.Control
                  id="settings-username"
                  name="username"
                  placeholder="Your display name"
                  value={values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.username && touched.username ? 'is-invalid' : undefined}
                />
                {errors.username && touched.username ? (
                  <Form.Control.Feedback>{errors.username}</Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <div className="-mt-2 mb-5 flex justify-end">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() =>
                    setFieldValue(
                      'username',
                      `${generateName()}_${Math.floor(Math.random() * 1000)}`.replace(/ /g, '_'),
                    )
                  }
                >
                  <IoDiceOutline size={16} /> Generate name
                </Button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <Form.Check
                  type="switch"
                  label="Auto-download received files"
                  checked={values.auto_dowload}
                  onChange={() => setFieldValue('auto_dowload', !values.auto_dowload)}
                />
                <p className="mt-2 pl-[3.75rem] text-xs text-slate-500">
                  Save files as soon as a peer finishes sending them.
                </p>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="link" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </Formik>
  );
}

export default Settings;
