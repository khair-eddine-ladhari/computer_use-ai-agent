
interface CorrectionAction {
  tool: string;
  args: Record<string, unknown>;
  result: string;
  verificationStatus?: string;
  verificationMessage?: string;
  message?: string;
}

interface CorrectionResponse {
  reply: {
    id: string;
    role: string;
    text: string;
    timestamp: number;
  };
  toolCalls: Array<{
    tool: string;
    args: Record<string, unknown>;
  }>;
  messageType: "task";
}

const AGENT_SERVER_URL =
  process.env.AGENT_SERVER_URL ?? "http://localhost:8000";

export async function requestCorrection(
  originalGoal: string,
  actionResults: CorrectionAction[],
  desktop: Record<string, unknown> | null
): Promise<CorrectionResponse> {
  const res = await fetch(
    `${AGENT_SERVER_URL}/api/agent/correction`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originalGoal,
        actionResults,
        desktop,
      }),
      signal: AbortSignal.timeout(90_000),
    }
  );

  if (!res.ok) {
    throw new Error(
      `CrewAI correction failed: HTTP ${res.status}`
    );
  }

  return (await res.json()) as CorrectionResponse;
}
