import { Suspense } from 'react';
import { Outlet } from 'react-router';
import Loading from '@/shared/loading';
import { usePresence } from '@/contexts/presence';
import Navigation from './navigation';

function Wrapper() {
  const { username } = usePresence();

  if(!username) {
    return <Loading />;
  }

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