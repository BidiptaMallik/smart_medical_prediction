export default function ChestSilhouette() {
  return (
    <svg viewBox="0 0 300 320" width="240" height="256" fill="none" aria-hidden="true">
      <ellipse cx="150" cy="55" rx="30" ry="26" stroke="var(--text-faint)" strokeWidth="1.4" opacity="0.6" />
      <path
        d="M110 90 C90 100 70 130 62 170 C55 205 60 250 75 285 C90 300 110 308 150 308 C190 308 210 300 225 285 C240 250 245 205 238 170 C230 130 210 100 190 90 Z"
        stroke="var(--text-faint)" strokeWidth="1.4" opacity="0.55"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={`l${i}`} d={`M105 ${115 + i * 26} Q80 ${125 + i * 26} 78 ${150 + i * 26}`}
          stroke="var(--cyan-dim)" strokeWidth="1.1" opacity="0.5" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={`r${i}`} d={`M195 ${115 + i * 26} Q220 ${125 + i * 26} 222 ${150 + i * 26}`}
          stroke="var(--cyan-dim)" strokeWidth="1.1" opacity="0.5" />
      ))}
      <line x1="150" y1="90" x2="150" y2="300" stroke="var(--text-faint)" strokeWidth="1.2" opacity="0.5" strokeDasharray="2 5" />
      <ellipse cx="140" cy="185" rx="34" ry="40" fill="var(--amber)" opacity="0.06" />
    </svg>
  );
}