export type DonationStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled'
export type UserRole = 'donor' | 'admin'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Donation {
  id: string
  donor_id: string
  clothing_type: string
  quantity: number
  location: string
  description: string | null
  photo_urls: string[]
  status: DonationStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

// Shape returned when the admin dashboard joins donations -> profiles.
export interface DonationWithDonor extends Donation {
  profiles: Pick<Profile, 'full_name' | 'email'> | null
}
