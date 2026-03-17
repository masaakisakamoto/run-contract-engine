#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function nowIsoWithOffset() {
  const d = new Date();
  const tz = -d.getTimezoneOffset();
  const sign = tz >= 0 ? "+" : "-";
  const hh = String(Math.floor(Math.abs(tz) / 60)).padStart(2, "0");
  const mm = String(Math.abs(tz) % 60).padStart(2, "0");

  const yyyy = d.getFullYear();
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mon}-${day}T${h}:${m}:${s}${sign}${hh}:${mm}`;
}

function makeRunId(project) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}${mon}${day}-${h}${m}${s}-${project}`;
}

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function main() {
  const taskPathArg = getArg("--task");
  const profile = getArg("--profile") ?? "default";
  const project = getArg("--project") ?? "demo";
  const outDirArg = getArg("--out-dir") ?? "examples/generated-runs";

  if (!taskPathArg) {
    console.error("Usage: node runtime/run-generator.js --task <task.json> [--profile <name>] [--project <name>] [--out-dir <dir>]");
    process.exit(1);
  }

  const taskPath = path.resolve(taskPathArg);
  const outDir = path.resolve(outDirArg);
  const task = await readJson(taskPath);
  const taskId = task.taskId ?? task.id ?? null;

  const runId = makeRunId(project);
  const runDir = path.join(outDir, runId);
  const runFile = path.join(runDir, "run.json");

  await fs.mkdir(runDir, { recursive: true });

  const run = {
    runId,
    taskId,
    project,
    profile,
    createdAt: nowIsoWithOffset(),
    status: "pending",
    agents: ["planner"],
    artifacts: [],
    validation: {
      run: "pending"
    },
    notes: `Run generated from task: ${taskId ?? "unknown"}`
  };

  await writeJson(runFile, run);
  console.log(runFile);
}

main().catch((error) => {
  console.error("[ERROR] failed to generate run");
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
