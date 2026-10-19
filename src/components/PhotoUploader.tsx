import { useRef, useState, type ChangeEvent } from 'react'
import { MAX_PHOTOS, MAX_PHOTO_SIZE_MB } from '../lib/constants'

interface PhotoUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  error?: string
}

export default function PhotoUploader({ files, onChange, error }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState('')

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setLocalError('')
    if (selected.length === 0) return

    const combined = [...files, ...selected]
    if (combined.length > MAX_PHOTOS) {
      setLocalError(`You can attach up to ${MAX_PHOTOS} photos.`)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    const tooLarge = selected.find((f) => f.size > MAX_PHOTO_SIZE_MB * 1024 * 1024)
    if (tooLarge) {
      setLocalError(`"${tooLarge.name}" is larger than ${MAX_PHOTO_SIZE_MB}MB.`)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    const notImage = selected.find((f) => !f.type.startsWith('image/'))
    if (notImage) {
      setLocalError(`"${notImage.name}" is not an image file.`)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    onChange(combined)
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label htmlFor="photos" className="mb-1 block text-sm font-medium text-ink">
        Photos (optional)
      </label>
      <input
        ref={inputRef}
        id="photos"
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-denim file:px-3 file:py-2 file:text-sm file:font-medium file:text-paper hover:file:bg-denim-dark"
      />
      <p className="mt-1 text-xs text-ink/50">
        Up to {MAX_PHOTOS} photos, {MAX_PHOTO_SIZE_MB}MB each.
      </p>
      {(localError || error) && <p className="mt-1 text-sm text-rust">{localError || error}</p>}
      {files.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="relative">
              <img src={URL.createObjectURL(file)} alt={file.name} className="h-20 w-20 rounded object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={`Remove ${file.name}`}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rust text-xs text-white"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
