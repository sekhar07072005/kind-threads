import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function AdminRoute() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Checking permissions…" size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />

  return <Outlet />
}
