"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send } from "lucide-react";
import { SidePanel } from "@/components/ui/SidePanel";
import { VoiceInputButton } from "@/components/tasks/VoiceInputButton";
import type { AssistantUIMessage } from "@/lib/ai/agent";

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat<AssistantUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/assistant" }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;
    sendMessage({ text: input });
    setInput("");
  }

  function handleVoiceTranscript(transcript: string) {
    if (!transcript.trim() || status !== "ready") return;
    sendMessage({ text: transcript });
    setInput("");
  }

  return (
    <SidePanel open={open} onClose={onClose} title="Assistant">
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-small text-graphite py-4">
              Ask about your day, or say something like &ldquo;create a task to email the professor tomorrow&rdquo;.
            </p>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg px-3 py-2 text-small max-w-[90%] ${
                message.role === "user"
                  ? "self-end bg-carbon text-white dark:bg-tuscan dark:text-carbon"
                  : "self-start bg-alabaster/40"
              }`}
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") return <span key={i}>{part.text}</span>;
                if (part.type === "tool-createTask" && part.state === "output-available") {
                  return (
                    <span key={i} className="block italic opacity-80">
                      Created task: {part.input.title}
                    </span>
                  );
                }
                if (part.type === "tool-createTask") {
                  return (
                    <span key={i} className="block italic opacity-60">
                      Creating task…
                    </span>
                  );
                }
                if (part.type === "tool-listTasks" && part.state === "output-available") {
                  return (
                    <span key={i} className="block italic opacity-80">
                      Looked up tasks
                    </span>
                  );
                }
                if (part.type === "tool-listTasks") {
                  return (
                    <span key={i} className="block italic opacity-60">
                      Looking up tasks…
                    </span>
                  );
                }
                if (part.type === "tool-updateTask" && part.state === "output-available") {
                  return (
                    <span key={i} className="block italic opacity-80">
                      Updated task: {part.input.title ?? part.input.taskId}
                    </span>
                  );
                }
                if (part.type === "tool-updateTask") {
                  return (
                    <span key={i} className="block italic opacity-60">
                      Updating task…
                    </span>
                  );
                }
                if (part.type === "tool-completeTask" && part.state === "output-available") {
                  return (
                    <span key={i} className="block italic opacity-80">
                      Completed task
                    </span>
                  );
                }
                if (part.type === "tool-completeTask") {
                  return (
                    <span key={i} className="block italic opacity-60">
                      Completing task…
                    </span>
                  );
                }
                if (part.type === "tool-deleteTask" && part.state === "output-available") {
                  return (
                    <span key={i} className="block italic opacity-80">
                      Deleted task
                    </span>
                  );
                }
                if (part.type === "tool-deleteTask") {
                  return (
                    <span key={i} className="block italic opacity-60">
                      Deleting task…
                    </span>
                  );
                }
                if (part.type === "tool-addSubtask" && part.state === "output-available") {
                  return (
                    <span key={i} className="block italic opacity-80">
                      Added subtask: {part.input.title}
                    </span>
                  );
                }
                if (part.type === "tool-addSubtask") {
                  return (
                    <span key={i} className="block italic opacity-60">
                      Adding subtask…
                    </span>
                  );
                }
                return null;
              })}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-alabaster mt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "ready"}
            placeholder="Ask the assistant…"
            className="flex-1 px-3 py-2 rounded-lg border border-alabaster bg-transparent text-small focus:outline-none focus:ring-1 focus:ring-tuscan"
          />
          <VoiceInputButton onTranscript={handleVoiceTranscript} className="border border-alabaster" />
          <button
            type="submit"
            disabled={status !== "ready" || !input.trim()}
            aria-label="Send"
            className="w-9 h-9 rounded-lg bg-carbon text-white dark:bg-tuscan dark:text-carbon flex items-center justify-center disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </SidePanel>
  );
}
