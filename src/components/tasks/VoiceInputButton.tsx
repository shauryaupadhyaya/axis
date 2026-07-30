"use client";

import { Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

export function VoiceInputButton({
  onTranscript,
  className = "",
}: {
  onTranscript: (text: string) => void;
  className?: string;
}) {
  const { supported, listening, start, stop } = useVoiceInput({
    onFinalResult: onTranscript,
  });

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title="Voice input isn't supported in this browser"
        aria-label="Voice input unavailable"
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-graphite/40 cursor-not-allowed shrink-0 ${className}`}
      >
        <MicOff size={16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      aria-pressed={listening}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-fast shrink-0 ${
        listening ? "bg-danger text-white animate-pulse" : "text-graphite hover:bg-bg"
      } ${className}`}
    >
      <Mic size={16} />
    </button>
  );
}
