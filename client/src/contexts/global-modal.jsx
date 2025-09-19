import { createContext, useContext, useState, Suspense, useEffect, lazy } from 'react';
const Context = createContext();

const MODAL_COMPONENTS = {
  QR_CODE: lazy(() => import('./modals/qr-code')),
  SETTINGS: lazy(() => import('./modals/settings')),
};

export const MODAL_TYPES = Object.keys(MODAL_COMPONENTS).reduce((acc, key) => {
  acc[key] = key;
  return acc;
}, {});

export const useGlobalModal = () => useContext(Context) || {};

const GlobalModalProvider = ({ children }) => {
  const [modalProps, setModalProps] = useState({});
  const [modalType, setModalType] = useState(null);
  const [show, setShow] = useState(false);

  const handleClose = () => {
    setModalType(null);
    setShow(false);
  };

  const handleShow = (_modalType, _modalProps = {}) => {
    setModalType(_modalType);
    setModalProps(_modalProps);
    setShow(true);
  };

  const renderModalComponent = () => {
    const Component = MODAL_COMPONENTS[modalType];

    if (!modalType || !Component) {
      return null;
    }

    return (
      <Suspense fallback={null}>
        <Component {...modalProps} />
      </Suspense>
    );
  };

  return (
    <Context.Provider
      value={{ 
        show,
        handleShow,
        handleClose,
        modalType
      }}
    >
      {children}
      {renderModalComponent()}
    </Context.Provider>
  );
};

export default GlobalModalProvider;