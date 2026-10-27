import { Router, type IRouter } from "express";
import {
  AskKannadaTutorBody,
  AskKannadaTutorResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function sampleTutorReply(message: string, context?: string) {
  const topic = context?.trim() || message.trim();
  return [
    "Gemini is not connected yet, so this is a sample tutor response.",
    "",
    `For “${topic.slice(0, 180)}”, try starting with a short, polite phrase and speak slowly.`,
    "",
    "ನಮಸ್ಕಾರ (namaskāra) means “hello.”",
    "ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ (dayaviṭṭu sahāya māḍi) means “please help me.”",
    "",
    "Use the phrasebook to hear available pronunciations and practice one phrase at a time.",
  ].join("\n");
}

router.post("/gemini/tutor", async (req, res) => {
  const parsed = AskKannadaTutorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please send a message and choose a level." });
    return;
  }

  const { message, level, context } = parsed.data;
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    res.json(
      AskKannadaTutorResponse.parse({
        answer: sampleTutorReply(message, context),
        source: "sample",
      }),
    );
    return;
  }

  try {
    const prompt = [
      "You are KannadaMitra, a kind, accurate Kannada tutor for people learning practical Kannada.",
      `Learner level: ${level}.`,
      context ? `Practice context: ${context}.` : "",
      "Answer the learner's question in clear English. When teaching Kannada, include Kannada script, simple English transliteration, and meaning. Give one concise example when useful. Be culturally respectful and do not invent uncertain translations. For medical, legal, or emergency situations, help with language only and clearly say you are not giving professional advice.",
      `Learner question: ${message}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.5 },
        }),
        signal: AbortSignal.timeout(25_000),
      },
    );

    if (!response.ok) {
      logger.error(
        { status: response.status },
        "Gemini tutor request failed",
      );
      res.status(503).json({
        error: "The Kannada tutor is temporarily unavailable. Please try again.",
      });
      return;
    }

    const payload: unknown = await response.json();
    const answer = extractGeminiText(payload);
    if (!answer) {
      res.status(503).json({
        error: "The Kannada tutor returned an empty response. Please try again.",
      });
      return;
    }

    res.json(AskKannadaTutorResponse.parse({ answer, source: "gemini" }));
  } catch (error) {
    logger.error({ err: error }, "Gemini tutor request errored");
    res.status(503).json({
      error: "The Kannada tutor is temporarily unavailable. Please try again.",
    });
  }
});

function extractGeminiText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const candidates = (payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  }).candidates;
  const text = candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  return text || null;
}

export default router;
