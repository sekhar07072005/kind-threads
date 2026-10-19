import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import AdminRoute from '../components/AdminRoute'
import ProtectedRoute from '../components/ProtectedRoute'
import { supabase } from '../lib/supabaseClient'

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}))

function mockSignedOut() {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as never)
  vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  } as never)
}

function mockSignedInAs(role: 'donor' | 'admin') {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { user: { id: 'user-1', email: 'test@example.com' } } },
  } as never)
  vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  } as never)
  vi.mocked(supabase.from).mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: { id: 'user-1', full_name: 'Test User', email: 'test@example.com', role, created_at: '' },
            error: null,
          }),
      }),
    }),
  } as never)
}

function renderAdminGuard() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthProvider>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div>Admin area</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Donor dashboard</div>} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('AdminRoute', () => {
  it('lets an admin through to the admin page', async () => {
    mockSignedInAs('admin')
    renderAdminGuard()
    expect(await screen.findByText('Admin area')).toBeInTheDocument()
  })

  it('redirects a signed-in donor away from the admin page', async () => {
    mockSignedInAs('donor')
    renderAdminGuard()
    expect(await screen.findByText('Donor dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Admin area')).not.toBeInTheDocument()
  })

  it('redirects a signed-out visitor to login', async () => {
    mockSignedOut()
    renderAdminGuard()
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })
})

describe('ProtectedRoute', () => {
  it('redirects a signed-out visitor to login instead of showing the page', async () => {
    mockSignedOut()
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Donor dashboard</div>} />
            </Route>
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })
})
