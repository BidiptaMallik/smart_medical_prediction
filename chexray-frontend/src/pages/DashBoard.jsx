import { useCallback, useRef, useState } from 'react';
import './Dashboard.css';
import './Dashboard.extra.css';
import ScanFrame from '../components/ScanFrame';
import PredictionBar from '../components/PredictionBar';
import ConsultPanel from '../components/ConsultPanel';
import ChatWidget from '../components/ChatWidget';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Dashboard() {
  const [imageUrl, setImageUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const runPrediction = useCallback(async (file) => {
    setErrorMsg('');
    setResult(null);
    setImageUrl(URL.createObjectURL(file));
    setUploadedFile(file);
    setStatus('scanning');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/predict`, { method: 'POST', body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }

      setResult(await res.json());
      setStatus('done');
    } catch (err) {
      setErrorMsg(
        err.message === 'Failed to fetch'
          ? `Could not reach the API at ${API_URL}. Is the backend running?`
          : err.message
      );
      setStatus('error');
    }
  }, []);

  const handleFile = (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('That file is not an image.');
      setStatus('error');
      return;
    }
    runPrediction(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files);
  };

  const reset = () => {
    setImageUrl(null);
    setUploadedFile(null);
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
  };

  return (
    <div className="dash">
      <div className="dash__toolbar">
        <span className="dash__eyebrow mono">IMAGING READER</span>
        <span className="dash__status mono">{statusLabel(status)}</span>
      </div>

      <div className="dash__grid">
        <div className="dash__viewer-col">
          <div
            className={`dash__dropzone ${dragActive ? 'dash__dropzone--active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            <ScanFrame scanning={status === 'scanning'} label={frameLabel(status)}>
              {imageUrl ? (
                <img src={imageUrl} alt="Uploaded chest X-ray" className="dash__image" />
              ) : (
                <div className="dash__placeholder">
                  <p className="mono">Drop a chest X-ray here</p>
                  <p className="dash__placeholder-sub">or</p>
                  <button className="dash__browse" onClick={() => inputRef.current?.click()}>
                    Browse file
                  </button>
                </div>
              )}
            </ScanFrame>
          </div>

          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files)} />

          {imageUrl && (
            <button className="dash__reset mono" onClick={reset}>↺ New scan</button>
          )}

          {errorMsg && <p className="dash__error">{errorMsg}</p>}
        </div>

        <div className="dash__results-col">
          <h2 className="dash__results-title">Findings</h2>

          {status === 'idle' && (
            <p className="dash__empty">Results will appear here once a scan is uploaded.</p>
          )}

          {status === 'scanning' && (
            <p className="dash__empty">Running the fourteen-way comparison…</p>
          )}

          {status === 'done' && result && (
            <>
              <div className="dash__top-finding">
                <span className="dash__top-finding-eyebrow mono">Strongest signal</span>
                <span className="dash__top-finding-name">{result.top_finding}</span>
              </div>
              <div className="dash__bars">
                {result.predictions.map((p, i) => (
                  <PredictionBar key={p.pathology} pathology={p.pathology} probability={p.probability} rank={i} delay={i * 45} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {status === 'done' && result && (
        <ConsultPanel key={result.top_finding + result.predictions[0].probability} predictions={result.predictions} imageFile={uploadedFile} />
      )}
      <ChatWidget predictions={result?.predictions ?? null} />
    </div>
  );
}

function statusLabel(status) {
  switch (status) {
    case 'scanning': return 'ANALYZING';
    case 'done': return 'COMPLETE';
    case 'error': return 'ERROR';
    default: return 'READY';
  }
}

function frameLabel(status) {
  switch (status) {
    case 'scanning': return 'Scanning…';
    case 'done': return 'Scan complete';
    default: return 'Awaiting input';
  }
}