/**
 * Example runner - executes all examples in sequence
 */

const { spawn } = require("child_process");
const { join } = require("path");

const examples = [
  "basic-usage.js",
  "performance-comparison.js",
  "library-integration.js",
  "edge-cases.js",
];

async function runExample(filename) {
  return new Promise((resolve, reject) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Running: ${filename}`);
    console.log(`${"=".repeat(60)}`);

    const child = spawn("node", [join(__dirname, filename)], {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${filename} exited with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

async function runAllExamples() {
  console.log("Safe-Tag Examples Runner");
  console.log("========================");

  for (const example of examples) {
    try {
      await runExample(example);
    } catch (error) {
      console.error(`Error running ${example}:`, error.message);
      process.exit(1);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("All examples completed successfully!");
  console.log(`${"=".repeat(60)}`);
}

runAllExamples().catch(console.error);
