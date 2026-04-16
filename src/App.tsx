import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import GeneratePage from './pages/GeneratePage';
import HistoryPage from './pages/HistoryPage';
import JobTrackerPage from './pages/JobTrackerPage';
import AuthGuard from './components/AuthGuard';
import AppShell from './components/AppShell';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/generate" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="generate" element={<GeneratePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="tracker" element={<JobTrackerPage />} />
        </Route>
        {/* Catch-all — redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
