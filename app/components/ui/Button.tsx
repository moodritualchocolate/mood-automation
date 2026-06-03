'use client';

import * as React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:   'bg-[#F7F5F2] text-[#0A0A0A] border-[#F7F5F2] hover:bg-[#EFEBE5]',
  secondary: 'bg-transparent text-[#F7F5F2] border-[rgba(247,245,242,0.18)] hover:border-[#F7F5F2]',
  ghost:     'bg-transparent text-[#EFEBE5] border-transparent hover:bg-[rgba(247,245,242,0.06)]',
  danger:    'bg-[#FF4D2D] text-[#F7F5F2] border-[#FF4D2D] hover:opacity-90',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1 text-[12px] min-h-[36px]',
  md: 'px-4 py-2 text-[14px] min-h-[44px]',
  lg: 'px-6 py-3 text-[16px] min-h-[52px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'secondary', size = 'md', block, disabled, className = '', children, ...rest }, ref) {
    const disabledClass = disabled
      ? 'bg-[#1A1A1A] text-[rgba(247,245,242,0.40)] border-[rgba(247,245,242,0.12)] cursor-not-allowed hover:bg-[#1A1A1A]'
      : variantClass[variant];
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-lg border transition-colors duration-150 font-medium tracking-tight',
          sizeClass[size],
          disabledClass,
          block ? 'w-full' : '',
          className,
        ].join(' ')}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
