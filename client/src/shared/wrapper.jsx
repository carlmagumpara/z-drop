import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import Loading from '@/shared/loading';
import Navigation from './navigation';
import VpnAlert from './vpn-alert';

function Wrapper() {
  // The landing page renders its own hero navbar; the room uses this one.
  const { pathname } = useLocation();

  return (
    <>
      <VpnAlert />
      {pathname !== '/' ? <Navigation /> : null}
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </>
  );
}

export default Wrapper;