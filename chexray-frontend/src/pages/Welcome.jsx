import './Welcome.css';
import ScanFrame from '../components/ScanFrame';
import ChestSilhouette from '../components/ChestSilhouette';
import SprocketStrip from '../components/SprocketStrip';

export default function Welcome({ onEnter }) {
  return (
    <div className="welcome">
      <section className="welcome__hero">
        <div className="welcome__copy">
          <span className="welcome__eyebrow mono">CHEST X-RAY · 14 INDEPENDENT ESTIMATES</span>
          <h1 className="welcome__headline">
            One scan.
            <br />
            A broader view.
          </h1>
          <p className="welcome__sub">
            Explore model estimates for fourteen chest X-ray findings side by side. Review the strongest signals, then take the results to a qualified clinician.
          </p>
          <button className="welcome__cta" onClick={onEnter}>
            Start a scan
            <span className="welcome__cta-arrow">→</span>
          </button>
        </div>

        <ScanFrame scanning label="Awaiting input">
          <ChestSilhouette />
        </ScanFrame>
      </section>

      <SprocketStrip />

      <section className="welcome__how">
        <div className="welcome__how-heading">
          <span className="mono">HOW IT WORKS</span>
          <h2>From image to review</h2>
        </div>
        <div className="welcome__how-item">
          <span className="welcome__how-index mono">01</span>
          <h3>Upload a film</h3>
          <p>A frontal chest X-ray, PA or AP. JPEG or PNG.</p>
        </div>
        <div className="welcome__how-item">
          <span className="welcome__how-index mono">02</span>
          <h3>Model scores each finding</h3>
          <p>A DenseNet121 backbone estimates a probability for each of fourteen conditions independently.</p>
        </div>
        <div className="welcome__how-item">
          <span className="welcome__how-index mono">03</span>
          <h3>Read the ranked output</h3>
          <p>Results are ordered by likelihood, with the strongest signal called out first.</p>
        </div>
      </section>
    </div>
  );
}