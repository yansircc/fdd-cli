import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import type { Pitfall } from "../types/index.js";
import { checkGates, formatGateResult } from "./gate.js";
import { generatePitfallId, pitfallFilename } from "./id.js";
import type { PitfallInput } from "./schema.js";

/**
 * Create a new pitfall file
 * Returns the path to the created file
 */
export async function createPitfall(
	pitfallsDir: string,
	pitfall: PitfallInput,
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

	const fullPitfall = {
		...pitfall,
		id,
		created,
	} as Pitfall;

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
	const frontmatter: Record<string, unknown> = {
		id: pitfall.id,
		title: pitfall.title,
		origin: pitfall.origin,
		scope: pitfall.scope,
		severity: pitfall.severity,
		tags: pitfall.tags,
		created: pitfall.created,
		trigger: pitfall.trigger,
		replay: pitfall.replay,
		action: pitfall.action,
		verify: pitfall.verify,
	};

	// 可选字段（演绎 Pit 可能没有）
	if (pitfall.evidence) {
		frontmatter.evidence = pitfall.evidence;
	}
	if (pitfall.regression) {
		frontmatter.regression = pitfall.regression;
	}
	if (pitfall.edge) {
		frontmatter.edge = pitfall.edge;
	}
	if (pitfall.related_rule) {
		frontmatter.related_rule = pitfall.related_rule;
	}

	// 归档状态
	if (pitfall.archived) {
		frontmatter.archived = pitfall.archived;
		if (pitfall.archived_at) frontmatter.archived_at = pitfall.archived_at;
		if (pitfall.archived_reason)
			frontmatter.archived_reason = pitfall.archived_reason;
	}

	const originLabel =
		pitfall.origin === "deductive" ? "演绎（前馈）" : "归纳（反馈）";
	const scopeLabel =
		pitfall.scope.type === "permanent"
			? "长期"
			: `临时: ${pitfall.scope.reason || ""}`;

	const body = `
# ${pitfall.title}

> Origin: ${originLabel} | Scope: ${scopeLabel}

## Trigger（触发条件）

${formatTriggerSection(pitfall)}

## Replay（问题回放）

${pitfall.evidence?.error_snippet || pitfall.replay.root_cause}

${pitfall.evidence?.diff_summary ? `**变更摘要：**\n${pitfall.evidence.diff_summary}` : ""}

## Action（修复方案）

${formatActionSection(pitfall)}

## Verify（验证检查）

${formatVerifySection(pitfall)}
`.trim();

	return matter.stringify(body, frontmatter);
}

function formatTriggerSection(pitfall: Pitfall): string {
	return pitfall.trigger
		.map((t, i) => {
			const lines = [`**策略 ${i + 1}** (${t.kind}, strength: ${t.strength})`];
			if (t.tool) lines.push(`- 工具: \`${t.tool}\``);
			if (t.pattern) lines.push(`- 模式: \`${t.pattern}\``);
			if (t.scope) lines.push(`- 范围: ${t.scope.join(", ")}`);
			if (t.exclude) lines.push(`- 排除: ${t.exclude.join(", ")}`);
			if (t.when_changed)
				lines.push(`- 变更触发: ${t.when_changed.join(", ")}`);
			if (t.ref) lines.push(`- 引用: ${t.ref}`);
			return lines.join("\n");
		})
		.join("\n\n");
}

function formatActionSection(pitfall: Pitfall): string {
	return pitfall.action
		.map((a, i) => {
			const lines = [`**路径 ${i + 1}** (风险: ${a.level})`];
			if (a.action) lines.push(`- 动作: ${a.action}`);
			if (a.steps) {
				lines.push("- 步骤:");
				for (const step of a.steps) {
					lines.push(`  1. ${step}`);
				}
			}
			if (a.doc) lines.push(`- 文档: ${a.doc}`);
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
		origin?: string;
		scope?: string;
		archived?: boolean;
	},
): Promise<Pitfall[]> {
	if (!existsSync(pitfallsDir)) {
		return [];
	}

	const files = await readdir(pitfallsDir);
	const mdFiles = files.filter((f) => f.endsWith(".md") && !f.startsWith("_"));

	const pitfalls: Pitfall[] = [];

	for (const file of mdFiles) {
		try {
			const content = await readFile(join(pitfallsDir, file), "utf-8");
			const { data } = matter(content);

			// Skip invalid files without required id field
			if (!data.id) {
				console.warn(
					`Warning: Skipping invalid pit file: ${file} (missing id)`,
				);
				continue;
			}

			// Normalize created date to string (gray-matter parses dates as Date objects)
			if (data.created instanceof Date) {
				data.created = data.created.toISOString().split("T")[0];
			}
			pitfalls.push(data as Pitfall);
		} catch (error) {
			console.warn(`Warning: Failed to parse pit file: ${file}`);
		}
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

	if (filter?.origin) {
		result = result.filter((p) => p.origin === filter.origin);
	}

	if (filter?.scope) {
		result = result.filter((p) => p.scope?.type === filter.scope);
	}

	if (filter?.archived !== undefined) {
		result = result.filter((p) => (p.archived ?? false) === filter.archived);
	} else {
		// 默认不显示已归档的
		result = result.filter((p) => !p.archived);
	}

	// Sort by ID
	return result.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Read a single pitfall by ID
 * Uses exact ID matching with pattern: {id}-{slug}.md
 */
export async function getPitfallById(
	pitfallsDir: string,
	id: string,
): Promise<Pitfall | null> {
	if (!existsSync(pitfallsDir)) {
		return null;
	}

	const files = await readdir(pitfallsDir);
	// Match pattern: {id}-{slug}.md (id followed by hyphen and slug)
	const idLower = id.toLowerCase();
	const matchingFile = files.find((f) => {
		const fLower = f.toLowerCase();
		// Must start with id followed by hyphen (exact id match)
		return fLower.startsWith(`${idLower}-`) && fLower.endsWith(".md");
	});

	if (!matchingFile) {
		return null;
	}

	const content = await readFile(join(pitfallsDir, matchingFile), "utf-8");
	const { data } = matter(content);
	return data as Pitfall;
}
