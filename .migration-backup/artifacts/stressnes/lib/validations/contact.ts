import { z } from 'zod';

export const ContactMessageSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().max(20).optional(),
  subject: z.string().min(3).max(255),
  message: z.string().min(10).max(3000),
});

export type ContactMessageInput = z.infer<typeof ContactMessageSchema>;
