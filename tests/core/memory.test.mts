/**
 * Tests for Memory module
 */
import { test } from "node:test";
import assert from "node:assert";
import { Memory } from "../../src/core/memory.mjs";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_MEMORY_DIR = path.join(__dirname, "..", "..", "test-memory");

test("Memory - save and read today's note", async () => {
	// Setup
	await fs.mkdir(TEST_MEMORY_DIR, { recursive: true });
	const memory = new Memory(TEST_MEMORY_DIR);

	// Test
	await memory.save("Test memory entry");
	const content = await memory.readToday();

	assert.ok(content.includes("Test memory entry"));

	// Cleanup
	await fs.rm(TEST_MEMORY_DIR, { recursive: true, force: true });
});

test("Memory - search returns results", async () => {
	// Setup
	await fs.mkdir(TEST_MEMORY_DIR, { recursive: true });
	const memory = new Memory(TEST_MEMORY_DIR);

	await memory.save("Important decision about TypeBox");
	await memory.save("Another note about testing");

	// Test
	const results = await memory.search("TypeBox");

	assert.ok(results.length > 0);
	assert.ok(results[0].content.includes("TypeBox"));

	// Cleanup
	await fs.rm(TEST_MEMORY_DIR, { recursive: true, force: true });
});

test("Memory - list returns sorted dates", async () => {
	// Setup
	await fs.mkdir(TEST_MEMORY_DIR, { recursive: true });
	const memory = new Memory(TEST_MEMORY_DIR);

	await memory.save("Entry 1");

	// Test
	const dates = await memory.list();

	assert.ok(dates.length > 0);
	assert.ok(dates[0].match(/^\d{4}-\d{2}-\d{2}$/));

	// Cleanup
	await fs.rm(TEST_MEMORY_DIR, { recursive: true, force: true });
});
