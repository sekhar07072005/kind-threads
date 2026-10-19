import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Donation } from '../lib/types'
import { CLOTHING_TYPES } from '../lib/validation'
import DonationCard from '../components/DonationCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'

export default function BrowseDonations() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      let query = supabase
        .from('donations')
        .select('*')
        .in('status', ['approved', 'fulfilled'])
        .order('created_at', { ascending: false })

      if (typeFilter) query = query.eq('clothing_type', typeFilter)
      if (locationFilter.trim()) query = query.ilike('location', `%${locationFilter.trim()}%`)

      const { data, error: fetchError } = await query

      if (cancelled) return
      if (fetchError) {
        setError('Could not load donations. ' + fetchError.message)
      } else {
        setDonations((data ?? []) as Donation[])
      }
      setLoading(false)
    }

    const timeout = setTimeout(load, 250) // light debounce while typing the location filter
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [typeFilter, locationFilter])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Browse donations</h1>
      <p className="mt-1 text-sm text-ink/70">Approved listings that are ready to be collected.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-56">
          <label htmlFor="typeFilter" className="mb-1 block text-sm font-medium">
            Clothing type
          </label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded border border-ink/20 bg-white px-3 py-2 text-sm focus:border-denim"
          >
            <option value="">All types</option>
            {CLOTHING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="locationFilter" className="mb-1 block text-sm font-medium">
            Location contains
          </label>
          <input
            id="locationFilter"
            type="text"
            placeholder="e.g. downtown, zip code, city"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-denim"
          />
        </div>
      </div>

      <div className="mt-8">
        {loading && <LoadingSpinner label="Loading donations…" size="lg" />}
        {!loading && error && <Alert kind="error" message={error} />}
        {!loading && !error && donations.length === 0 && (
          <div className="rounded-lg border border-dashed border-ink/20 px-6 py-12 text-center">
            <p className="text-ink/70">No donations match your filters right now.</p>
          </div>
        )}
        {!loading && !error && donations.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {donations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
