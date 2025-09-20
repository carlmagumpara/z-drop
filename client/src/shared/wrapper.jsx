import { Suspense } from 'react';
import { Outlet } from 'react-router';
import Loading from '@/shared/loading';
import Navigation from './navigation';

function Wrapper() {
  return (
    <>
      <Navigation />
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </>
  );
}

export default Wrapper;