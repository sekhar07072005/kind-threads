import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CLOTHING_TYPES, donationSchema, type DonationFormValues } from '../lib/validation'
import { PHOTO_BUCKET } from '../lib/constants'
import Alert from '../components/Alert'
import PhotoUploader from '../components/PhotoUploader'

export default function SubmitDonation() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DonationFormValues>({ resolver: zodResolver(donationSchema) })

  async function uploadPhotos(): Promise<string[]> {
    if (!user) return []
    const urls: string[] = []

    for (const file of photos) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`

      const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (uploadError) {
        throw new Error(`Could not upload "${file.name}": ${uploadError.message}`)
      }

      const { data: publicUrlData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
      urls.push(publicUrlData.publicUrl)
    }

    return urls
  }

  async function onSubmit(values: DonationFormValues) {
    if (!user) return
    setServerError('')
    setSubmitting(true)

    try {
      const photoUrls = await uploadPhotos()

      const { error: insertError } = await supabase.from('donations').insert({
        donor_id: user.id,
        clothing_type: values.clothingType,
        quantity: values.quantity,
        location: values.location,
        description: values.description || null,
        photo_urls: photoUrls,
      })

      if (insertError) {
        throw new Error(insertError.message)
      }

      setSuccess(true)
      setPhotos([])
      reset()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Submit a donation</h1>
      <p className="mt-2 text-sm text-ink/70">
        Fill in what you are giving away. An administrator will review it before it is listed.
      </p>

      {success && (
        <div className="mt-6">
          <Alert
            kind="success"
            message="Donation submitted. It will show as “Awaiting review” on your dashboard until an admin approves it."
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="rounded bg-denim px-5 py-2.5 text-sm font-medium text-paper hover:bg-denim-dark"
            >
              Submit another
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded border border-ink/20 px-5 py-2.5 text-sm font-medium hover:bg-ink/5"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-5">
          {serverError && <Alert kind="error" message={serverError} onDismiss={() => setServerError('')} />}

          <div>
            <label htmlFor="clothingType" className="mb-1 block text-sm font-medium">
              Clothing type
            </label>
            <select
              id="clothingType"
              defaultValue=""
              {...register('clothingType')}
              aria-invalid={!!errors.clothingType}
              className="w-full rounded border border-ink/20 bg-white px-3 py-2 text-sm focus:border-denim"
            >
              <option value="" disabled>
                Select a type
              </option>
              {CLOTHING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.clothingType && <p className="mt-1 text-sm text-rust">{errors.clothingType.message}</p>}
          </div>

          <div>
            <label htmlFor="quantity" className="mb-1 block text-sm font-medium">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              {...register('quantity')}
              aria-invalid={!!errors.quantity}
              className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-denim"
            />
            {errors.quantity && <p className="mt-1 text-sm text-rust">{errors.quantity.message}</p>}
          </div>

          <div>
            <label htmlFor="location" className="mb-1 block text-sm font-medium">
              Pickup / drop-off location
            </label>
            <input
              id="location"
              type="text"
              placeholder="City, neighborhood, or address"
              {...register('location')}
              aria-invalid={!!errors.location}
              className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-denim"
            />
            {errors.location && <p className="mt-1 text-sm text-rust">{errors.location.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Condition, sizes, anything a recipient should know"
              {...register('description')}
              aria-invalid={!!errors.description}
              className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-denim"
            />
            {errors.description && <p className="mt-1 text-sm text-rust">{errors.description.message}</p>}
          </div>

          <PhotoUploader files={photos} onChange={setPhotos} />

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded bg-denim px-6 py-3 text-sm font-medium text-paper hover:bg-denim-dark disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit donation'}
          </button>
        </form>
      )}
    </div>
  )
}
