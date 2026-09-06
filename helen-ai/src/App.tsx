import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { OnboardingGuard } from '@/components/OnboardingGuard'
import { Auth } from '@/pages/Auth'
import { Onboarding } from '@/pages/Onboarding'
import { Dashboard } from '@/pages/Dashboard'

function RootRedirect() {
  const { session, profile, loading } = useAuth()

  if (loading) return null
  if (!session) return <Navigate to="/auth" replace />
  // Authenticated users are routed by the guards on /onboarding and
  // /dashboard so the logic stays in one place.
  if (profile?.role === 'student') {
    return <Navigate to="/onboarding" replace />
  }
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/dashboard"
        element={
          <OnboardingGuard>
            <Dashboard />
          </OnboardingGuard>
        }
      />
    </Routes>
  )
}
