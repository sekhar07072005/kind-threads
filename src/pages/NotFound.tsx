import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-4xl font-bold">Page not found</h1>
      <p className="mt-3 text-ink/70">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="mt-6 inline-block rounded bg-denim px-6 py-3 text-sm font-medium text-paper hover:bg-denim-dark">
        Back to home
      </Link>
    </div>
  )
}
