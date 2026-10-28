/** Pièce d'Écu dessinée aux couleurs du logo (or + ombre brique) */
export default function EcuIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="26" r="18" fill="#b4541a" />
      <circle cx="24" cy="22" r="18" fill="#ffb52e" />
      <circle cx="24" cy="22" r="12" fill="none" stroke="#b4541a" strokeWidth="3.5" />
    </svg>
  );
}
