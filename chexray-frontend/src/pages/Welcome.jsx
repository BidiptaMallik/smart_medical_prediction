import './Welcome.css';
import ScanFrame from '../components/ScanFrame';
import ChestSilhouette from '../components/ChestSilhouette';
import SprocketStrip from '../components/SprocketStrip';

export default function Welcome({ onEnter }) {
  return (
    <div className="welcome">
      <header className="welcome__nav">
        <div className="welcome__brand mono">
          <span className="welcome__brand-mark" />
          CXR&nbsp;/&nbsp;14
        </div>
        <span className="welcome__nav-tag mono">RESEARCH PROTOTYPE</span>
      </header>

      <section className="welcome__hero">
        <div className="welcome__copy">
          <span className="welcome__eyebrow mono">CHEST X-RAY · MULTI-LABEL ESTIMATOR</span>
          <h1 className="welcome__headline">
            Fourteen findings,
            <br />
            read at once.
          </h1>
          <p className="welcome__sub">
            Upload a chest X-ray and the model scores the likelihood of fourteen
            common findings side by side — the way a differential reads a film,
            not a single verdict.
          </p>
          <button className="welcome__cta" onClick={onEnter}>
            Open the reader
            <span className="welcome__cta-arrow">→</span>
          </button>
          <p className="welcome__disclaimer">
            Trained on a small public sample. Estimates reflect pattern similarity
            to training images — not a diagnosis, and not reviewed by a radiologist.
          </p>
        </div>

        <ScanFrame scanning label="Awaiting input">
          <ChestSilhouette />
        </ScanFrame>
      </section>

      <SprocketStrip />

      <section className="welcome__how">
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