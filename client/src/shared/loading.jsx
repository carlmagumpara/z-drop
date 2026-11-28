import { IoSend } from 'react-icons/io5';

function LoaderFull() {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center overflow-hidden bg-[#060a12] text-slate-100">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="grid-bg absolute inset-0" />
        <div className="glow-orb absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-600/25" />
        <div className="glow-orb absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-violet-700/20" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center">
        {/* Radar-style orbit around the zDrop mark */}
        <div className="relative mb-9 flex h-40 w-40 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-sky-400/15" />
          <span className="absolute inset-6 rounded-full border border-sky-400/20" />
          <span className="absolute inset-12 rounded-full border border-sky-400/10" />

          <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(56,189,248,0.35)_60deg,transparent_120deg)] animate-[loader-orbit_2.4s_linear_infinite]" />

          <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-sky-300 shadow-[0_0_14px_3px_rgba(125,211,252,0.7)] animate-[soft-blink_1.8s_ease-in-out_infinite]" />
          <span
            className="absolute bottom-3 right-5 h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_2px_rgba(196,181,253,0.6)]"
            style={{ animation: 'soft-blink 1.8s ease-in-out 0.7s infinite' }}
          />

          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-sky-400 to-violet-500 text-white shadow-xl shadow-sky-500/30">
            <IoSend size={26} />
          </span>
        </div>

        <p className="animate-[rise-in_0.6s_ease-out_both] text-xl font-semibold tracking-tight text-white">
          Opening your room
        </p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
          Getting everything ready — files stay on your device, always.
        </p>

        <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-linear-to-r from-sky-500/40 to-cyan-300/40">
            <span className="absolute inset-y-0 w-1/3 rounded-full bg-linear-to-r from-sky-400 to-cyan-200 animate-[loader-track_1.6s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoaderFull;
