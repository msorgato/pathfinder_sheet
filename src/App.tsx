import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CharacterWizard } from './pages/CharacterWizard';
import { CharacterSheet } from './pages/CharacterSheet';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CharacterWizard />} />
        <Route path="/character/:id" element={<CharacterSheet />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
