import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { SERVER_IP } from '../data/site';

interface CopyIpButtonProps {
  /** Texte affiché à la place de l'IP (ex. « Copier l'adresse ») */
  label?: string;
  className?: string;
}

export default function CopyIpButton({ label, className = '' }: CopyIpButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_IP);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // presse-papiers refusé : l'IP reste lisible sur le bouton
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-3d btn-or ${className}`}
    >
      {copied ? <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" /> : <Copy className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />}
      {!label && !copied && <span className="sr-only">Copier l'adresse </span>}
      <span aria-live="polite">{copied ? 'Adresse copiée !' : label ?? SERVER_IP}</span>
    </button>
  );
}
