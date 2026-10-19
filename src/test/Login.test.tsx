import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import Login from '../pages/Login'
import { supabase } from '../lib/supabaseClient'

// The real supabaseClient throws if env vars are missing (by design, see
// lib/supabaseClient.ts), so every test file that touches AuthProvider
// mocks this module instead of importing the real client.
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(),
  },
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: null },
  } as never)
  vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  } as never)
})

describe('Login page', () => {
  it('shows validation errors when the form is submitted empty', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(await screen.findByText(/enter your password/i)).toBeInTheDocument()
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('calls signIn with the entered credentials on valid submit', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ error: null } as never)
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'donor@example.com')
    await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'donor@example.com',
        password: 'correct-horse-battery',
      })
    )
  })

  it('shows a plain-language error when login fails', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    } as never)
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'donor@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument()
  })
})
