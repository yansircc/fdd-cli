import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import type { Pitfall } from "../types/index.js";
import { checkGates, formatGateResult } from "./gate.js";
import { generatePitfallId, pitfallFilename } from "./id.js";

/**
 * Create a new pitfall file
 * Returns the path to the created file
 */
export async function createPitfall(
	pitfallsDir: string,
	pitfall: Omit<Pitfall, "id" | "created">,
): Promise<{
	path: string;
	id: string;
	gateResult: ReturnType<typeof checkGates>;
}> {
	// Ensure directory exists
	if (!existsSync(pitfallsDir)) {
		await mkdir(pitfallsDir, { recursive: true });
	}

	// Generate ID
	const id = await generatePitfallId(pitfallsDir);
	const created = new Date().toISOString().split("T")[0];

	const fullPitfall: Pitfall = {
		...pitfall,
		id,
		created,
	};

	// Check gates
	const gateResult = checkGates(fullPitfall);

	if (!gateResult.passed) {
		throw new Error(`Gate check failed:\n${formatGateResult(gateResult)}`);
	}

	// Generate content
	const content = generatePitfallContent(fullPitfall);

	// Write file
	const filename = pitfallFilename(id, pitfall.title);
	const filepath = join(pitfallsDir, filename);
	await writeFile(filepath, content, "utf-8");

	return { path: filepath, id, gateResult };
}

/**
 * Generate pitfall markdown content
 */
function generatePitfallContent(pitfall: Pitfall): string {
	const frontmatter = {
		id: pitfall.id,
		title: pitfall.title,
		severity: pitfall.severity,
		tags: pitfall.tags,
		created: pitfall.created,
		evidence: pitfall.evidence,
		detect: pitfall.detect,
		remedy: pitfall.remedy,
		...(pitfall.related_rule && { related_rule: pitfall.related_rule }),
		verify: pitfall.verify,
		regression: pitfall.regression,
		edge: pitfall.edge,
	};

	const body = `
# Detect（抓现行）

${formatDetectSection(pitfall)}

# Replay（放回放）

${pitfall.evidence.error_snippet || "[Error details]"}

${pitfall.evidence.diff_summary ? `**变更摘要：**\n${pitfall.evidence.diff_summary}` : ""}

# Remedy（给方案）

${formatRemedySection(pitfall)}

# Verify（过安检）

${formatVerifySection(pitfall)}
`.trim();

	return matter.stringify(body, frontmatter);
}

function formatDetectSection(pitfall: Pitfall): string {
	return pitfall.detect
		.map((d, i) => {
			const lines = [`**策略 ${i + 1}** (${d.kind}, strength: ${d.strength})`];
			if (d.tool) lines.push(`- 工具: \`${d.tool}\``);
			if (d.pattern) lines.push(`- 模式: \`${d.pattern}\``);
			if (d.scope) lines.push(`- 范围: ${d.scope.join(", ")}`);
			if (d.exclude) lines.push(`- 排除: ${d.exclude.join(", ")}`);
			if (d.when_changed)
				lines.push(`- 变更触发: ${d.when_changed.join(", ")}`);
			if (d.must_run) lines.push(`- 必须运行: ${d.must_run.join(", ")}`);
			return lines.join("\n");
		})
		.join("\n\n");
}

function formatRemedySection(pitfall: Pitfall): string {
	return pitfall.remedy
		.map((r, i) => {
			const lines = [`**路径 ${i + 1}** (风险: ${r.level})`];
			if (r.action) lines.push(`- 动作: ${r.action}`);
			if (r.steps) {
				lines.push("- 步骤:");
				for (const step of r.steps) {
					lines.push(`  1. ${step}`);
				}
			}
			if (r.doc) lines.push(`- 文档: ${r.doc}`);
			return lines.join("\n");
		})
		.join("\n\n");
}

function formatVerifySection(pitfall: Pitfall): string {
	const lines = [`**验证级别: ${pitfall.verify.level}**`];

	if (pitfall.verify.checks) {
		lines.push("\n检查项:");
		for (const check of pitfall.verify.checks) {
			lines.push(`- [ ] \`${check}\``);
		}
	}

	if (pitfall.verify.fallback) {
		lines.push(`\n**降级方案 (${pitfall.verify.fallback.level}):**`);
		for (const proof of pitfall.verify.fallback.self_proof) {
			lines.push(`- [ ] ${proof}`);
		}
	}

	return lines.join("\n");
}

/**
 * List all pitfalls
 */
export async function listPitfalls(
	pitfallsDir: string,
	filter?: {
		severity?: string;
		tag?: string;
	},
): Promise<Pitfall[]> {
	if (!existsSync(pitfallsDir)) {
		return [];
	}

	const files = await readdir(pitfallsDir);
	const mdFiles = files.filter((f) => f.endsWith(".md") && !f.startsWith("_"));

	const pitfalls: Pitfall[] = [];

	for (const file of mdFiles) {
		const content = await readFile(join(pitfallsDir, file), "utf-8");
		const { data } = matter(content);
		pitfalls.push(data as Pitfall);
	}

	// Apply filters
	let result = pitfalls;

	if (filter?.severity) {
		result = result.filter((p) => p.severity === filter.severity);
	}

	if (filter?.tag) {
		const tag = filter.tag;
		result = result.filter((p) => p.tags?.includes(tag));
	}

	// Sort by ID
	return result.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Read a single pitfall by ID
 */
export async function getPitfallById(
	pitfallsDir: string,
	id: string,
): Promise<Pitfall | null> {
	if (!existsSync(pitfallsDir)) {
		return null;
	}

	const files = await readdir(pitfallsDir);
	const matchingFile = files.find((f) =>
		f.toLowerCase().startsWith(id.toLowerCase()),
	);

	if (!matchingFile) {
		return null;
	}

	const content = await readFile(join(pitfallsDir, matchingFile), "utf-8");
	const { data } = matter(content);
	return data as Pitfall;
}
