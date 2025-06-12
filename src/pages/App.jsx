import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { activeProfileAtom } from './store';
import ProfileSelector from './ProfileSelector';
import ProfileManager from './ProfileManager';
import Sidebar from './components/organisms/Sidebar/Sidebar';
import Collection from './pages/Collection/Collection';
import LocalCollection from './pages/LocalCollection/LocalCollection';
import Settings from './pages/Settings/Settings';
import OsuverseBackground from './components/organisms/OsuverseBackground/OsuverseBackground';
import './App.css';

function App() {
  const [activeProfile] = useAtom(activeProfileAtom);
  const [showProfileSelector, setShowProfileSelector] = React.useState(!activeProfile);
  const [showProfileManager, setShowProfileManager] = React.useState(false);

  if (showProfileSelector || !activeProfile) {
    return (
      <ProfileSelector
        onSelect={(profile) => {
          setShowProfileSelector(false);
        }}
        onManageProfiles={() => setShowProfileManager(true)}
      />
    );
  }

  if (showProfileManager) {
    return (
      <ProfileManager
        onClose={() => setShowProfileManager(false)}
      />
    );
  }

  return (
    <Router>
      <div className="app-container">
        <OsuverseBackground />
        <div className="app-layout">
          <Sidebar 
            onManageProfiles={() => setShowProfileManager(true)}
          />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Navigate to="/collection" replace />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/local" element={<LocalCollection />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
