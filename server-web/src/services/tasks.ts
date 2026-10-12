import Task, { TaskStatus } from "../models/Task";

export async function createTask(sessionId: string, goal: string) {
  return Task.create({ sessionId, goal });
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  extra: { result?: string; error?: string } = {}
) {
  const patch: Record<string, unknown> = { status, ...extra };
  if (status === "running") patch.startedAt = new Date();
  if (["completed", "failed", "cancelled"].includes(status)) patch.finishedAt = new Date();
  return Task.findByIdAndUpdate(taskId, patch, { new: true });
}

export async function listTasks(sessionId: string) {
  return Task.find({ sessionId }).sort({ createdAt: -1 }).limit(50);
}

export async function getTask(taskId: string) {
  return Task.findById(taskId);
}