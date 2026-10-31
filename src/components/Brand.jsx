// DES·AI·N·AR wordmark: "AI" and "AR" are highlighted by colour only.
export default function Brand({ accent = 'text-primary', className = 'text-ink' }) {
  return (
    <span className={`font-extrabold tracking-wide ${className}`}>
      DES<span className={accent}>AI</span>N<span className={accent}>AR</span>
    </span>
  );
}
