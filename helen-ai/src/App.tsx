import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { OnboardingGuard } from '@/components/OnboardingGuard'
import { Auth } from '@/pages/Auth'
import { Onboarding } from '@/pages/Onboarding'
import { Dashboard } from '@/pages/Dashboard'
import { AppShell } from '@/components/layout/AppShell'
import { AIAssistant } from '@/pages/AIAssistant'
import { Documents } from '@/pages/Documents'
import { Notes } from '@/pages/Notes'
import { Progress, StudentProgress } from '@/pages/Progress'
import { Classrooms } from '@/pages/Classrooms'
import { Assignments } from '@/pages/Assignments'
import { MyChild } from '@/pages/MyChild'
import { Users } from '@/pages/Users'
import { Reports } from '@/pages/Reports'

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
            <AppShell>
              <Dashboard />
            </AppShell>
          </OnboardingGuard>
        }
      />
      <Route
        path="/ai-assistant"
        element={
          <OnboardingGuard>
            <AppShell>
              <AIAssistant />
            </AppShell>
          </OnboardingGuard>
        }
      />
      <Route
        path="/documents"
        element={
          <OnboardingGuard>
            <AppShell>
              <Documents />
            </AppShell>
          </OnboardingGuard>
        }
      />
      <Route
        path="/notes"
        element={
          <OnboardingGuard>
            <AppShell>
              <Notes />
            </AppShell>
          </OnboardingGuard>
        }
      />
      <Route
        path="/progress"
        element={
          <OnboardingGuard>
            <AppShell>
              <Progress />
            </AppShell>
          </OnboardingGuard>
        }
      />
      <Route
        path="/classrooms"
        element={
          <OnboardingGuard>
            <AppShell>
              <Classrooms />
            </AppShell>
          </OnboardingGuard>
        }
      />
      <Route
        path="/assignments"
        element={
          <OnboardingGuard>
            <AppShell>
              <Assignments />
            </AppShell>
          </OnboardingGuard>
        }
      />
      <Route
        path="/student-progress"
        element={
          <OnboardingGuard>
            <AppShell>
              <StudentProgress />
            </AppShell>
          </OnboardingGuard>
        }
      />
      <Route
        path="/my-child"
        element={
          <OnboardingGuard>
            <AppShell>
              <MyChild />
            </AppShell>
          </OnboardingGuard>
        }
      />
      <Route
        path="/users"
        element={
          <OnboardingGuard>
            <AppShell>
              <Users />
            </AppShell>
          </OnboardingGuard>
        }
      />
      <Route
        path="/reports"
        element={
          <OnboardingGuard>
            <AppShell>
              <Reports />
            </AppShell>
          </OnboardingGuard>
        }
      />
    </Routes>
  )
}
