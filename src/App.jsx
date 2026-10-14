import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import PracticePage from './pages/PracticePage'
import PracticeSessionRouter from './pages/PracticeSessionRouter'
import HistoryPage from './pages/HistoryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import GuidePage from './pages/GuidePage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import WebMCPBridge from './components/WebMCPBridge'
import ConnectionNotice from './components/ConnectionNotice'
import PasswordResetPage from './pages/PasswordResetPage'
import AdminPage from './pages/AdminPage'
import { useApp } from './state/AppContext'

function RequireAuth({ children }) {
  const { isAuthenticated } = useApp()
  const location = useLocation()
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

function RequireAdmin({ children }) {
  const { profile } = useApp()
  const location = useLocation()
  return profile.role === 'admin'
    ? children
    : <Navigate to="/" replace state={{ from: location.pathname }} />
}

export default function App() {
  const { isAuthenticated } = useApp()

  return (
    <>
      <WebMCPBridge />
      <ConnectionNotice />
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<LoginPage initialMode="signup" />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />

        {/* Unauthenticated visitors see the Landing Page at root */}
        {!isAuthenticated && <Route path="/" element={<LandingPage />} />}

        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          {isAuthenticated && <Route index element={<DashboardPage />} />}
          <Route path="practice" element={<PracticePage />} />
          <Route path="practice/:testId" element={<PracticeSessionRouter />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="guide" element={<GuidePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
