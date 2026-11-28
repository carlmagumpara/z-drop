import { forwardRef, useEffect } from 'react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const BUTTON_VARIANTS = {
  primary:
    'bg-linear-to-r from-sky-500 to-cyan-400 text-slate-950 shadow-lg shadow-sky-500/20 hover:brightness-110 hover:shadow-sky-500/30',
  light:
    'border border-white/10 bg-white/5 text-slate-200 backdrop-blur hover:border-white/20 hover:bg-white/10',
  link: 'bg-transparent text-sky-400 hover:text-sky-300',
  danger:
    'bg-linear-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/20 hover:brightness-110',
  'outline-secondary':
    'border border-white/15 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/10',
};

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060a12] disabled:cursor-not-allowed disabled:opacity-60',
        BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary,
        BUTTON_SIZES[size] ?? BUTTON_SIZES.md,
        className,
      )}
      {...props}
    />
  );
}

export function Image({ className = '', ...props }) {
  return <img className={cx('block max-w-full', className)} {...props} />;
}

export function Container({ fluid = false, className = '', children, ...props }) {
  return (
    <div
      className={cx('mx-auto w-full px-3', fluid ? 'max-w-none' : 'max-w-7xl', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function FormRoot({ className = '', ...props }) {
  return <form className={className} {...props} />;
}

const FormGroup = ({ className = '', ...props }) => (
  <div className={cx('mb-4', className)} {...props} />
);

const FormLabel = ({ className = '', ...props }) => (
  <label
    className={cx('mb-2 block text-sm font-medium text-slate-300', className)}
    {...props}
  />
);

const FormControl = forwardRef(function FormControl({ className, ...props }, ref) {
  const classes = typeof className === 'string' ? className.split(/\s+/).filter(Boolean) : [];
  const invalid = classes.includes('is-invalid');

  return (
    <input
      ref={ref}
      className={cx(
        'block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60',
        invalid && 'border-rose-400/70 focus:border-rose-400/70 focus:ring-rose-400/20',
        classes.filter((name) => name !== 'is-invalid'),
      )}
      {...props}
    />
  );
});

const FormFeedback = ({ children, className = '' }) => (
  <p className={cx('mt-1.5 text-xs text-rose-400', className)} role="alert">{children}</p>
);
FormControl.Feedback = FormFeedback;

const FormCheck = ({ type = 'checkbox', label, checked, onChange, className = '', ...props }) => {
  if (type !== 'switch') {
    return (
      <input
        type={type}
        checked={checked}
        onChange={onChange}
        className={cx('h-4 w-4 accent-sky-500', className)}
        {...props}
      />
    );
  }

  return (
    <label className={cx('inline-flex cursor-pointer items-center gap-3', className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        {...props}
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full border border-white/10 bg-white/10 transition peer-checked:border-sky-400/50 peer-checked:bg-sky-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-slate-200 after:shadow transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-white" />
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
};

export const Form = FormRoot;
Form.Group = FormGroup;
Form.Label = FormLabel;
Form.Control = FormControl;
Form.Check = FormCheck;

export function InputGroup({ className = '', ...props }) {
  return (
    <div
      className={cx(
        'flex w-full items-stretch overflow-hidden rounded-xl border border-white/10 bg-white/5 transition focus-within:border-sky-400/50 focus-within:ring-2 focus-within:ring-sky-400/15',
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ bg = 'primary', className = '', children, ...props }) {
  const color =
    bg === 'danger'
      ? 'bg-rose-500 text-white'
      : bg === 'primary'
        ? 'bg-sky-500 text-slate-950'
        : 'bg-white/10 text-slate-300 ring-1 ring-white/15';

  return (
    <span
      className={cx(
        'inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold',
        color,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Modal({ show, children, className = '', centered = false, onHide }) {
  useEffect(() => {
    if (!show) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onHide?.();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div
      className={cx(
        'fixed inset-0 z-[1055] flex justify-center overflow-y-auto bg-[#02050b]/80 p-4 backdrop-blur-sm sm:p-6',
        centered ? 'items-center' : 'items-start',
      )}
      role="dialog"
      aria-modal="true"
      onClick={onHide}
    >
      <div
        className={cx(
          'animate-[fade-scale-in_0.25s_ease-out_both] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0d1524] shadow-2xl shadow-black/60 ring-1 ring-white/5',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

Modal.Header = function ModalHeader({ children, closeButton = false, onHide, className = '' }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5', className)}>
      <div className="min-w-0 flex-1">{children}</div>
      {closeButton ? (
        <button
          type="button"
          aria-label="Close"
          onClick={onHide}
          className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          &times;
        </button>
      ) : null}
    </div>
  );
};

Modal.Title = function ModalTitle({ children, className = '', ...props }) {
  return (
    <h2 className={cx('text-lg font-semibold tracking-tight text-white', className)} {...props}>
      {children}
    </h2>
  );
};

Modal.Body = function ModalBody({ children, className = '' }) {
  return <div className={cx('px-6 py-5 text-slate-300', className)}>{children}</div>;
};

Modal.Footer = function ModalFooter({ children, className = '' }) {
  return (
    <div className={cx('flex flex-wrap items-center justify-end gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4', className)}>
      {children}
    </div>
  );
};
