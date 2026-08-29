import './ScanFrame.css';

export default function ScanFrame({ children, scanning = false, label }) {
  return (
    <div className="scan-frame">
      <div className="scan-frame__corner scan-frame__corner--tl" />
      <div className="scan-frame__corner scan-frame__corner--tr" />
      <div className="scan-frame__corner scan-frame__corner--bl" />
      <div className="scan-frame__corner scan-frame__corner--br" />

      <div className="scan-frame__content">{children}</div>

      {scanning && (
        <>
          <div className="scan-frame__line" />
          <div className="scan-frame__glow" />
        </>
      )}

      {label && <div className="scan-frame__label mono">{label}</div>}
    </div>
  );
}