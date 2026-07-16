import { z } from 'zod';

export const SubscribeSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>;
