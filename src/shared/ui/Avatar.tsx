type Props = {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizes = { sm: 'h-10 w-10', md: 'h-14 w-14', lg: 'h-24 w-24' };

export function Avatar({ src, alt, size = 'md' }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${sizes[size]} shrink-0 rounded-2xl object-cover ring-2 ring-white shadow-md`}
      loading="lazy"
    />
  );
}
