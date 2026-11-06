import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

/** Keeps catalog cards usable if a remote or local catalog image is unavailable. */
export default function CatalogImage({ src, alt, className = '', ...imageProps }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt || 'Service'} image unavailable`}
        className={`flex items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 ${className}`}
      >
        <ImageIcon aria-hidden="true" size={32} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      {...imageProps}
      src={src}
      alt={alt || ''}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
