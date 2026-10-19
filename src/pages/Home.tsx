import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../lib/constants'

const steps = [
  {
    number: '1',
    title: 'List it',
    body: 'Tell us the clothing type, quantity, and where it can be picked up or dropped off.',
  },
  {
    number: '2',
    title: 'We review it',
    body: 'An administrator checks the listing and approves it so it can be collected.',
  },
  {
    number: '3',
    title: 'It finds a home',
    body: 'Approved items are collected and marked fulfilled — you can track the status the whole time.',
  },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="max-w-2xl">
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Give clothes a second home.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-ink/70">
            List what you no longer wear. We review it, match it with someone who needs it, and you
            can follow every item from drop-off to new home.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={user ? '/donate' : '/register'}
              className="rounded bg-denim px-6 py-3 text-base font-medium text-paper hover:bg-denim-dark"
            >
              {user ? 'Submit a donation' : 'Create an account'}
            </Link>
            <Link
              to={user ? '/browse' : '/login'}
              className="rounded border border-ink/20 px-6 py-3 text-base font-medium hover:bg-ink/5"
            >
              {user ? 'Browse donations' : 'Log in'}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col gap-2">
                <span className="font-display text-4xl font-bold text-denim">{step.number}</span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-ink/70">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-lg border border-ink/10 bg-denim/5 p-8 sm:p-12">
          <h2 className="font-display text-3xl font-semibold">Ready to clear out a closet?</h2>
          <p className="mt-2 max-w-md text-ink/70">
            It takes a few minutes to list a donation on {APP_NAME}, and you can check its status
            any time from your dashboard.
          </p>
          <Link
            to={user ? '/donate' : '/register'}
            className="mt-6 inline-block rounded bg-denim px-6 py-3 text-base font-medium text-paper hover:bg-denim-dark"
          >
            {user ? 'Submit a donation' : 'Get started'}
          </Link>
        </div>
      </section>
    </div>
  )
}
