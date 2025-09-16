import { z } from "zod";

export const ItemSchema = z.object({
  shortName: z.string(),
  description: z.string(),
  estimatedDimensionsInches: z.object({
    length: z.number().min(0).finite().nullable(),
    width: z.number().min(0).finite().nullable(),
    height: z.number().min(0).finite().nullable(),
  }).strict(),
  notes: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  roomName: z.string().nullable().optional(),
  count: z.number().min(1).default(1),
});

export const AnalysisSchema = z.object({
  items: z.array(ItemSchema).max(50),
  confidenceNote: z.string(),
});

export type Item = z.infer<typeof ItemSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
