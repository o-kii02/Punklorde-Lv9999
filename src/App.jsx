import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import RecordPage from './pages/RecordPage';
import RecordsPage from './pages/RecordsPage';
import QuestPage from './pages/QuestPage';

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#05080f' }}>
          <Routes>
            <Route path="/"        element={<Dashboard />} />
            <Route path="/record"  element={<RecordPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/quest"   element={<QuestPage />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </GameProvider>
  );
}
