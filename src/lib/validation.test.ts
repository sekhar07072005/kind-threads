import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, donationSchema } from './validation'

describe('registerSchema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({
      fullName: 'Jordan Rivera',
      email: 'jordan@example.com',
      password: 'supersecret1',
      confirmPassword: 'supersecret1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a short password', () => {
    const result = registerSchema.safeParse({
      fullName: 'Jordan Rivera',
      email: 'jordan@example.com',
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      fullName: 'Jordan Rivera',
      email: 'jordan@example.com',
      password: 'supersecret1',
      confirmPassword: 'different1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true)
    }
  })

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      fullName: 'Jordan Rivera',
      email: 'not-an-email',
      password: 'supersecret1',
      confirmPassword: 'supersecret1',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('requires a password', () => {
    const result = loginSchema.safeParse({ email: 'jordan@example.com', password: '' })
    expect(result.success).toBe(false)
  })

  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'jordan@example.com', password: 'anything' })
    expect(result.success).toBe(true)
  })
})

describe('donationSchema', () => {
  it('accepts a valid donation', () => {
    const result = donationSchema.safeParse({
      clothingType: "Men's clothing",
      quantity: 5,
      location: 'Downtown drop-off',
      description: 'Lightly worn jackets',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a zero or negative quantity', () => {
    const result = donationSchema.safeParse({
      clothingType: "Men's clothing",
      quantity: 0,
      location: 'Downtown drop-off',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unlisted clothing type', () => {
    const result = donationSchema.safeParse({
      clothingType: 'Spacesuits',
      quantity: 1,
      location: 'Downtown drop-off',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing location', () => {
    const result = donationSchema.safeParse({
      clothingType: "Men's clothing",
      quantity: 1,
      location: '',
    })
    expect(result.success).toBe(false)
  })

  it('coerces a numeric string quantity from a form input', () => {
    const result = donationSchema.safeParse({
      clothingType: "Men's clothing",
      quantity: '3',
      location: 'Downtown drop-off',
    })
    expect(result.success).toBe(true)
  })
})
