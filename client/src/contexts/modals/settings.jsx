import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaRandom } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useGlobalModal, MODAL_TYPES } from '../global-modal';
import { usePresence } from '@/contexts/presence';
import { generateName } from '../../names';
import Avatar from 'boring-avatars';

function Settings({ formValues = {} }) {
  const { show, handleClose } = useGlobalModal();
  const { username, setUserName, auto_dowload, setAutoDownload } = usePresence();

  const onSubmit = async (values, { setSubmitting, setErrors }) => {
    localStorage.setItem("username", values.username);
    setUserName(values.username);
    setAutoDownload(values.auto_dowload);
    handleClose();
  };

  return (
    <>
      <Formik
        initialValues={{
          username,
          auto_dowload
        }}
        validationSchema={() => Yup.object().shape({
          username: Yup.string().required('Required'),
        })}
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
        setValues
       }) => (
         <>
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
              <Modal.Title>Settings</Modal.Title>
            </Modal.Header>
            <Form 
              onSubmit={handleSubmit} 
              autoComplete="off"
            >
              <Modal.Body>
                <div className="d-flex justify-content-center align-items-center">
                  <Avatar
                    name={values.username}
                    size={200}
                    variant="beam"
                  />
                </div>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control 
                    name="username"
                    placeholder="Username"
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.username && touched.username && 'is-invalid'}
                  />
                  {errors.username && touched.username && <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>}
                </Form.Group>
                <div className="mb-3 d-flex justify-content-end align-items-center">
                  <Button 
                     size="sm"
                    variant="outline-secondary"
                    onClick={() => setFieldValue(
                      'username', 
                      `${generateName()}_${Math.floor(Math.random() * 1000)}`.replace(/ /g,"_")
                    )}
                  >
                    <FaRandom /> Generate Name
                  </Button>
                </div>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    label="Auto download on receving file"
                    checked={values.auto_dowload}
                    onChange={() => setFieldValue('auto_dowload', !values.auto_dowload)}
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="link"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button 
                  disabled={isSubmitting}
                  type="submit"
                  variant="danger"
                >
                  {isSubmitting ? 'PLEASE WAIT...' : 'Update'}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </>
       )}
      </Formik>
    </>
  )
}

export default Settings;