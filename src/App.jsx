import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import RecordPage from './pages/RecordPage';
import RecordsPage from './pages/RecordsPage';
import QuestPage from './pages/QuestPage';
import LoginPage from './pages/LoginPage';

function AppRoutes() {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div
        className="min-h-svh flex items-center justify-center"
        style={{ background: '#05080f' }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '2px solid rgba(0,212,255,0.2)',
            borderTop: '2px solid #00d4ff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <GameProvider>
      <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#05080f' }}>
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/record"  element={<RecordPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/quest"   element={<QuestPage />} />
          <Route path="/login"   element={<LoginPage />} />
        </Routes>
        <BottomNav />
      </div>
    </GameProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
