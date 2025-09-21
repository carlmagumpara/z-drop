import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Modal, Button, Form } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useGlobalModal, MODAL_TYPES } from '../global-modal';
import { usePresence } from '@/contexts/presence';
import { createRoom } from '@/shared/api';

function CreatePrivateRoom() {
  const navigate = useNavigate();
  const { show, handleClose } = useGlobalModal();
  const { user_id } = usePresence();

  const onSubmit = async (values, { setSubmitting, setErrors }) => {
    setSubmitting(true);
    try {
      const data = await createRoom({
        ...values,
        owner_id: user_id
      });
      setSubmitting(false);
      handleClose();
      navigate(`/r/${data.data.room_id}`);
    } catch (error) {
      setSubmitting(false);
      console.log(error);
    }
  };

  return (
    <>
      <Formik
        initialValues={{
          name: '',
          password: '',
        }}
        validationSchema={() => Yup.object().shape({
          name: Yup.string().required('Required'),
          password: Yup.string().required('Required'),
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
              <Modal.Title>Create Private Room</Modal.Title>
            </Modal.Header>
            <Form 
              onSubmit={handleSubmit} 
              autoComplete="off"
            >
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Room Name</Form.Label>
                  <Form.Control 
                    name="name"
                    placeholder="Enter Room Name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.name && touched.name && 'is-invalid'}
                  />
                  {errors.name && touched.name && <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Room Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Enter Room Password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.password && touched.password && 'is-invalid'}
                  />
                  {errors.password && touched.password && <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>}
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
                  {isSubmitting ? 'Please wait...' : 'Submit'}
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

export default CreatePrivateRoom;