import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { createExtractor } from "../lib/ai/extractor";
import { processEntries } from "../lib/ai/postprocess";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

interface GroundTruthEntry {
  customerName: string;
  amount: number;
  direction: "credit_given" | "payment_received";
}

interface EvaluationResult {
  file: string;
  totalEntries: number;
  nameAccuracy: number;
  amountAccuracy: number;
  directionAccuracy: number;
  reviewPercentage: number;
}

async function runEval() {
  console.log("🚀 Starting AI Extraction Evaluation...");
  const samplesDir = path.join(__dirname, "samples");
  const groundTruthPath = path.join(samplesDir, "ground_truth.json");

  if (!fs.existsSync(groundTruthPath)) {
    console.error("❌ ground_truth.json not found.");
    process.exit(1);
  }

  const groundTruth: Record<string, GroundTruthEntry[]> = JSON.parse(
    fs.readFileSync(groundTruthPath, "utf-8")
  );

  const extractor = createExtractor();
  const results: EvaluationResult[] = [];

  for (const [filename, expectedEntries] of Object.entries(groundTruth)) {
    const filePath = path.join(samplesDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Warning: Image ${filename} not found, skipping.`);
      continue;
    }

    console.log(`\nEvaluating ${filename}...`);
    const base64Image = fs.readFileSync(filePath).toString("base64");
    const mimeType = "image/jpeg"; // Assume JPEG for eval

    try {
      const extractResult = await extractor.extract(base64Image, mimeType);
      
      // Process extracted entries
      const processed = processEntries(extractResult.entries);
      
      // Compare with ground truth (simplistic matching by order)
      let nameCorrect = 0;
      let amountCorrect = 0;
      let directionCorrect = 0;
      let reviewCount = 0;

      const totalExpected = expectedEntries.length;

      // Only check up to the length of expected
      for (let i = 0; i < totalExpected; i++) {
        const expected = expectedEntries[i];
        const actual = processed[i];

        if (!actual) continue;

        if (actual.needsReview) reviewCount++;

        // Fuzzy match for name accuracy (basic substring/lowercase check for eval)
        if (actual.customerName.toLowerCase().includes(expected.customerName.toLowerCase()) || 
            expected.customerName.toLowerCase().includes(actual.customerName.toLowerCase())) {
          nameCorrect++;
        }

        if (actual.amount === expected.amount) {
          amountCorrect++;
        }

        if (actual.direction === expected.direction) {
          directionCorrect++;
        }
      }

      results.push({
        file: filename,
        totalEntries: totalExpected,
        nameAccuracy: (nameCorrect / totalExpected) * 100,
        amountAccuracy: (amountCorrect / totalExpected) * 100,
        directionAccuracy: (directionCorrect / totalExpected) * 100,
        reviewPercentage: processed.length > 0 ? (reviewCount / processed.length) * 100 : 0,
      });

      console.log(`  Name Accuracy: ${(nameCorrect / totalExpected) * 100}%`);
      console.log(`  Amount Accuracy: ${(amountCorrect / totalExpected) * 100}%`);
      console.log(`  Direction Accuracy: ${(directionCorrect / totalExpected) * 100}%`);
      
    } catch (err) {
      console.error(`❌ Failed to extract ${filename}:`, err);
    }
  }

  // Generate Markdown Report
  generateMarkdownReport(results);
}

function generateMarkdownReport(results: EvaluationResult[]) {
  if (results.length === 0) return;

  const docsDir = path.join(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }

  let totalName = 0;
  let totalAmount = 0;
  let totalDirection = 0;
  let totalReview = 0;

  let md = `# AI Extraction Evaluation Results\n\n`;
  md += `*Generated automatically by \`npm run eval\`*\n\n`;
  md += `| File | Total Entries | Name Accuracy | Amount Accuracy | Direction Accuracy | Flagged for Review |\n`;
  md += `|------|--------------|---------------|-----------------|--------------------|-------------------|\n`;

  for (const res of results) {
    totalName += res.nameAccuracy;
    totalAmount += res.amountAccuracy;
    totalDirection += res.directionAccuracy;
    totalReview += res.reviewPercentage;

    md += `| ${res.file} | ${res.totalEntries} | ${res.nameAccuracy.toFixed(1)}% | ${res.amountAccuracy.toFixed(1)}% | ${res.directionAccuracy.toFixed(1)}% | ${res.reviewPercentage.toFixed(1)}% |\n`;
  }

  const avgName = (totalName / results.length).toFixed(1);
  const avgAmount = (totalAmount / results.length).toFixed(1);
  const avgDirection = (totalDirection / results.length).toFixed(1);
  const avgReview = (totalReview / results.length).toFixed(1);

  md += `| **Average** | - | **${avgName}%** | **${avgAmount}%** | **${avgDirection}%** | **${avgReview}%** |\n\n`;

  md += `## Methodology\n`;
  md += `The evaluation compares the output of the \`GeminiExtractor\` against hand-labeled ground-truth JSON files. Accuracies are measured per field.\n`;

  const reportPath = path.join(docsDir, "EVALUATION.md");
  fs.writeFileSync(reportPath, md, "utf-8");
  console.log(`\n✅ Saved evaluation report to ${reportPath}`);
}

runEval().catch(console.error);
