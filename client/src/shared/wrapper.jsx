import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import Loading from '@/shared/loading';
import Navigation from './navigation';

function Wrapper() {
  // The landing page renders its own hero navbar; the room uses this one.
  const { pathname } = useLocation();

  return (
    <>
      {pathname !== '/' ? <Navigation /> : null}
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </>
  );
}

export default Wrapper;