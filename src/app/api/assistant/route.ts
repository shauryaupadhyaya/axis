import { createAgentUIStreamResponse } from "ai";
import { getAppSnapshot } from "@/lib/app-snapshot";
import { createAssistantAgent } from "@/lib/ai/agent";

export async function POST(request: Request) {
  const { messages } = await request.json();
  const snapshot = await getAppSnapshot();
  const agent = createAssistantAgent(snapshot);

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
  });
}
