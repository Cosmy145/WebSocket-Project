import { z } from "zod";

// ── Match Status Constants ──────────────────────────────────────────────────────
export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
};

// ── List Matches Query Schema ───────────────────────────────────────────────────
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// ── Match ID Param Schema ───────────────────────────────────────────────────────
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ── Create Match Schema ─────────────────────────────────────────────────────────
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, "sport is required"),
    homeTeam: z.string().min(1, "homeTeam is required"),
    awayTeam: z.string().min(1, "awayTeam is required"),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "startTime must be a valid ISO date string",
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "endTime must be a valid ISO date string",
    }),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (new Date(data.endTime) <= new Date(data.startTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endTime must be after startTime",
        path: ["endTime"],
      });
    }
  });

// ── Update Score Schema ─────────────────────────────────────────────────────────
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
