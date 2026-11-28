import { IoDownloadOutline } from 'react-icons/io5';
import { saveAs } from 'file-saver';
import { FileIcon } from 'react-file-icon';
import mimeTypes from 'mime-types';
import { Button } from '@/ui';

function FileList({ files = [], download = false }) {
  if (!files.length) {
    return (
      <div className="px-4 py-7 text-center">
        <p className="m-0 text-xs text-slate-500">No files yet</p>
      </div>
    );
  }

  return (
    <div>
      {files.map((item) => {
        const done = item.percentage === 100;

        return (
          <div key={item.id ?? item.name} className="border-b border-white/5 px-3 py-3 last:border-0">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-1.5">
                  <FileIcon extension={mimeTypes.extension(item.type)} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-200" title={item.name}>
                    {item.name}
                  </p>
                  <p className={`text-[11px] ${item.failed ? 'text-rose-400' : 'text-slate-500'}`}>
                    {item.failed ? 'Transfer failed' : done ? 'Complete' : 'Transferring…'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className={`text-[11px] font-semibold ${item.failed ? 'text-rose-400' : done ? 'text-emerald-400' : 'text-sky-400'}`}>
                  {item.failed ? '—' : `${item.percentage}%`}
                </span>
                {done && download ? (
                  <Button
                    size="sm"
                    variant="light"
                    className="h-7 w-7 rounded-lg border-0 bg-white/5 p-0"
                    onClick={() => saveAs(item.url, item.name)}
                    title={`Download ${item.name}`}
                    aria-label={`Download ${item.name}`}
                  >
                    <IoDownloadOutline size={14} />
                  </Button>
                ) : null}
              </div>
            </div>

            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={item.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-200 ${done ? 'bg-linear-to-r from-emerald-500 to-teal-300' : 'bg-linear-to-r from-sky-500 to-cyan-300'}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FileList;
