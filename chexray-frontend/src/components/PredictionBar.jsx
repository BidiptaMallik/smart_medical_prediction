import './PredictionBar.css';

export default function PredictionBar({ pathology, probability, rank, delay }) {
  const pct = Math.round(probability * 100);
  const isTop = rank === 0;
  const isWeak = probability < 0.15;

  return (
    <div
      className={`pbar ${isTop ? 'pbar--top' : ''} ${isWeak ? 'pbar--weak' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pbar__label">
        <span className="pbar__rank mono">{String(rank + 1).padStart(2, '0')}</span>
        <span className="pbar__name">{pathology}</span>
      </div>
      <div className="pbar__track">
        <div
          className="pbar__fill"
          style={{ '--target-width': `${pct}%`, animationDelay: `${delay + 120}ms` }}
        />
      </div>
      <span className="pbar__value mono">{pct}%</span>
    </div>
  );
}