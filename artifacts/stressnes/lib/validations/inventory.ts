import { z } from 'zod';
import { InventoryChangeReason } from '@prisma/client';

export const AdjustInventorySchema = z.object({
  change: z.number().int(),
  reason: z.nativeEnum(InventoryChangeReason),
  note: z.string().max(500).optional(),
});

export const UpdateInventorySettingsSchema = z.object({
  lowStockThreshold: z.number().int().min(0).optional(),
  trackInventory: z.boolean().optional(),
});

export type AdjustInventoryInput = z.infer<typeof AdjustInventorySchema>;
export type UpdateInventorySettingsInput = z.infer<typeof UpdateInventorySettingsSchema>;
