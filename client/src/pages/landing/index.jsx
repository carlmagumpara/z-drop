import { useNavigate } from 'react-router';
import countUpModule from 'react-countup';
import {
  IoHeart,
  IoArrowForward,
  IoDocumentLock,
  IoShieldCheckmark,
  IoFlash,
  IoPeople,
  IoQrCode,
  IoChatbubbles,
  IoFileTrayStacked,
  IoWifi,
  IoGlobeOutline,
  IoCheckmark,
  IoSend,
  IoLink,
  IoSparkles,
  IoServer,
  IoLockClosed,
} from 'react-icons/io5';
import { resolveCjsDefault } from '@/shared/cjs-default';
import { usePresence } from '@/contexts/presence';
import { useGlobalModal, MODAL_TYPES } from '@/contexts/global-modal';
import { createRoom } from '@/shared/api';

const imageModules = import.meta.glob('@/assets/formats/*.{png,jpg,jpeg,gif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const fileIcons = Object.values(imageModules);
const CountUp = resolveCjsDefault(countUpModule);

const chipPositions = [
  { top: '4%', left: '-7%', size: 56, delay: '0s' },
  { top: '12%', right: '-6%', size: 48, delay: '-1.8s' },
  { top: '46%', left: '-10%', size: 44, delay: '-3.4s' },
  { bottom: '14%', right: '-8%', size: 58, delay: '-4.9s' },
  { bottom: '2%', left: '16%', size: 42, delay: '-2.6s' },
];

const steps = [
  {
    number: '01',
    icon: IoFlash,
    title: 'Create a room',
    description: 'One click spins up a private space. No account, no download, no setup.',
  },
  {
    number: '02',
    icon: IoLink,
    title: 'Share the link',
    description: 'Send the room link or QR code to anyone you want to share with.',
  },
  {
    number: '03',
    icon: IoFileTrayStacked,
    title: 'Drop & chat',
    description: 'Files travel directly between browsers while you talk in real time.',
  },
];

const features = [
  {
    icon: IoWifi,
    title: 'True peer-to-peer',
    description: 'WebRTC sends files straight from your device to theirs. Nothing is stored in the middle.',
    accent: 'from-sky-400/20 to-cyan-400/5 text-sky-300',
  },
  {
    icon: IoLockClosed,
    title: 'Private by default',
    description: 'Password-protect a room so only people with the key can listen in.',
    accent: 'from-violet-400/20 to-violet-400/5 text-violet-300',
  },
  {
    icon: IoFileTrayStacked,
    title: 'Any file, any size',
    description: 'Documents, photos, videos, archives — drag them in and share without uploading.',
    accent: 'from-emerald-400/20 to-emerald-400/5 text-emerald-300',
  },
  {
    icon: IoChatbubbles,
    title: 'Built-in chat',
    description: 'Coordinate in the same room where the files land. Reactions included.',
    accent: 'from-amber-400/20 to-amber-400/5 text-amber-300',
  },
  {
    icon: IoQrCode,
    title: 'Scan to join',
    description: 'Generate a QR code for the room and bring people in from any device.',
    accent: 'from-pink-400/20 to-pink-400/5 text-pink-300',
  },
  {
    icon: IoGlobeOutline,
    title: 'Works everywhere',
    description: 'Runs in the browser on desktop and mobile. No install, no plug-in, no waiting.',
    accent: 'from-blue-400/20 to-blue-400/5 text-blue-300',
  },
];

function Logo({ compact = false }) {
  return (
    <a href="/" className="group flex items-center gap-2.5" aria-label="zDrop home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-sky-400 to-violet-500 text-white shadow-lg shadow-sky-500/25 transition-transform group-hover:scale-105">
        <IoSend size={18} />
      </span>
      {!compact && (
        <span className="text-xl font-bold tracking-tight text-white">
          z<span className="text-sky-400">Drop</span>
        </span>
      )}
    </a>
  );
}

function Navbar({ onCreateRoom }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#060a12]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          <a className="transition-colors hover:text-white" href="#how-it-works">How it works</a>
          <a className="transition-colors hover:text-white" href="#features">Features</a>
          <a className="transition-colors hover:text-white" href="#stats">Live stats</a>
        </div>
        <button
          type="button"
          onClick={onCreateRoom}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
        >
          Open a room <IoArrowForward size={15} />
        </button>
      </nav>
    </header>
  );
}

function RoomPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] animate-[rise-in_0.7s_ease-out_both] px-6 py-10 sm:px-10">
      {/* Ambient rings behind the mock window */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-72 w-72 sm:h-96 sm:w-96">
          <span className="absolute inset-0 rounded-full border border-sky-400/20" />
          <span className="absolute inset-8 rounded-full border border-sky-400/15" />
          <span className="absolute inset-16 rounded-full border border-sky-400/10" />
          <span className="absolute inset-0 rounded-full bg-sky-400/10 animate-[pulse-ring_4s_ease-out_infinite]" />
          <span className="absolute inset-8 rounded-full bg-sky-400/10 animate-[pulse-ring_4s_ease-out_1.5s_infinite]" />
        </div>
      </div>

      {/* Floating file-type chips */}
      {fileIcons.slice(0, chipPositions.length).map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute z-20 rounded-xl border border-white/10 bg-slate-900/80 p-1.5 shadow-xl shadow-black/40 backdrop-blur animate-[float-chip_7s_ease-in-out_infinite]"
          style={{
            ...chipPositions[index],
            width: chipPositions[index].size,
            animationDelay: chipPositions[index].delay,
          }}
        />
      ))}

      {/* Mock room window */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-white/15 bg-[#0d1524]/95 shadow-2xl shadow-sky-950/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="flex-1 truncate rounded-md border border-white/10 bg-black/20 px-3 py-1 text-center font-mono text-[11px] text-slate-400">
            zdrop.app/r/a8f3c2
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-[soft-blink_2s_ease-in-out_infinite]" />
            LIVE
          </span>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">design-assets.zip</p>
              <p className="font-mono text-[11px] text-slate-500">248 MB · from Alex</p>
            </div>
            <div className="flex -space-x-2">
              {['from-sky-400 to-blue-600', 'from-violet-400 to-fuchsia-600', 'from-emerald-400 to-teal-600'].map((gradient) => (
                <span className={`h-7 w-7 rounded-full border-2 border-[#0d1524] bg-linear-to-br ${gradient}`} key={gradient} />
              ))}
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0d1524] bg-slate-700 text-[10px] font-semibold text-slate-200">+3</span>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex justify-between text-[11px] text-slate-400">
              <span>Sending directly to 4 peers</span>
              <span className="text-sky-300">72%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="relative h-full w-[72%] overflow-hidden rounded-full bg-linear-to-r from-sky-500 to-cyan-300">
                <span className="absolute inset-y-0 w-1/3 bg-white/30 blur-sm animate-[progress-sweep_2.6s_linear_infinite]" />
              </div>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-white/10 pt-4">
            <div className="flex items-end gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-blue-600 text-[10px] font-bold text-white">A</span>
              <div className="rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-xs text-slate-200">
                Sending the final batch now 🚀
              </div>
            </div>
            <div className="flex flex-row-reverse items-end gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-400 to-fuchsia-600 text-[10px] font-bold text-white">Y</span>
              <div className="rounded-2xl rounded-br-sm bg-sky-500/90 px-3 py-2 text-xs text-white">
                Got it, thanks!
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-sky-400/30 bg-sky-400/5 px-3 py-3 text-xs text-sky-300/90">
            <IoFileTrayStacked size={15} /> Drop files here to send
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ end, label, suffix = '' }) {
  return (
    <div className="text-center">
      <p className="bg-linear-to-r from-white to-slate-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
        <CountUp start={0} end={end} duration={2.4} separator="," />
        {suffix}
      </p>
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  const { handleShow } = useGlobalModal();
  const { user_id, users, analytics } = usePresence();

  const createPublicRoom = async () => {
    try {
      const data = await createRoom({
        name: '',
        password: '',
        owner_id: user_id,
      });
      navigate(`/r/${data.room_id}?private=0`);
    } catch (error) {
      console.log(error);
    }
  };

  const showPrivateRoomModal = () => handleShow(MODAL_TYPES.CREATE_PRIVATE_ROOM);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a12] text-slate-100 selection:bg-sky-400/30">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="grid-bg absolute inset-0" />
        <div className="glow-orb absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-600/20" />
        <div className="glow-orb absolute right-0 top-1/3 h-80 w-80 rounded-full bg-violet-700/20" />
        <div className="glow-orb absolute bottom-0 left-0 h-80 w-80 rounded-full bg-cyan-700/10" />
      </div>

      <Navbar onCreateRoom={createPublicRoom} />

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-20 pt-16 sm:pt-24 lg:grid-cols-2 lg:gap-4 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="animate-[rise-in_0.6s_ease-out_both] text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3.5 py-1.5 text-xs font-medium text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_2px_rgba(56,189,248,0.6)]" />
              Peer-to-peer · No server storage
            </span>

            <h1 className="mt-7 text-[2.6rem] font-bold leading-[1.07] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
              Send files at the
              <br />
              <span className="bg-linear-to-r from-sky-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                speed of thought.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400 lg:mx-0">
              zDrop turns any browser into a secure file-sharing room. No uploads to a server,
              no account, no limits — just direct transfers and a chat that keeps everyone in sync.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={createPublicRoom}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-sky-500 to-cyan-400 px-6 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40 hover:brightness-110 sm:w-auto"
              >
                <IoFlash size={18} /> Start a room
                <IoArrowForward size={17} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={showPrivateRoomModal}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-slate-200 backdrop-blur transition hover:border-white/30 hover:bg-white/10 sm:w-auto"
              >
                <IoDocumentLock size={18} /> Create private room
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-400 lg:justify-start">
              {[
                [IoCheckmark, 'No sign-up'],
                [IoCheckmark, 'No file limits'],
                [IoCheckmark, 'Browser-based'],
              ].map(([Icon, label]) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Icon size={15} className="text-emerald-400" /> {label}
                </span>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-center gap-3 lg:justify-start">
              <div className="flex -space-x-2">
                {['from-sky-400 to-blue-600', 'from-violet-400 to-fuchsia-600', 'from-emerald-400 to-teal-600'].map((gradient) => (
                  <span className={`h-8 w-8 rounded-full border-2 border-[#060a12] bg-linear-to-br ${gradient}`} key={gradient} />
                ))}
              </div>
              <p className="text-sm text-slate-400">
                <span className="font-semibold text-white">{users.length}</span> people online right now
              </p>
            </div>
          </div>

          <RoomPreview />
        </section>

        {/* Live stats */}
        <section id="stats" className="border-y border-white/10 bg-white/[0.02] py-12 backdrop-blur-sm">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-5 sm:grid-cols-3 lg:px-8">
            <Stat end={analytics.files} label="Files shared" />
            <Stat end={analytics.users} label="People joined" />
            <Stat end={users.length} label="Online now" />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">How it works</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Three steps. Zero friction.
            </h2>
            <p className="mt-4 text-slate-400">
              From empty link to shared files in less time than it takes to upload a single photo.
            </p>
          </div>

          <div className="relative mt-14 grid gap-5 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-9 hidden h-px bg-linear-to-r from-sky-500/50 via-violet-500/50 to-sky-500/50 md:block" />
            {steps.map(({ number, icon: Icon, title, description }) => (
              <div
                key={number}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-sky-400/30 hover:bg-white/[0.06]"
              >
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-sky-400/20 bg-[#0c1524] text-sky-300 shadow-lg shadow-sky-950/40">
                  <Icon size={22} />
                </div>
                <span className="mt-5 block font-mono text-xs tracking-widest text-slate-600">{number}</span>
                <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative border-y border-white/10 bg-white/[0.015] py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">Why zDrop</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything you need. Nothing you don't.
              </h2>
              <p className="mt-4 text-slate-400">
                Built for the moment you just need to get a file to someone — securely, instantly, and without a middleman.
              </p>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description, accent }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-white/10 bg-[#0b1220]/80 p-6 transition hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/30"
                >
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${accent} ring-1 ring-white/10`}>
                    <Icon size={21} />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-sky-400/20 bg-linear-to-br from-sky-500/15 via-violet-500/10 to-transparent px-6 py-14 text-center sm:px-12">
            <div className="glow-orb absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 bg-sky-500/30" />
            <div className="relative">
              <IoSparkles className="mx-auto text-sky-300" size={28} />
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Your next file is one click away.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Open a room, share the link, and let the transfer begin. No waiting for an upload — ever.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={createPublicRoom}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-sky-500 to-cyan-400 px-6 py-3.5 font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:brightness-110 sm:w-auto"
                >
                  <IoFlash size={18} /> Get started free
                  <IoArrowForward size={17} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={showPrivateRoomModal}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  <IoShieldCheckmark size={18} /> Make it private
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <Logo compact />
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <span className="hidden sm:block">Fast, private file sharing.</span>
          </div>
          <p className="flex items-center gap-1.5">
            Made with <IoHeart color="#f43f5e" size={14} aria-label="love" /> by{' '}
            <a
              className="font-medium text-slate-300 underline-offset-4 transition hover:text-white hover:underline"
              target="_blank"
              rel="noopener"
              href="https://github.com/carlmagumpara"
            >
              carlmagumpara
            </a>
          </p>
          <span className="flex items-center gap-1.5 text-xs">
            <IoServer size={14} /> No files stored on our servers
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
