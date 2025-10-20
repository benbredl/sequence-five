// functions/config.js

// Model used for prompt enhancement (Gemini text)
export const ENHANCER_MODEL = "gemini-2.5-flash";

// Default enhancer instruction
export const DEFAULT_SYSTEM_PROMPT =
  "You are a world-class prompt engineer for text-to-image models.\n" +
  "Rewrite the user's prompt with:\n" +
  "- Specific subject, scene, mood, era, setting, materials, composition, and lighting\n" +
  "- camera: arri alexa, 35mm and shallow DOF for camera description\n" +
  "- Style: cinematic, analog film, ultra realistic, highly detailed\n" +
  "Constraints:\n" +
  "- Keep under 60 words. Avoid numbered lists.\n" +
  "Return only the enhanced prompt text.";

// Concurrency cap for UI
export const MAX_PARALLEL_GENERATIONS = Number(process.env.MAX_PARALLEL_GENERATIONS || 5);
