import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../lib/constants'

function linkClass({ isActive }: { isActive: boolean }) {
  return `rounded px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-denim text-paper' : 'text-ink hover:bg-denim/10'
  }`
}

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    setOpen(false)
    navigate('/')
  }

  return (
    <header className="border-b border-ink/10 bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink
          to="/"
          className="font-display text-2xl font-bold tracking-tight text-denim"
          onClick={() => setOpen(false)}
        >
          {APP_NAME}
        </NavLink>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded border border-ink/20 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '✕' : '☰'}
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          {user && (
            <NavLink to="/browse" className={linkClass}>
              Browse
            </NavLink>
          )}
          {user && (
            <NavLink to="/donate" className={linkClass}>
              Donate
            </NavLink>
          )}
          {user && (
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          )}
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
          {!user ? (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <NavLink
                to="/register"
                className="ml-2 rounded bg-denim px-4 py-2 text-sm font-medium text-paper hover:bg-denim-dark"
              >
                Sign up
              </NavLink>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSignOut}
              className="ml-2 rounded border border-ink/20 px-4 py-2 text-sm font-medium hover:bg-ink/5"
            >
              Log out
            </button>
          )}
        </nav>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-ink/10 px-4 pb-4 pt-2 md:hidden">
          <NavLink to="/" className={linkClass} end onClick={() => setOpen(false)}>
            Home
          </NavLink>
          {user && (
            <NavLink to="/browse" className={linkClass} onClick={() => setOpen(false)}>
              Browse
            </NavLink>
          )}
          {user && (
            <NavLink to="/donate" className={linkClass} onClick={() => setOpen(false)}>
              Donate
            </NavLink>
          )}
          {user && (
            <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
              Dashboard
            </NavLink>
          )}
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
              Admin
            </NavLink>
          )}
          {!user ? (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                Log in
              </NavLink>
              <NavLink to="/register" className={linkClass} onClick={() => setOpen(false)}>
                Sign up
              </NavLink>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded px-3 py-2 text-left text-sm font-medium hover:bg-ink/5"
            >
              Log out
            </button>
          )}
        </nav>
      )}
    </header>
  )
}
