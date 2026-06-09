import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CharacterWizard } from './pages/CharacterWizard';
import { CharacterSheet } from './pages/CharacterSheet';
import { AdminPanel } from './pages/AdminPanel';
import { LoginPage } from './pages/LoginPage';
import { LobbiesPage } from './pages/LobbiesPage';
import { LobbyDetailPage } from './pages/LobbyDetailPage';
import { AccountSettings } from './pages/AccountSettings';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { useCharacterStore } from './store/characterStore';
import { useDataStore } from './store/dataStore';
import { useLobbyStore } from './store/lobbyStore';

function LoadingScreen() {
  return (
    <div
      className="min-h-screen theme-root flex items-center justify-center"
      style={{ background: 'var(--theme-bg)' }}
    >
      <div
        className="anim-spin text-5xl select-none"
        style={{ color: 'var(--theme-accent)', filter: 'drop-shadow(0 0 8px var(--theme-accent-glow))' }}
      >
        ✦
      </div>
    </div>
  );
}

function App() {
  const theme = useThemeStore(s => s.theme);
  const { user, isAdmin, loading: authLoading, init } = useAuthStore();
  const { loadFromFirestore: loadChars, clearStore: clearChars } = useCharacterStore();
  const { loadFromFirestore: loadData, loadBuiltinData, clearStore: clearData, builtinLoaded } = useDataStore();
  const { clearStore: clearLobbies } = useLobbyStore();
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBuiltinData().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setDataLoading(true);
      Promise.all([loadChars(user.uid), loadData(user.uid)])
        .catch(console.error)
        .finally(() => setDataLoading(false));
    } else {
      clearChars();
      clearData();
      clearLobbies();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, authLoading]);

  if (authLoading || dataLoading || !builtinLoaded) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"          element={user ? <Navigate to="/" replace />      : <LoginPage />} />
        <Route path="/"               element={user ? <HomePage />                     : <Navigate to="/login" replace />} />
        <Route path="/create"         element={user ? <CharacterWizard />              : <Navigate to="/login" replace />} />
        <Route path="/character/:id"  element={user ? <CharacterSheet />               : <Navigate to="/login" replace />} />
        <Route path="/admin"          element={user && isAdmin ? <AdminPanel /> : <Navigate to="/" replace />} />
        <Route path="/lobbies"        element={user ? <LobbiesPage />           : <Navigate to="/login" replace />} />
        <Route path="/lobbies/:id"    element={user ? <LobbyDetailPage />       : <Navigate to="/login" replace />} />
        <Route path="/settings/account" element={user ? <AccountSettings />    : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
