import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: Props) {
  return (
    <div
      className={`rounded-2xl border border-stone-200/70 bg-white/95 p-5 shadow-md shadow-stone-300/40 ring-1 ring-stone-100/80 backdrop-blur-sm transition-shadow duration-300 ease-out hover:shadow-lg hover:shadow-stone-400/25 ${className}`}
    >
      {children}
    </div>
  );
}
