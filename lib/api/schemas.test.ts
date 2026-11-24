import { describe, expect, it } from "vitest";
import {
  MAX_FILE_CHARS,
  completeBody,
  enrollBody,
  exerciseBody,
} from "./schemas";

describe("enrollBody", () => {
  it("accepts a numeric or numeric-string course id", () => {
    expect(enrollBody.safeParse({ courseId: 4 }).success).toBe(true);
    expect(enrollBody.safeParse({ courseId: "4" }).success).toBe(true);
  });

  it("rejects missing, zero, negative, fractional and text ids", () => {
    for (const courseId of [undefined, 0, -1, 1.5, "abc", null]) {
      expect(enrollBody.safeParse({ courseId }).success).toBe(false);
    }
  });
});

describe("exerciseBody", () => {
  it("needs a slug string", () => {
    expect(exerciseBody.safeParse({ courseId: 4, chapterId: 1, exerciseId: "why-hooks-exist" }).success).toBe(true);
    expect(exerciseBody.safeParse({ courseId: 4, chapterId: 1, exerciseId: "" }).success).toBe(false);
  });
});

describe("completeBody", () => {
  it("accepts numeric ids and ignores extra fields such as xpEarned", () => {
    const result = completeBody.safeParse({ courseId: 4, chapterId: 1, exerciseId: 2, xpEarned: 999999 });
    expect(result.success).toBe(true);
    expect(result.success && "xpEarned" in result.data).toBe(false);
  });

  it("accepts an optional files map", () => {
    const withFiles = completeBody.safeParse({
      courseId: 4,
      chapterId: 1,
      exerciseId: 1,
      files: { "/App.jsx": "console.log(1)" },
    });
    expect(withFiles.success).toBe(true);
  });

  it("rejects a non-numeric exercise id", () => {
    expect(completeBody.safeParse({ courseId: 4, chapterId: 1, exerciseId: "slug" }).success).toBe(false);
  });
});

describe("completeBody files", () => {
  const base = { courseId: 4, chapterId: 1, exerciseId: 1 };

  it("accepts submitted files", () => {
    expect(completeBody.safeParse({ ...base, files: { "/App.jsx": "code" } }).success).toBe(true);
  });

  it("rejects a file that is too long", () => {
    const files = { "/App.jsx": "x".repeat(MAX_FILE_CHARS + 1) };
    expect(completeBody.safeParse({ ...base, files }).success).toBe(false);
  });
});
