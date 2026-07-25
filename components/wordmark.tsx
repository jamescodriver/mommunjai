// baby&mom+ wordmark (text-based, matches website CI: teal + pink).
// Placeholder until official vector logo is provided (see assets/README.md).
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display font-bold tracking-tight select-none ${className}`}
      aria-label="baby and mom plus"
    >
      <span className="text-teal">baby</span>
      <span className="text-ink/70">&amp;</span>
      <span className="text-rose">mom</span>
      <sup className="text-rose">+</sup>
    </span>
  );
}
