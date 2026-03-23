/**
 * Tests for ActivityLog module
 */
import { test } from "node:test";
import assert from "node:assert";
import { ActivityLog } from "../../src/core/activity-log.mjs";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_LOG_PATH = path.join(__dirname, "..", "..", "test-activity.jsonl");

test("ActivityLog - log and read entries", async () => {
	// Setup
	const activityLog = new ActivityLog(TEST_LOG_PATH);

	// Test
	await activityLog.log({
		timestamp: new Date().toISOString(),
		agent: "test-agent",
		action: "Test action",
		status: "success",
		tokens: 100,
		duration: 1000,
	});

	const entries = await activityLog.read();

	assert.strictEqual(entries.length, 1);
	assert.strictEqual(entries[0].agent, "test-agent");
	assert.strictEqual(entries[0].action, "Test action");
	assert.strictEqual(entries[0].status, "success");

	// Cleanup
	await fs.unlink(TEST_LOG_PATH);
});

test("ActivityLog - limit results", async () => {
	// Setup
	const activityLog = new ActivityLog(TEST_LOG_PATH);

	// Add multiple entries
	for (let i = 0; i < 5; i++) {
		await activityLog.log({
			timestamp: new Date().toISOString(),
			agent: "test-agent",
			action: `Action ${i}`,
			status: "success",
		});
	}

	// Test
	const limited = await activityLog.read(3);
	assert.strictEqual(limited.length, 3);

	const all = await activityLog.read();
	assert.strictEqual(all.length, 5);

	// Cleanup
	await fs.unlink(TEST_LOG_PATH);
});

test("ActivityLog - clear log", async () => {
	// Setup
	const activityLog = new ActivityLog(TEST_LOG_PATH);

	await activityLog.log({
		timestamp: new Date().toISOString(),
		agent: "test-agent",
		action: "Test",
		status: "success",
	});

	// Test
	await activityLog.clear();
	const entries = await activityLog.read();

	assert.strictEqual(entries.length, 0);
});
