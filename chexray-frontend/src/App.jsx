import { useState } from 'react';
import './App.css';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';

export default function App() {
  const [view, setView] = useState('welcome');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <button className="app-brand" onClick={() => setView('welcome')} aria-label="CXR 14 overview">
            <span className="app-brand__mark" />
            <span className="app-brand__word">CXR / 14<small>CHEST IMAGING READER</small></span>
          </button>
          <nav className="app-nav" aria-label="Main navigation">
            <button className={`app-nav__item ${view === 'welcome' ? 'is-active' : ''}`} aria-current={view === 'welcome' ? 'page' : undefined} onClick={() => setView('welcome')}>Overview</button>
            <button className={`app-nav__item ${view === 'dashboard' ? 'is-active' : ''}`} aria-current={view === 'dashboard' ? 'page' : undefined} onClick={() => setView('dashboard')}>X-ray reader</button>
            <button className={`app-nav__item ${view === 'doctors' ? 'is-active' : ''}`} aria-current={view === 'doctors' ? 'page' : undefined} onClick={() => setView('doctors')}>Specialists</button>
          </nav>
          <span className="app-header__note">CXR / 14</span>
        </div>
      </header>

      <main>
        <div hidden={view !== 'welcome'}><Welcome onEnter={() => setView('dashboard')} /></div>
        <div hidden={view !== 'doctors'}><Doctors /></div>
        <div hidden={view !== 'dashboard'}><Dashboard /></div>
      </main>

      <footer className="app-footer">
        <span className="app-footer__brand">CXR / 14</span>
        <span>Model output is a prediction, not a confirmed diagnosis.</span>
      </footer>
    </div>
  );
}