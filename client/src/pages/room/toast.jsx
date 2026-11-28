import { useState } from 'react';
import { LuExpand, LuShrink } from 'react-icons/lu';
import { Button } from '@/ui';

function CustomToast({ children, visibility = false, title = '' }) {
  const [show, setShow] = useState(visibility);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-[#0d1524]/90 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-200 ${show ? '' : 'w-[200px]'}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400 shadow-[0_0_8px_2px_rgba(56,189,248,0.5)]" />
          <strong className="truncate text-xs font-semibold text-slate-200">{title}</strong>
        </div>
        <Button
          variant="light"
          size="sm"
          className="h-7 w-7 shrink-0 rounded-lg border-0 bg-white/5 p-0"
          onClick={() => setShow(!show)}
          aria-label={show ? 'Collapse transfers' : 'Expand transfers'}
          title={show ? 'Collapse' : 'Expand'}
        >
          {show ? <LuShrink size={14} /> : <LuExpand size={14} />}
        </Button>
      </div>
      {show ? <div className="max-h-64 overflow-y-auto">{children(show)}</div> : null}
    </div>
  );
}

export default CustomToast;
