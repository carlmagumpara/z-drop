import { useEffect, useState } from 'react';
import { detectVpn } from './vpn-check';

export default function VpnAlert() {
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    let active = true;
    detectVpn().then((result) => {
      if (active) setDetected(result);
    });
    return () => { active = false; };
  }, []);

  if (!detected) return null;

  return (
    <div
      role="alert"
      className="fixed left-1/2 top-3 z-[2000] w-[min(94vw,720px)] -translate-x-1/2 rounded-xl border border-rose-400/30 bg-[#2a0f16]/95 px-4 py-3 text-center text-sm text-rose-100 shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      <strong className="font-semibold text-rose-200">VPN or proxy detected.</strong>{' '}
      zDrop's peer-to-peer file sharing does not work over a VPN. Disable it and{' '}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="font-semibold text-rose-200 underline underline-offset-2 hover:text-white"
      >
        reload the page
      </button>
      .
    </div>
  );
}
