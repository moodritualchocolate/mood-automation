'use client';

import * as React from 'react';

interface FieldProps {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, helper, error, required, children }: FieldProps) {
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)] font-medium">
          {label}{required ? <span className="text-[#FF4D2D] ml-1">*</span> : null}
        </span>
        {helper ? <span className="text-[11px] text-[rgba(247,245,242,0.40)]">{helper}</span> : null}
      </div>
      {children}
      {error ? <div className="mt-2 text-[12px] text-[#FF4D2D]">{error}</div> : null}
    </label>
  );
}

const inputBase =
  'w-full bg-transparent border border-[rgba(247,245,242,0.18)] rounded-lg px-3 py-2.5 text-[14px] text-[#F7F5F2] placeholder-[rgba(247,245,242,0.30)] outline-none transition-colors duration-150 focus:border-[#F7F5F2] min-h-[44px]';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return <input ref={ref} className={[inputBase, className].join(' ')} {...rest} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', rows = 4, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={[inputBase, 'min-h-[88px] resize-y leading-relaxed', className].join(' ')}
        {...rest}
      />
    );
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={[inputBase, 'pr-9 appearance-none bg-[#0A0A0A] cursor-pointer', className].join(' ')}
        {...rest}
      >
        {children}
      </select>
    );
  },
);
