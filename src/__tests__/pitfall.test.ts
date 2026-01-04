import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPitfallById, listPitfalls } from "../lib/pitfall.js";

describe("listPitfalls", () => {
	const testDir = join(tmpdir(), `fdd-pitfall-test-${Date.now()}`);
	const pitfallsDir = join(testDir, "pitfalls");

	beforeAll(() => {
		mkdirSync(pitfallsDir, { recursive: true });

		// Create test pitfall files
		writeFileSync(
			join(pitfallsDir, "pit-001-test-pitfall.md"),
			`---
id: PIT-001
title: Test pitfall 1
severity: high
tags: [test, example]
created: 2024-01-15
evidence:
  error_snippet: "Error: something went wrong"
trigger:
  - kind: change
    when_changed: ["src/**"]
    strength: strong
replay:
  root_cause: Missing null check
action:
  - level: low
    kind: transform
    action: Add null check
verify:
  level: V0
  checks: ["bun test"]
regression:
  repro: ["step 1"]
  expected: "error"
edge:
  negative_case: ["valid input"]
  expected: "no error"
---

# Test Pitfall 1
`,
		);

		writeFileSync(
			join(pitfallsDir, "pit-002-another-pitfall.md"),
			`---
id: PIT-002
title: Test pitfall 2
severity: medium
tags: [test]
created: 2024-01-16
evidence:
  command: "npm test"
trigger:
  - kind: command
    pattern: npm i
    strength: strong
replay:
  root_cause: Wrong command
action:
  - level: low
    kind: run
    action: Use bun instead
verify:
  level: V2
regression:
  repro: []
  expected: ""
  waiver: true
  waiver_reason: "Cannot reproduce"
edge:
  negative_case: []
  expected: ""
  waiver: true
  waiver_reason: "No edge case"
---

# Test Pitfall 2
`,
		);

		writeFileSync(
			join(pitfallsDir, "pit-003-critical.md"),
			`---
id: PIT-003
title: Critical issue
severity: critical
tags: [security]
created: 2024-01-17
evidence:
  error_snippet: "SQL injection detected"
trigger:
  - kind: rule
    pattern: 'interpolation'
    strength: strong
replay:
  root_cause: String interpolation in SQL
action:
  - level: high
    kind: transform
    action: Use parameterized queries
verify:
  level: V0
  checks: ["bun test"]
regression:
  repro: ["inject malicious input"]
  expected: "blocked"
edge:
  negative_case: ["safe input"]
  expected: "allowed"
---

# Critical Issue
`,
		);

		// Create template file (should be ignored)
		writeFileSync(
			join(pitfallsDir, "_template.md"),
			`---
id: TEMPLATE
title: Template
---
`,
		);
	});

	afterAll(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	describe("basic listing", () => {
		it("should list all pitfalls", async () => {
			const pitfalls = await listPitfalls(pitfallsDir);
			expect(pitfalls.length).toBe(3);
		});

		it("should exclude template files starting with _", async () => {
			const pitfalls = await listPitfalls(pitfallsDir);
			expect(pitfalls.every((p) => !p.id.includes("TEMPLATE"))).toBe(true);
		});

		it("should return empty array for non-existent directory", async () => {
			const pitfalls = await listPitfalls("/nonexistent/path");
			expect(pitfalls).toEqual([]);
		});

		it("should return empty array for empty directory", async () => {
			const emptyDir = join(testDir, "empty");
			mkdirSync(emptyDir, { recursive: true });
			const pitfalls = await listPitfalls(emptyDir);
			expect(pitfalls).toEqual([]);
		});
	});

	describe("sorting", () => {
		it("should sort pitfalls by ID", async () => {
			const pitfalls = await listPitfalls(pitfallsDir);
			expect(pitfalls[0].id).toBe("PIT-001");
			expect(pitfalls[1].id).toBe("PIT-002");
			expect(pitfalls[2].id).toBe("PIT-003");
		});
	});

	describe("filtering by severity", () => {
		it("should filter by high severity", async () => {
			const pitfalls = await listPitfalls(pitfallsDir, { severity: "high" });
			expect(pitfalls.length).toBe(1);
			expect(pitfalls[0].id).toBe("PIT-001");
		});

		it("should filter by critical severity", async () => {
			const pitfalls = await listPitfalls(pitfallsDir, {
				severity: "critical",
			});
			expect(pitfalls.length).toBe(1);
			expect(pitfalls[0].id).toBe("PIT-003");
		});

		it("should return empty for non-matching severity", async () => {
			const pitfalls = await listPitfalls(pitfallsDir, { severity: "low" });
			expect(pitfalls.length).toBe(0);
		});
	});

	describe("filtering by tag", () => {
		it("should filter by tag", async () => {
			const pitfalls = await listPitfalls(pitfallsDir, { tag: "test" });
			expect(pitfalls.length).toBe(2);
		});

		it("should filter by specific tag", async () => {
			const pitfalls = await listPitfalls(pitfallsDir, { tag: "security" });
			expect(pitfalls.length).toBe(1);
			expect(pitfalls[0].id).toBe("PIT-003");
		});

		it("should return empty for non-matching tag", async () => {
			const pitfalls = await listPitfalls(pitfallsDir, { tag: "nonexistent" });
			expect(pitfalls.length).toBe(0);
		});
	});

	describe("field parsing", () => {
		it("should parse title correctly", async () => {
			const pitfalls = await listPitfalls(pitfallsDir);
			expect(pitfalls[0].title).toBe("Test pitfall 1");
		});

		it("should parse severity correctly", async () => {
			const pitfalls = await listPitfalls(pitfallsDir);
			expect(pitfalls[0].severity).toBe("high");
		});

		it("should parse tags correctly", async () => {
			const pitfalls = await listPitfalls(pitfallsDir);
			expect(pitfalls[0].tags).toEqual(["test", "example"]);
		});

		it("should parse date as string", async () => {
			const pitfalls = await listPitfalls(pitfallsDir);
			expect(typeof pitfalls[0].created).toBe("string");
			expect(pitfalls[0].created).toBe("2024-01-15");
		});

		it("should parse evidence correctly", async () => {
			const pitfalls = await listPitfalls(pitfallsDir);
			expect(pitfalls[0].evidence?.error_snippet).toBe(
				"Error: something went wrong",
			);
		});

		it("should parse trigger correctly", async () => {
			const pitfalls = await listPitfalls(pitfallsDir);
			expect(pitfalls[0].trigger[0].kind).toBe("change");
			expect(pitfalls[0].trigger[0].when_changed).toEqual(["src/**"]);
		});
	});
});

describe("getPitfallById", () => {
	const testDir = join(tmpdir(), `fdd-pitfall-getbyid-${Date.now()}`);
	const pitfallsDir = join(testDir, "pitfalls");

	beforeAll(() => {
		mkdirSync(pitfallsDir, { recursive: true });

		writeFileSync(
			join(pitfallsDir, "pit-001-test.md"),
			`---
id: PIT-001
title: Test pitfall
severity: high
tags: []
created: 2024-01-15
evidence:
  error_snippet: "Error"
trigger:
  - kind: rule
    pattern: error
    strength: strong
replay:
  root_cause: Root cause
action:
  - level: low
    kind: transform
    action: Fix it
verify:
  level: V2
regression:
  repro: ["step"]
  expected: "error"
edge:
  negative_case: ["valid"]
  expected: "ok"
---
`,
		);
	});

	afterAll(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	it("should find pitfall by exact ID", async () => {
		const pitfall = await getPitfallById(pitfallsDir, "PIT-001");
		expect(pitfall).not.toBeNull();
		expect(pitfall?.id).toBe("PIT-001");
	});

	it("should find pitfall by lowercase ID", async () => {
		const pitfall = await getPitfallById(pitfallsDir, "pit-001");
		expect(pitfall).not.toBeNull();
		expect(pitfall?.id).toBe("PIT-001");
	});

	it("should return null for non-existent ID", async () => {
		const pitfall = await getPitfallById(pitfallsDir, "PIT-999");
		expect(pitfall).toBeNull();
	});

	it("should return null for non-existent directory", async () => {
		const pitfall = await getPitfallById("/nonexistent/path", "PIT-001");
		expect(pitfall).toBeNull();
	});

	it("should return complete pitfall object", async () => {
		const pitfall = await getPitfallById(pitfallsDir, "PIT-001");
		expect(pitfall?.title).toBe("Test pitfall");
		expect(pitfall?.severity).toBe("high");
		expect(pitfall?.evidence?.error_snippet).toBe("Error");
	});
});
