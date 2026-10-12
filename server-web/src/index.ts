import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import agentRoutes from "./routes/agent";
import tasksRoutes from "./routes/tasks";
import { connectDB } from "./db/mongodb";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/agent", agentRoutes);
app.use("/api/tasks", tasksRoutes);

// Must be registered last, after all routes, so it catches errors from any of them
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});