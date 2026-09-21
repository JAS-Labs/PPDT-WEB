import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import PracticePage from './pages/PracticePage'
import PracticeSessionRouter from './pages/PracticeSessionRouter'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import WebMCPBridge from './components/WebMCPBridge'

function RequireAuth({ children }) {
  const location = useLocation()
  return localStorage.getItem('issb-token') ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

export default function App() {
  return (
    <><WebMCPBridge/><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="practice/:testId" element={<RequireAuth><PracticeSessionRouter /></RequireAuth>} />
        <Route path="history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></>
  )
}
