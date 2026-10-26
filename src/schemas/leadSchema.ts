import { z } from 'zod'

export const leadFormSchema = z.object({
  client_name: z.string().trim().min(1, 'Client name is required'),
  company_name: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  website: z.string().trim().optional().or(z.literal('')),
  source: z.string().trim().optional().or(z.literal('')),
  status: z.string().min(1, 'Stage is required'),
  approval_status: z.enum(['not_submitted', 'pending', 'approved', 'rejected']),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  follow_up_at: z.string().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
  tags: z.string().trim().optional().or(z.literal('')),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>

export const noteFormSchema = z.object({
  note_text: z.string().trim().min(1, 'Note text is required'),
})

export type NoteFormValues = z.infer<typeof noteFormSchema>

export const contactAttemptSchema = z.object({
  contact_method: z.string().min(1, 'Contact method is required'),
  contact_outcome: z.string().min(1, 'Outcome is required'),
  note_text: z.string().trim().min(1, 'A short description is required'),
  next_follow_up_at: z.string().optional().or(z.literal('')),
})

export type ContactAttemptValues = z.infer<typeof contactAttemptSchema>
