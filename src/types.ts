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
  // Bounding box coordinates (normalized 0-1 relative to image dimensions)
  boundingBox: z.object({
    x: z.number().min(0).max(1), // Left position (0 = left edge, 1 = right edge)
    y: z.number().min(0).max(1), // Top position (0 = top edge, 1 = bottom edge)
    width: z.number().min(0).max(1), // Width as fraction of image width
    height: z.number().min(0).max(1), // Height as fraction of image height
  }).nullable().optional(),
  sourceImageIndex: z.number().optional(), // Which image in the batch this item was found in
});

export const AnalysisSchema = z.object({
  items: z.array(ItemSchema).max(50),
  confidenceNote: z.string(),
});

export type Item = z.infer<typeof ItemSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
