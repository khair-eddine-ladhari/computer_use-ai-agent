import { Router } from "express";
import { createTask, updateTaskStatus, listTasks } from "../services/tasks";

const router = Router();

router.post("/", async (req, res) => {
  const { sessionId, goal } = req.body;
  if (!sessionId || !goal) {
    return res.status(400).json({ error: "sessionId and goal are required" });
  }
  res.json(await createTask(sessionId, goal));
});

router.get("/:sessionId", async (req, res) => {
  res.json(await listTasks(req.params.sessionId));
});

router.patch("/:taskId", async (req, res) => {
  const { status, result, error } = req.body;
  const task = await updateTaskStatus(req.params.taskId, status, { result, error });
  if (!task) return res.status(404).json({ error: "task not found" });
  res.json(task);
});

export default router;