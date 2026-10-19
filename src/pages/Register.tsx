import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { registerSchema, type RegisterFormValues } from '../lib/validation'
import Alert from '../components/Alert'

export default function Register() {
  const { signUp, user } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  // If sign-up already produced a live session (email confirmation disabled
  // on this Supabase project), send the person straight to their dashboard.
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function onSubmit(values: RegisterFormValues) {
    setServerError('')
    const { error } = await signUp(values.email, values.password, values.fullName)
    if (error) {
      setServerError(error)
      return
    }
    setSuccess(true)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Create your account</h1>
      <p className="mt-2 text-sm text-ink/70">
        Already have one?{' '}
        <Link to="/login" className="font-medium text-denim underline">
          Log in
        </Link>
      </p>

      {success ? (
        <div className="mt-8">
          <Alert
            kind="success"
            message="Account created. If this project requires email confirmation, check your inbox for a confirmation link before logging in."
          />
          <Link to="/login" className="mt-4 inline-block rounded bg-denim px-6 py-3 text-sm font-medium text-paper hover:bg-denim-dark">
            Go to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-5">
          {serverError && <Alert kind="error" message={serverError} onDismiss={() => setServerError('')} />}

          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              {...register('fullName')}
              aria-invalid={!!errors.fullName}
              className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-denim"
            />
            {errors.fullName && <p className="mt-1 text-sm text-rust">{errors.fullName.message}</p>}
          </div>

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
              autoComplete="new-password"
              {...register('password')}
              aria-invalid={!!errors.password}
              className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-denim"
            />
            {errors.password && <p className="mt-1 text-sm text-rust">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              aria-invalid={!!errors.confirmPassword}
              className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-denim"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-rust">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded bg-denim px-6 py-3 text-sm font-medium text-paper hover:bg-denim-dark disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  )
}
