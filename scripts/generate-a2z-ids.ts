import fs from "fs";
import path from "path";
import { a2zSheet } from "../src/data/a2z-sheet";

const ids: string[] = [];

a2zSheet.forEach((step) => {
  step.topics.forEach((topic) => {
    topic.problems.forEach((problem) => {
      ids.push(problem.id);
    });
  });
});

const outputPath = path.resolve(process.cwd(), "server/data/a2z-ids.json");
fs.writeFileSync(outputPath, JSON.stringify(ids, null, 2));

console.log(`Successfully generated ${ids.length} problem IDs to ${outputPath}`);
