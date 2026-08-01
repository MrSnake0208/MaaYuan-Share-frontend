import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const avatarsDir = path.join(repoRoot, "public/assets/operator-avatars");
const operatorsPath = path.join(repoRoot, "src/models/generated/operators.json");
const outputDirs = ["webp32", "webp96"];
const defaultQuality = 80;
let operators = [];

function toWslPath(input) {
  const normalized = input.replace(/^"(.*)"$/, "$1");
  const match = normalized.match(/^([A-Za-z]):[\\/](.*)$/);

  if (!match) {
    return normalized;
  }

  return path.posix.join("/mnt", match[1].toLowerCase(), match[2].replaceAll("\\", "/"));
}

function getOperatorNameFromFile(filePath) {
  return path
    .basename(filePath, path.extname(filePath))
    .replace(/^小头像[-_]/, "")
    .replace(/^头像[-_]/, "");
}

function findOperator(filePath) {
  const name = getOperatorNameFromFile(filePath);

  return operators.find((operator) => operator.id === name || operator.name === name);
}

function getQuality() {
  const qualityArg = process.argv.find((arg) => arg.startsWith("--quality="));

  if (!qualityArg) {
    return defaultQuality;
  }

  const quality = Number(qualityArg.split("=")[1]);

  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error("--quality must be an integer from 1 to 100");
  }

  return quality;
}

async function convertOne(input, quality) {
  const sourcePath = toWslPath(input);
  const operator = findOperator(sourcePath);

  if (!operator) {
    throw new Error(`${input}: cannot match operator from file name`);
  }

  const metadata = await sharp(sourcePath).metadata();

  if (metadata.width !== 228 || metadata.height !== 366) {
    console.warn(
      `${operator.name}: source is ${metadata.width}x${metadata.height}, output will keep the same pixel size.`,
    );
  }

  for (const dir of outputDirs) {
    const outputDir = path.join(avatarsDir, dir);
    const outputPath = path.join(outputDir, `${operator.id}.webp`);

    await mkdir(outputDir, { recursive: true });
    await sharp(sourcePath).webp({ quality, effort: 6 }).toFile(outputPath);

    const outputMetadata = await sharp(outputPath).metadata();
    console.log(`${operator.name}: ${path.relative(repoRoot, outputPath)} ${outputMetadata.width}x${outputMetadata.height}`);
  }
}

async function main() {
  const inputs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const quality = getQuality();
  const operatorsData = JSON.parse(await readFile(operatorsPath, "utf8"));
  operators = operatorsData.OPERATORS;

  if (inputs.length === 0) {
    console.error("Usage: node tools/convert-operator-avatars.mjs [--quality=80] <png...>");
    process.exit(1);
  }

  for (const input of inputs) {
    await convertOne(input, quality);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
