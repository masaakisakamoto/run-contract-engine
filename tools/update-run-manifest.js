#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { canTransition } from "../runtime/run-state-machine.js";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--run-file") {
      args.runFile = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--patch") {
      args.patch = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return args;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(target, source) {
  const out = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = out[key];

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      out[key] = deepMerge(targetValue, sourceValue);
    } else {
      out[key] = sourceValue;
    }
  }

  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function fail(message, extra = null) {
  console.error(message);
  if (extra) {
    console.error(extra);
  }
  process.exit(1);
}

const { runFile, patch } = parseArgs(process.argv);

if (!runFile) {
  fail("Missing required argument: --run-file");
}

if (!patch) {
  fail("Missing required argument: --patch");
}

const repoRoot = process.cwd();
const runJsonPath = path.resolve(runFile);
const runSchemaPath = path.join(repoRoot, "schema", "run.schema.json");

if (!fs.existsSync(runJsonPath)) {
  fail(`Run file not found: ${runJsonPath}`);
}

if (!fs.existsSync(runSchemaPath)) {
  fail(`Schema not found: ${runSchemaPath}`);
}

let parsedPatch;
try {
  parsedPatch = JSON.parse(patch);
} catch (error) {
  fail("Failed to parse --patch as JSON", error);
}

const existing = readJson(runJsonPath);

const currentStatus = existing.status;
const nextStatus = parsedPatch.status;

if (
  typeof currentStatus === "string" &&
  typeof nextStatus === "string" &&
  currentStatus !== nextStatus &&
  !canTransition(currentStatus, nextStatus)
) {
  fail(`Invalid run state transition: ${currentStatus} -> ${nextStatus}`);
}

const merged = deepMerge(existing, parsedPatch);
merged.updatedAt = new Date().toISOString();

const schema = readJson(runSchemaPath);
const ajv = new Ajv2020({
  allErrors: true,
  strict: false
});
addFormats(ajv);

const validate = ajv.compile(schema);
const valid = validate(merged);

if (!valid) {
  fail("run manifest validation failed", JSON.stringify(validate.errors, null, 2));
}

writeJson(runJsonPath, merged);
console.log(`Updated manifest: ${runJsonPath}`);
