import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CharacterWizard } from './pages/CharacterWizard';
import { CharacterSheet } from './pages/CharacterSheet';
import { AdminPanel } from './pages/AdminPanel';
import { useThemeStore } from './store/themeStore';

function App() {
  const theme = useThemeStore(s => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CharacterWizard />} />
        <Route path="/character/:id" element={<CharacterSheet />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
