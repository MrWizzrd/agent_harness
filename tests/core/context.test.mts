/**
 * Tests for ContextLoader module
 */
import { test } from "node:test";
import assert from "node:assert";
import { ContextLoader } from "../../src/core/context.mjs";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_CONTEXT_DIR = path.join(__dirname, "..", "..", "test-context");

test("ContextLoader - load context files", async () => {
	// Setup
	await fs.mkdir(TEST_CONTEXT_DIR, { recursive: true });
	await fs.writeFile(
		path.join(TEST_CONTEXT_DIR, "SOUL.md"),
		"You are a helpful agent",
		"utf-8"
	);
	await fs.writeFile(
		path.join(TEST_CONTEXT_DIR, "TOOLS.md"),
		"Available tools: read, write",
		"utf-8"
	);
	await fs.writeFile(
		path.join(TEST_CONTEXT_DIR, "MEMORY.md"),
		"Remember: always be helpful",
		"utf-8"
	);

	const loader = new ContextLoader(TEST_CONTEXT_DIR);

	// Test
	const context = await loader.load();

	assert.strictEqual(context.soul, "You are a helpful agent");
	assert.strictEqual(context.tools, "Available tools: read, write");
	assert.strictEqual(context.memory, "Remember: always be helpful");
	assert.ok(context.systemPrompt.includes("You are a helpful agent"));
	assert.ok(context.systemPrompt.includes("Available tools: read, write"));

	// Cleanup
	await fs.rm(TEST_CONTEXT_DIR, { recursive: true, force: true });
});

test("ContextLoader - handle missing files", async () => {
	// Setup
	await fs.mkdir(TEST_CONTEXT_DIR, { recursive: true });

	const loader = new ContextLoader(TEST_CONTEXT_DIR);

	// Test
	const context = await loader.load();

	assert.strictEqual(context.soul, "");
	assert.strictEqual(context.tools, "");
	assert.strictEqual(context.memory, "");

	// Cleanup
	await fs.rm(TEST_CONTEXT_DIR, { recursive: true, force: true });
});

test("ContextLoader - save context files", async () => {
	// Setup
	await fs.mkdir(TEST_CONTEXT_DIR, { recursive: true });

	const loader = new ContextLoader(TEST_CONTEXT_DIR);

	// Test
	await loader.save({
		soul: "New soul content",
		tools: "New tools content",
	});

	const soulContent = await fs.readFile(
		path.join(TEST_CONTEXT_DIR, "SOUL.md"),
		"utf-8"
	);
	const toolsContent = await fs.readFile(
		path.join(TEST_CONTEXT_DIR, "TOOLS.md"),
		"utf-8"
	);

	assert.strictEqual(soulContent, "New soul content");
	assert.strictEqual(toolsContent, "New tools content");

	// Cleanup
	await fs.rm(TEST_CONTEXT_DIR, { recursive: true, force: true });
});
