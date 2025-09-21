import { lazy } from 'react';
import { Routes, Route } from 'react-router';
import Wrapper from '@/shared/wrapper';

const Landing = lazy(() => import('./pages/landing'));
const Room = lazy(() => import('./pages/room'));

function App() {
  return (    
    <Routes>        
      <Route element={<Wrapper />}>
        <Route path="/" element={<Landing />} />
        <Route path="/r/:room_id" element={<Room />} />
      </Route>
    </Routes>
  )
}

export default App
