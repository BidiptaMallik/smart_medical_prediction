import './SprocketStrip.css';
import { PATHOLOGIES } from '../pathologies';

export default function SprocketStrip() {
  const items = [...PATHOLOGIES, ...PATHOLOGIES];

  return (
    <div className="sprocket">
      <div className="sprocket__track">
        {items.map((p, i) => (
          <span className="sprocket__item mono" key={`${p}-${i}`}>
            <span className="sprocket__dot" />
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}