import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import Insights from './pages/Insights'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Leaderboard from './pages/Leaderboard'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="devices" element={<Devices />} />
        <Route path="insights" element={<Insights />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="profile" element={<Profile />} />
        {user?.role === 'admin' && (
          <Route path="admin" element={<Admin />} />
        )}
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App