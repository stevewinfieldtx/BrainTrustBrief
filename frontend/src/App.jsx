import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import Assemble from './pages/Assemble';
import Arena from './pages/Arena';
import Tournament from './pages/Tournament';

export default function App() {
  // Global BrainTrust state — shared across all pages, persisted to localStorage
  const [selectedMembers, setSelectedMembers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('btb_members') || '[]'); } catch { return []; }
  });

  // Keep localStorage in sync whenever selectedMembers changes
  const setAndPersistMembers = (members) => {
    setSelectedMembers(members);
    try { localStorage.setItem('btb_members', JSON.stringify(members)); } catch { /* ignore */ }
  };

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            <Assemble
              selectedMembers={selectedMembers}
              setSelectedMembers={setAndPersistMembers}
            />
          }
        />
        <Route
          path="roster"
          element={
            <Roster
              selectedMembers={selectedMembers}
              setSelectedMembers={setAndPersistMembers}
            />
          }
        />
        <Route path="dashboard" element={<Dashboard />} />
        <Route
          path="arena"
          element={
            <Arena
              selectedMembers={selectedMembers}
            />
          }
        />
        <Route path="bracket" element={<Tournament />} />
      </Route>
    </Routes>
  );
}
