import { z } from "zod";

const id = z.coerce.number().int().positive();

export const MAX_FILE_CHARS = 8000;

export const enrollBody = z.object({ courseId: id });

// exerciseId is the exercise slug from the URL
export const exerciseBody = z.object({
  courseId: id,
  chapterId: id,
  exerciseId: z.string().min(1).max(200),
});

// exerciseId is the 1-based position of the exercise inside its chapter
export const completeBody = z.object({
  courseId: id,
  chapterId: id,
  exerciseId: id,
  files: z
    .record(z.string().min(1).max(200), z.string().max(MAX_FILE_CHARS))
    .optional(),
});
