import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './components/ToastProvider';
import { AchievementsPage } from './pages/Achievements';
import { DebriefPage } from './pages/Debrief';
import { LeaderboardPage } from './pages/Leaderboard';
import { LoginPage } from './pages/Login';
import { PlayPage } from './pages/Play';
import { ProfilePage } from './pages/Profile';
import { RegisterPage } from './pages/Register';
import { ScenariosPage } from './pages/Scenarios';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/scenarios" element={<ScenariosPage />} />
            <Route path="/sessions/:id/play" element={<PlayPage />} />
            <Route path="/sessions/:id/debrief" element={<DebriefPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/achievements" element={<AchievementsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/scenarios" replace />} />
        <Route path="*" element={<Navigate to="/scenarios" replace />} />
      </Routes>
    </ToastProvider>
  );
}
