'use client';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function ProductThumb({ src, alt, className = '' }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = '/foodin.png';
      }}
    />
  );
}
