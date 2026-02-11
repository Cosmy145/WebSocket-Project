import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  integer,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────────────────

export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
]);

// ── Matches Table ────────────────────────────────────────────────────────────

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  sport: varchar("sport", { length: 50 }).notNull(),
  homeTeam: varchar("home_team", { length: 100 }).notNull(),
  awayTeam: varchar("away_team", { length: 100 }).notNull(),
  status: matchStatusEnum("status").default("scheduled").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  homeScore: integer("home_score").default(0).notNull(),
  awayScore: integer("away_score").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Commentary Table ─────────────────────────────────────────────────────────

export const commentary = pgTable("commentary", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .references(() => matches.id, { onDelete: "cascade" })
    .notNull(),
  minute: integer("minute").notNull(),
  sequence: integer("sequence").notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  actor: varchar("actor", { length: 100 }),
  team: varchar("team", { length: 100 }),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
