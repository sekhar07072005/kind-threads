import { z } from 'zod'

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your full name (at least 2 characters).')
      .max(100, 'That name is too long.'),
    email: z.string().trim().email('Enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(72, 'Password is too long.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const CLOTHING_TYPES = [
  "Men's clothing",
  "Women's clothing",
  "Children's clothing",
  'Shoes',
  'Outerwear / coats',
  'Accessories',
  'Bedding / linens',
  'Other',
] as const

export const donationSchema = z.object({
  clothingType: z.enum(CLOTHING_TYPES, {
    errorMap: () => ({ message: 'Select a clothing type.' }),
  }),
  quantity: z.coerce
    .number({ invalid_type_error: 'Enter a number.' })
    .int('Quantity must be a whole number.')
    .min(1, 'Quantity must be at least 1.')
    .max(10000, 'That quantity looks too large — contact us for bulk donations.'),
  location: z
    .string()
    .trim()
    .min(2, 'Enter a pickup or drop-off location.')
    .max(200, 'Location is too long.'),
  description: z
    .string()
    .trim()
    .max(1000, 'Keep the description under 1000 characters.')
    .optional()
    .or(z.literal('')),
})

export type DonationFormValues = z.infer<typeof donationSchema>
