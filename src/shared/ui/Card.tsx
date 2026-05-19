import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: Props) {
  return (
    <div
      className={`rounded-2xl border border-cream-200/80 bg-white/95 p-5 shadow-md shadow-sage-900/8 ring-1 ring-cream-100/90 backdrop-blur-sm transition-shadow duration-300 ease-out hover:shadow-lg hover:shadow-sage-900/12 ${className}`}
    >
      {children}
    </div>
  );
}
