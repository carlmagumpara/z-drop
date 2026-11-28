import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import Avatar from 'boring-avatars';
import { IoSettingsOutline, IoSend } from 'react-icons/io5';
import { usePresence } from '@/contexts/presence';
import { useGlobalModal, MODAL_TYPES } from '@/contexts/global-modal';

function Navigation() {
  const { handleShow } = useGlobalModal();
  const { username } = usePresence();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-[1030] border-b border-white/10 bg-[#060a12]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-none items-center justify-between px-4 py-2.5 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
          aria-label="zDrop home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-sky-400 to-violet-500 text-white shadow-lg shadow-sky-500/25 transition-transform group-hover:scale-105">
            <IoSend size={17} />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            z<span className="text-sky-400">Drop</span>
          </span>
        </Link>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-expanded={open}
            aria-label="Account menu"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 p-1 pr-3 text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
          >
            <span className="overflow-hidden rounded-full ring-1 ring-white/15">
              <Avatar name={username ?? ''} size={28} variant="beam" />
            </span>
            <span className="max-w-[110px] truncate text-sm font-medium">{username}</span>
          </button>

          {open ? (
            <div className="animate-[fade-scale-in_0.16s_ease-out_both] absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0d1524] p-1.5 shadow-2xl shadow-black/50">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleShow(MODAL_TYPES.SETTINGS);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <IoSettingsOutline size={17} className="text-sky-400" />
                Settings
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Navigation;
