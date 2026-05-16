import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
};

export function Button({ children, variant = 'primary', className = '', ...rest }: Props) {
  const base =
    'inline-flex min-h-[44px] min-w-[2.75rem] touch-manipulation items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 sm:min-h-0 sm:min-w-0 sm:py-2';

  const variantStyles: Record<NonNullable<Props['variant']>, string> = {
    primary: 'bg-amber-600 text-white hover:bg-amber-700 focus-visible:outline-amber-600',
    secondary: 'bg-stone-200 text-stone-900 hover:bg-stone-300 focus-visible:outline-stone-400',
    ghost: 'bg-transparent text-stone-800 hover:bg-stone-100 focus-visible:outline-stone-400',
    outline:
      'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-400 focus-visible:outline-stone-400',
  };

  return (
    <button type="button" className={`${base} ${variantStyles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
