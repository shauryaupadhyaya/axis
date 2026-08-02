"use server";

import { generateObject } from "ai";
import { z } from "zod";

const MODEL = "anthropic/claude-sonnet-5";

export interface GenerationSource {
  text?: string;
  fileBase64?: string;
  fileMediaType?: string;
}

/** Builds the AI SDK message content parts for either pasted text or an uploaded file — shared by every "generate X from source" action below. */
function sourceContentParts(source: GenerationSource, instruction: string) {
  const parts: Array<{ type: "text"; text: string } | { type: "file"; data: string; mediaType: string }> = [
    { type: "text", text: instruction },
  ];
  if (source.fileBase64 && source.fileMediaType) {
    parts.push({ type: "file", data: source.fileBase64, mediaType: source.fileMediaType });
  } else if (source.text?.trim()) {
    parts.push({ type: "text", text: `Source material:\n${source.text.trim().slice(0, 16000)}` });
  }
  return parts;
}

const noteSchema = z.object({
  title: z.string(),
  contentHtml: z
    .string()
    .describe(
      "The note body as clean HTML using only these tags: h2, h3, p, ul, ol, li, strong, em, blockquote. No inline styles, no scripts, no other tags."
    ),
});

export type NoteGenerationMode = "full" | "summary" | "revision";

const MODE_INSTRUCTIONS: Record<NoteGenerationMode, string> = {
  full: "Produce structured, comprehensive study notes: headings for each major topic, key concepts as bullet points, and important points/definitions called out clearly.",
  summary: "Produce a concise summary note: just the essential ideas in a short, tightly-written form — a few headings at most, brief bullet points.",
  revision: "Produce a quick-revision note optimized for last-minute review: short bullet points of facts/formulas/definitions, grouped under minimal headings, no long paragraphs.",
};

/** Generates a structured note (title + HTML body) from pasted text or an uploaded file (PDF/image). */
export async function generateNoteFromSource(
  subjectName: string,
  chapterName: string,
  mode: NoteGenerationMode,
  source: GenerationSource
): Promise<{ title: string; contentHtml: string }> {
  const { object } = await generateObject({
    model: MODEL,
    schema: noteSchema,
    messages: [
      {
        role: "user",
        content: sourceContentParts(
          source,
          `You are creating study notes for a student on "${chapterName}" (subject: "${subjectName}"). ${MODE_INSTRUCTIONS[mode]} Give the note a short, specific title.`
        ),
      },
    ],
  });
  return object;
}

const cardListSchema = z.object({
  cards: z.array(z.object({ front: z.string(), back: z.string() })),
});

/** Generates flashcards (front/back pairs) from pasted text or an uploaded file. */
export async function generateFlashcardsFromSource(
  subjectName: string,
  chapterName: string,
  source: GenerationSource,
  count = 12
): Promise<Array<{ front: string; back: string }>> {
  const { object } = await generateObject({
    model: MODEL,
    schema: cardListSchema,
    messages: [
      {
        role: "user",
        content: sourceContentParts(
          source,
          `Create up to ${count} flashcards for a student studying "${chapterName}" (subject: "${subjectName}"). Each card's "front" is a short question or term, and "back" is a concise answer/definition. Cover the most important, testable concepts.`
        ),
      },
    ],
  });
  return object.cards;
}

/** Generates quiz-style question/answer pairs — stored the same way as flashcards (question=front, answer=back) since there's no separate quiz-taking flow yet. */
export async function generateQuizFromSource(
  subjectName: string,
  chapterName: string,
  source: GenerationSource,
  count = 8
): Promise<Array<{ front: string; back: string }>> {
  const { object } = await generateObject({
    model: MODEL,
    schema: cardListSchema,
    messages: [
      {
        role: "user",
        content: sourceContentParts(
          source,
          `Write ${count} quiz questions (with answers) testing understanding of "${chapterName}" (subject: "${subjectName}"). Mix recall and applied questions. Put the question in "front" and the full answer in "back".`
        ),
      },
    ],
  });
  return object.cards;
}

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
