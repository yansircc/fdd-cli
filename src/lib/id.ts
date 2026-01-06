import { randomBytes } from "node:crypto";
import { readdir } from "node:fs/promises";

/**
 * Generate a unique pitfall ID using 6-char hex (3 bytes)
 * With collision detection and retry
 */
export async function generatePitfallId(
	pitfallsDir: string,
	maxRetries = 10,
): Promise<string> {
	const prefix = "PIT";
	const existingIds = await getExistingHexIds(pitfallsDir, prefix);

	for (let i = 0; i < maxRetries; i++) {
		const hex = randomBytes(3).toString("hex"); // 6 chars
		const id = `${prefix}-${hex}`;

		if (!existingIds.has(hex.toLowerCase())) {
			return id;
		}
	}

	throw new Error(
		`Failed to generate unique PIT ID after ${maxRetries} retries`,
	);
}

/**
 * Get existing hex IDs from directory
 */
async function getExistingHexIds(
	dir: string,
	prefix: string,
): Promise<Set<string>> {
	try {
		const files = await readdir(dir);
		const pattern = new RegExp(`^${prefix}-([a-f0-9]+)`, "i");

		const ids = new Set<string>();
		for (const file of files) {
			const match = file.match(pattern);
			if (match) {
				ids.add(match[1].toLowerCase());
			}
		}
		return ids;
	} catch {
		return new Set();
	}
}

/**
 * Generate next rule ID by scanning existing files
 */
export async function generateRuleId(rulesDir: string): Promise<string> {
	const prefix = "RULE";
	const existingIds = await getExistingIds(rulesDir, prefix);
	const nextNum = getNextNumber(existingIds);
	return `${prefix}-${String(nextNum).padStart(3, "0")}`;
}

/**
 * Get existing IDs from directory
 */
async function getExistingIds(dir: string, prefix: string): Promise<number[]> {
	try {
		const files = await readdir(dir);
		const pattern = new RegExp(`^${prefix}-(\\d+)`, "i"); // Case-insensitive

		return files
			.map((file) => {
				const match = file.match(pattern);
				return match ? Number.parseInt(match[1], 10) : null;
			})
			.filter((n): n is number => n !== null);
	} catch {
		return [];
	}
}

/**
 * Get next available number
 */
function getNextNumber(existingIds: number[]): number {
	if (existingIds.length === 0) return 1;
	return Math.max(...existingIds) + 1;
}

/**
 * Generate slug from title (English only, no Chinese characters)
 */
export function slugify(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 50);
}

/**
 * Generate filename for pitfall
 * Uses "untitled" if slug is empty (e.g., Chinese-only titles)
 */
export function pitfallFilename(id: string, title: string): string {
	const slug = slugify(title) || "untitled";
	return `${id.toLowerCase()}-${slug}.md`;
}

/**
 * Generate filename for rule
 * Uses "untitled" if slug is empty
 */
export function ruleFilename(id: string, title: string): string {
	const slug = slugify(title) || "untitled";
	return `${id.toLowerCase()}-${slug}.md`;
}
