import { useEffect, useMemo, useRef, useState } from 'react';
import './ConsultPanel.css';
import { recommendDoctors, getSlots, bookConsult } from '../api';
import { pretty } from '../pathologies';

const EMPTY = { name: '', age: '', sex: 'unspecified', email: '', phone: '', symptoms: '' };
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const DELIVERY = {
  sent: 'Emailed',
  saved_to_outbox: 'Saved to the local outbox (email is not configured)',
  smtp_failed_saved_to_outbox: 'Email failed, saved to the local outbox',
};

const fmtSlot = (iso) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtDay = (d) => new Date(`${d}T00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export default function ConsultPanel({ predictions, imageFile }) {
  const [recs, setRecs] = useState(null);
  const [recError, setRecError] = useState('');
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('doctor');
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [shareImage, setShareImage] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const latestDoctor = useRef(null);

  useEffect(() => {
    let cancelled = false;
    recommendDoctors(predictions)
      .then((r) => !cancelled && setRecs(r))
      .catch((e) => !cancelled && setRecError(e.message));
    return () => { cancelled = true; };
  }, [predictions]);

  const selectDoctor = (d) => {
    latestDoctor.current = d.id;
    setDoctor(d); setSlot(''); setSlots([]); setSlotsLoading(true); setError('');
    getSlots(d.id)
      .then((res) => {
        if (latestDoctor.current !== d.id) return;
        setSlots(res.slots);
        setSlot(res.slots[0] || '');
      })
      .catch((e) => latestDoctor.current === d.id && setError(e.message))
      .finally(() => latestDoctor.current === d.id && setSlotsLoading(false));
  };

  const openPanel = () => {
    setOpen(true);
    if (recs && !doctor && recs.doctors.length) selectDoctor(recs.doctors[0]);
  };

  const byDay = useMemo(() => {
    const m = {};
    slots.forEach((s) => { const [d, t] = s.split('T'); (m[d] ||= []).push(t); });
    return m;
  }, [slots]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const age = Number(form.age);
    if (!form.name.trim()) return setError('Please enter your name.');
    if (form.age === '' || !(age >= 0 && age <= 120)) return setError('Please enter a valid age.');
    if (!EMAIL_RE.test(form.email)) return setError('Please enter a valid email address.');
    if (!consent) return setError('Please tick the consent box to continue.');

    setBusy(true); setError('');
    try {
      const res = await bookConsult({
        payload: { patient: { ...form, age }, consent, doctor_id: doctor.id, slot_start: slot, predictions },
        image: shareImage ? imageFile : null,
      });
      setConfirmation(res); setStep('done');
    } catch (e) {
      setError(e.message);
      if (/slot/i.test(e.message)) { selectDoctor(doctor); setStep('doctor'); }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="consult">
      {recs?.urgent && <p className="consult__urgent">{recs.urgent_message}</p>}

      {!open && step !== 'done' && (
        <div className="consult__intro">
          <div>
            <h3>Want a doctor to look at this?</h3>
            <p>We can match you with a specialist, write a referral summary of these findings, send it to them and book the earliest slot, after you confirm.</p>
          </div>
          <button className="consult__primary" onClick={openPanel} disabled={!recs}>
            {recError ? 'Unavailable' : recs ? 'Consult a doctor' : 'Loading…'}
          </button>
        </div>
      )}
      {recError && <p className="consult__error">{recError}</p>}

      {open && step !== 'done' && (
        <div className="consult__panel">
          <ol className="consult__steps mono">
            <li className={step === 'doctor' ? 'is-active' : ''}>1 Doctor &amp; time</li>
            <li className={step === 'details' ? 'is-active' : ''}>2 Your details</li>
            <li>3 Confirmation</li>
          </ol>

          {step === 'doctor' && recs && (
            <>
              {recs.note && <p className="consult__note">{recs.note}</p>}
              <div className="consult__doctors">
                {recs.doctors.map((d) => (
                  <button key={d.id} className={`doc-card ${doctor?.id === d.id ? 'is-selected' : ''}`} onClick={() => selectDoctor(d)}>
                    <span className="doc-card__name">{d.name}</span>
                    <span className="doc-card__spec mono">{d.specialty}</span>
                    <span className="doc-card__meta">{d.hospital} · {d.experience_years} yrs</span>
                    {d.matched.length > 0 && (
                      <span className="doc-card__why">
                        Matches: {d.matched.map((m) => `${pretty(m.pathology)} ${Math.round(m.probability * 100)}%`).join(', ')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="consult__sample">Doctors shown are fictional sample profiles for this demo.</p>

              {doctor && (
                <div className="consult__slots">
                  <h4 className="mono">Available times</h4>
                  {slotsLoading && <p className="consult__note">Loading times…</p>}
                  {!slotsLoading && slots.length === 0 && <p className="consult__note">No open times in the next week.</p>}
                  {Object.entries(byDay).map(([day, times]) => (
                    <div className="slot-row" key={day}>
                      <span className="slot-row__day">{fmtDay(day)}</span>
                      <div className="slot-row__times">
                        {times.map((t) => (
                          <button key={t} className={`slot-btn mono ${slot === `${day}T${t}` ? 'is-selected' : ''}`} onClick={() => setSlot(`${day}T${t}`)}>{t}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {error && <p className="consult__error">{error}</p>}
              <div className="consult__actions">
                <button className="consult__ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button className="consult__primary" disabled={!slot} onClick={() => { setError(''); setStep('details'); }}>Continue</button>
              </div>
            </>
          )}

          {step === 'details' && (
            <>
              <p className="consult__summary">{doctor.name} · {fmtSlot(slot)}</p>
              <div className="consult__form">
                <label>Full name<input value={form.name} onChange={set('name')} maxLength={100} /></label>
                <label>Age<input type="number" min="0" max="120" value={form.age} onChange={set('age')} /></label>
                <label>Sex
                  <select value={form.sex} onChange={set('sex')}>
                    <option value="unspecified">Prefer not to say</option><option value="female">Female</option>
                    <option value="male">Male</option><option value="other">Other</option>
                  </select>
                </label>
                <label>Email<input type="email" value={form.email} onChange={set('email')} maxLength={200} /></label>
                <label>Phone (optional)<input value={form.phone} onChange={set('phone')} maxLength={30} /></label>
                <label className="consult__wide">Symptoms or notes for the doctor (optional)
                  <textarea rows={3} value={form.symptoms} onChange={set('symptoms')} maxLength={1000} />
                </label>
              </div>
              <label className="consult__check">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>I agree to share my name, contact details, notes and the model's findings with {doctor.name} so they can prepare for my appointment.</span>
              </label>
              {imageFile && (
                <label className="consult__check">
                  <input type="checkbox" checked={shareImage} onChange={(e) => setShareImage(e.target.checked)} />
                  <span>Also attach my X-ray image.</span>
                </label>
              )}
              {error && <p className="consult__error">{error}</p>}
              <div className="consult__actions">
                <button className="consult__ghost" onClick={() => setStep('doctor')}>Back</button>
                <button className="consult__primary" disabled={busy} onClick={submit}>{busy ? 'Writing report & booking…' : 'Book & send report'}</button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'done' && confirmation && (
        <div className="consult__panel">
          <h3 className="consult__done-title">Booked with {confirmation.doctor.name}</h3>
          <p className="consult__summary">{fmtSlot(confirmation.slot_start)} · {confirmation.doctor.hospital}</p>
          <ul className="consult__delivery mono">
            <li>Doctor: {DELIVERY[confirmation.delivery.doctor] || confirmation.delivery.doctor}</li>
            <li>You: {DELIVERY[confirmation.delivery.patient] || confirmation.delivery.patient}</li>
            <li>X-ray image: {confirmation.delivery.image_attached ? 'attached' : 'not attached'}</li>
            <li>Report: {confirmation.ai_generated ? 'written by AI' : 'template (AI writer not configured)'}</li>
          </ul>
          <h4 className="mono">Report that was sent</h4>
          <pre className="consult__report">{confirmation.report}</pre>
        </div>
      )}
    </section>
  );
}