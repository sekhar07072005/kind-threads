import { APP_NAME } from '../lib/constants'

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-ink/60 sm:px-6">
        <p>{APP_NAME} — give clothes a second home.</p>
      </div>
    </footer>
  )
}
