import { z } from "zod";

export const ItemSchema = z.object({
  shortName: z.string(),
  description: z.string(),
  estimatedDimensionsInches: z.object({
    length: z.number().positive().finite().nullable(),
    width: z.number().positive().finite().nullable(),
    height: z.number().positive().finite().nullable(),
  }).strict(),
  notes: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  roomName: z.string().nullable().optional(),
});

export const AnalysisSchema = z.object({
  items: z.array(ItemSchema).max(50),
  confidenceNote: z.string(),
});

export type Item = z.infer<typeof ItemSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
