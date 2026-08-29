import { useState } from 'react';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [view, setView] = useState('welcome'); 

  return view === 'welcome' ? (
    <Welcome onEnter={() => setView('dashboard')} />
  ) : (
    <Dashboard onHome={() => setView('welcome')} />
  );
}