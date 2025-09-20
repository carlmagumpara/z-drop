import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';
import './index.scss'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router';
import PresenceProvider from './contexts/presence';
import MessageProvider from './contexts/message';
import GlobalModalProvider from './contexts/global-modal';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <>
    <BrowserRouter>
      <PresenceProvider>
        <MessageProvider>
          <GlobalModalProvider>          
            <App />
          </GlobalModalProvider>
        </MessageProvider>
      </PresenceProvider>
    </BrowserRouter>
  </>,
)
