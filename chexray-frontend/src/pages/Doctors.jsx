import { useEffect, useMemo, useState } from 'react';
import './Doctors.css';
import { getDoctors, getSpecialties } from '../api';
import { pretty } from '../pathologies';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [map, setMap] = useState({});
  const [disease, setDisease] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getDoctors(), getSpecialties()])
      .then(([d, s]) => { setDoctors(d.doctors); setMap(s.specialty_by_disease); })
      .catch((e) => setError(e.message));
  }, []);

  const shown = useMemo(() => {
    if (!disease) return doctors;
    const specs = map[disease] || [];
    const rank = (d) => { const i = specs.indexOf(d.specialty); return i === -1 ? 99 : i; };
    return doctors.filter((d) => d.treats.includes(disease)).sort((a, b) => rank(a) - rank(b));
  }, [doctors, map, disease]);

  return (
    <div className="docs">
      <div className="docs__intro">
        <span className="docs__eyebrow mono">SAMPLE DIRECTORY</span>
        <h1 className="docs__title">Find a specialist</h1>
        <p className="docs__sub">Browse fictional demo profiles by the finding they typically follow up. These are sample providers, not real appointment availability.</p>
      </div>
      {error && <p className="docs__error">{error}</p>}

      <div className="docs__layout">
        <nav className="docs__diseases">
          <button className={`docs__disease ${!disease ? 'is-active' : ''}`} onClick={() => setDisease(null)}>All doctors</button>
          {Object.entries(map).map(([name, specs]) => (
            <button key={name} className={`docs__disease ${disease === name ? 'is-active' : ''}`} onClick={() => setDisease(name)}>
              <span>{pretty(name)}</span>
              <span className="docs__disease-spec mono">{specs[0]}</span>
            </button>
          ))}
        </nav>

        <div>
          {disease && <p className="docs__route mono">{pretty(disease)} → {(map[disease] || []).join(' · ')}</p>}
          <div className="docs__grid">
            {shown.map((d) => (
              <article className="docs__card" key={d.id}>
                <h3>{d.name}</h3>
                <span className="docs__spec mono">{d.specialty}</span>
                <p>{d.hospital}</p>
                <p className="docs__meta">{d.experience_years} years · {d.languages.join(', ')}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}