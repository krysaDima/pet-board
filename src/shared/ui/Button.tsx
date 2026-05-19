import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'sage';
};

export function Button({ children, variant = 'primary', className = '', ...rest }: Props) {
  const base =
    'inline-flex min-h-[44px] min-w-[2.75rem] touch-manipulation items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 sm:min-h-0 sm:min-w-0 sm:py-2.5';

  const variantStyles: Record<NonNullable<Props['variant']>, string> = {
    primary: 'bg-sage-600 text-white shadow-md shadow-sage-900/15 hover:bg-sage-700 focus-visible:outline-sage-600',
    sage: 'bg-sage-600 text-white shadow-md shadow-sage-900/15 hover:bg-sage-700 focus-visible:outline-sage-600',
    secondary: 'bg-cream-200 text-warm-800 hover:bg-cream-100 focus-visible:outline-sage-400',
    ghost: 'bg-transparent text-warm-800 hover:bg-cream-50 focus-visible:outline-sage-400',
    outline:
      'border-2 border-sage-300 bg-white text-sage-800 hover:bg-sage-50 hover:border-sage-400 focus-visible:outline-sage-500',
  };

  return (
    <button type="button" className={`${base} ${variantStyles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
