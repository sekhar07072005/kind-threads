import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { loginSchema, type LoginFormValues } from '../lib/validation'
import Alert from '../components/Alert'

export default function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, navigate, from])

  async function onSubmit(values: LoginFormValues) {
    setServerError('')
    const { error } = await signIn(values.email, values.password)
    if (error) setServerError(error)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Log in</h1>
      <p className="mt-2 text-sm text-ink/70">
        New here?{' '}
        <Link to="/register" className="font-medium text-denim underline">
          Create an account
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-5">
        {serverError && <Alert kind="error" message={serverError} onDismiss={() => setServerError('')} />}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-denim"
          />
          {errors.email && <p className="mt-1 text-sm text-rust">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            aria-invalid={!!errors.password}
            className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-denim"
          />
          {errors.password && <p className="mt-1 text-sm text-rust">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded bg-denim px-6 py-3 text-sm font-medium text-paper hover:bg-denim-dark disabled:opacity-60"
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
