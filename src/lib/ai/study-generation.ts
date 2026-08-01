"use server";

import { generateObject } from "ai";
import { z } from "zod";

const MODEL = "anthropic/claude-sonnet-5";

const chapterListSchema = z.object({
  chapters: z.array(z.string()).describe("Ordered list of chapter/topic names extracted or inferred from the syllabus."),
});

/** Analyzes pasted syllabus text and proposes an ordered chapter list. Purely additive — the caller always gets a plain, fully-editable string array back, nothing is written to the database here. */
export async function generateChaptersFromSyllabusText(subjectName: string, syllabusText: string): Promise<string[]> {
  const trimmed = syllabusText.trim();
  if (!trimmed) return [];

  const { object } = await generateObject({
    model: MODEL,
    schema: chapterListSchema,
    prompt: [
      `You are helping a student break a "${subjectName}" syllabus into a clean, ordered list of chapters/topics.`,
      "Read the syllabus text below and produce a concise, ordered list of chapter names (not full sentences — short titles, e.g. \"Atomic Structure\", \"Mole Concept\").",
      "Merge near-duplicate topics, drop administrative/grading text, and keep the list in the order the syllabus presents them.",
      "",
      "Syllabus text:",
      trimmed.slice(0, 12000),
    ].join("\n"),
  });
  return object.chapters.filter((c) => c.trim().length > 0);
}

/** Same as above, but the syllabus is a PDF/image file — sent directly to the model (no separate text-extraction step needed). */
export async function generateChaptersFromSyllabusFile(
  subjectName: string,
  fileBase64: string,
  mediaType: string
): Promise<string[]> {
  const { object } = await generateObject({
    model: MODEL,
    schema: chapterListSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are helping a student break a "${subjectName}" syllabus (attached) into a clean, ordered list of chapters/topics. Produce concise chapter titles (not full sentences), in the order the syllabus presents them, merging near-duplicates and dropping administrative/grading text.`,
          },
          {
            type: "file",
            data: fileBase64,
            mediaType,
          },
        ],
      },
    ],
  });
  return object.chapters.filter((c) => c.trim().length > 0);
}
