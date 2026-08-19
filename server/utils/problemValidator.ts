import fs from "fs";
import path from "path";

let validIds: Set<string> | null = null;

export const loadProblemIds = () => {
  if (validIds) return;
  try {
    const filePath = path.resolve(process.cwd(), "server/data/a2z-ids.json");
    const ids = JSON.parse(fs.readFileSync(filePath, "utf-8")) as string[];
    validIds = new Set(ids);
  } catch (error) {
    console.error("Failed to load a2z-ids.json. Backend validation will fail.");
    validIds = new Set();
  }
};

export const isValidProblemId = (problemId: string): boolean => {
  if (!validIds) loadProblemIds();
  return validIds!.has(problemId);
};
