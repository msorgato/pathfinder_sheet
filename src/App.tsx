import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CharacterWizard } from './pages/CharacterWizard';
import { CharacterSheet } from './pages/CharacterSheet';
import { AdminPanel } from './pages/AdminPanel';
import { LoginPage } from './pages/LoginPage';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { useCharacterStore } from './store/characterStore';
import { useDataStore } from './store/dataStore';
import { isAdminEmail } from './config/admins';

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
  const { user, loading: authLoading, init } = useAuthStore();
  const { loadFromFirestore: loadChars, clearStore: clearChars } = useCharacterStore();
  const { loadFromFirestore: loadData, clearStore: clearData } = useDataStore();
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
    if (authLoading) return;
    if (user) {
      setDataLoading(true);
      Promise.all([loadChars(user.uid), loadData(user.uid)])
        .catch(console.error)
        .finally(() => setDataLoading(false));
    } else {
      clearChars();
      clearData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, authLoading]);

  if (authLoading || dataLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"          element={user ? <Navigate to="/" replace />      : <LoginPage />} />
        <Route path="/"               element={user ? <HomePage />                     : <Navigate to="/login" replace />} />
        <Route path="/create"         element={user ? <CharacterWizard />              : <Navigate to="/login" replace />} />
        <Route path="/character/:id"  element={user ? <CharacterSheet />               : <Navigate to="/login" replace />} />
        <Route path="/admin"          element={user && isAdminEmail(user.email) ? <AdminPanel /> : <Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
