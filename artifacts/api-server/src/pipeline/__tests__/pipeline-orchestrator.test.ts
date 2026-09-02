process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/test_db";
import test from "node:test";
import assert from "node:assert/strict";
import { ProductionRequestParser } from "../request-parser";
import { PipelineOrchestrator } from "../orchestrator";

test("ProductionRequestParser - parses complex natural language command accurately", () => {
  const parsed = ProductionRequestParser.parse(
    "Create an 8-minute video about black holes in a mysterious documentary style and schedule it for 7 PM"
  );

  assert.equal(parsed.topic, "black holes");
  assert.equal(parsed.durationSeconds, 480);
  assert.equal(parsed.format, "LONG_FORM");
  assert.equal(parsed.tone, "mysterious and suspenseful");
  assert.equal(parsed.style, "investigative documentary");
  assert.equal(parsed.channel, "CurioSphere");
  assert.equal(parsed.publishAt, "7 PM");
  assert.equal(parsed.publishMode, "PRIVATE");
});

test("ProductionRequestParser - applies CurioSphere defaults when omitted", () => {
  const parsed = ProductionRequestParser.parse("Make today's video.");

  assert.equal(parsed.topic, undefined);
  assert.equal(parsed.durationSeconds, 180);
  assert.equal(parsed.channel, "CurioSphere");
  assert.equal(parsed.publishMode, "PRIVATE");
});

test("PipelineOrchestrator - executes complete 10-step video production pipeline", async () => {
  const orchestrator = new PipelineOrchestrator();
  const progressLogs: string[] = [];

  const result = await orchestrator.execute(
    "Create an 3-minute video about the Mariana Trench and upload privately",
    (step, total, msg) => {
      progressLogs.push(`[${step}/${total}] ${msg}`);
    }
  );

  assert.equal(result.status, "COMPLETED");
  assert.equal(result.topic, "The Mariana Trench");
  assert.equal(progressLogs.length, 10);
  assert.ok(progressLogs[0].includes("[1/10]"));
  assert.ok(progressLogs[9].includes("[10/10]"));

  // Check all stage artifacts exist
  assert.ok(result.stageResults.research);
  assert.ok(result.stageResults.script);
  assert.ok(result.stageResults.voice);
  assert.ok(result.stageResults.visuals);
  assert.ok(result.stageResults.subtitles);
  assert.ok(result.stageResults.render);
  assert.ok(result.stageResults.thumbnail);
  assert.ok(result.stageResults.qa?.passed);
  assert.ok(result.stageResults.youtube?.videoId);

  // Check stage timestamps
  assert.ok(result.stageTimestamps["step_1"]);
  assert.ok(result.stageTimestamps["step_10"]);
});
