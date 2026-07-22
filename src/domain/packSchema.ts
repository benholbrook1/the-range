import { z } from 'zod';

export const CURRENT_PACK_SCHEMA_VERSION = 1;

const scoringSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('makes_out_of'),
    attempts: z.number().int().positive(),
    unit: z.string().min(1),
  }),
  z.object({
    type: z.literal('reps'),
    target: z.number().int().positive().optional(),
    unit: z.string().min(1),
  }),
  z.object({
    type: z.literal('score_total'),
    unit: z.string().min(1),
    attempts: z.number().int().positive().optional(),
  }),
  z.object({
    type: z.literal('strokes'),
    holes: z.number().int().positive(),
    parPerHole: z.number().int().positive(),
    unit: z.string().min(1),
  }),
]);

const visualSchema = z.enum([
  'par18',
  'clock',
  'gate',
  'lag',
  'rings',
  'corridor',
  'ladder',
  'pressure',
]);

export const drillPackSchema = z.object({
  schemaVersion: z.number().int().positive(),
  packId: z.string().min(1),
  name: z.string().min(1),
  drills: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        category: z.enum(['putting', 'short_game', 'full_swing', 'other']),
        estimatedMinutes: z.number().positive(),
        instructions: z.array(z.string().min(1)).min(1),
        scoring: scoringSchema,
        visual: visualSchema.optional(),
      }),
    )
    .min(1),
});

export type DrillPackInput = z.infer<typeof drillPackSchema>;

export function parseDrillPack(input: unknown): DrillPackInput {
  const parsed = drillPackSchema.parse(input);
  if (parsed.schemaVersion !== CURRENT_PACK_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported pack schemaVersion ${parsed.schemaVersion}; expected ${CURRENT_PACK_SCHEMA_VERSION}`,
    );
  }
  return parsed;
}

export function safeParseDrillPack(input: unknown):
  | { ok: true; pack: DrillPackInput }
  | { ok: false; error: string } {
  try {
    return { ok: true, pack: parseDrillPack(input) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Invalid drill pack',
    };
  }
}
