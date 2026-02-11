import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) {
  console.warn("ARCJET_KEY is not defined - Arcjet protection disabled");
}

export const httpArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({
          // this protects us from the most common attacks like sql injection, xss, etc. by analysing the structure of the incoming request
          mode: arcjetMode,
        }),
        detectBot({
          // this protects us from bots such as web crawlers, scrapers, etc.
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({
          // this protects us from rate limiting attacks, it allows only 50 requests in 10 seconds from a single ip address
          mode: arcjetMode,
          interval: "10s",
          max: 50,
        }),
      ],
    })
  : null;

export const wsArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({
          // this protects us from the most common attacks like sql injection, xss, etc. by analysing the structure of the incoming request
          mode: arcjetMode,
        }),
        detectBot({
          // this protects us from bots such as web crawlers, scrapers, etc.
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({
          // this protects us from rate limiting attacks, it allows only 5 requests in 2 seconds from a single ip address
          mode: arcjetMode,
          interval: "2s",
          max: 5,
        }),
      ],
    })
  : null;

export function securityMiddleware() {
  return async (req, res, next) => {
    if (!httpArcjet) {
      return next();
    }
    try {
      const decision = await httpArcjet.protect(req);
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({
            message: "Too many requests",
            details: decision.reason,
          });
        }
        return res.status(403).json({
          message: "Access denied",
          details: decision.reason,
        });
      }
    } catch (error) {
      console.log("Arcjet Middleware error", error);
      return res.status(503).json({
        message: "Service Unavailable",
        details: "Arcjet is currently unavailable. Please try again later.",
      });
    }
    next();
  };
}
