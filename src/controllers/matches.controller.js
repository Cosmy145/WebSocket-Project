import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/matchStatus.js";
import { desc } from "drizzle-orm";

export const getAllMatches = async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request query",
      errors: parsed.error.issues,
    });
  }
  try {
    const limit = Math.min(parsed.data.limit ?? 50 , 100);
    const allMatches = await db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit);
    res.status(200).json({
      message: "Matches",
      matches: allMatches,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch matches",
      details: JSON.stringify(error),
    });
  }
};

export const createMatch = async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request body",
      errors: parsed.error.issues,
    });
  }
  try{
    const { startTime, endTime, homeScore, awayScore } = parsed.data;

  const [match] = await db.insert(matches).values({
    ...parsed.data,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    homeScore: homeScore || 0,
    awayScore: awayScore || 0,
    status: getMatchStatus(startTime, endTime),
  }).returning();

  if(req.app.locals.broadcastMatchCreated){
    req.app.locals.broadcastMatchCreated(match);
  }

  return res.status(201).json({
    message: "Match created successfully",
    match,
  });
}catch(error){
  return res.status(500).json({
    error: "Unable to create match",
    details: JSON.stringify(error),
  });
}
}

export default {getAllMatches, createMatch};
