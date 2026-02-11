import express from "express";
import matchesRoutes from "./routes/matches.routes.js";

const app = express();
const PORT = 8000;

// JSON middleware
app.use(express.json());

// Root GET route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Express.js server!" });
});

app.use("/api/v1/matches", matchesRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
