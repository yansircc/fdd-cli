import { readdir } from "node:fs/promises";

/**
 * Generate next pitfall ID by scanning existing files
 */
export async function generatePitfallId(pitfallsDir: string): Promise<string> {
	const prefix = "PIT";
	const existingIds = await getExistingIds(pitfallsDir, prefix);
	const nextNum = getNextNumber(existingIds);
	return `${prefix}-${String(nextNum).padStart(3, "0")}`;
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
 * Generate slug from title
 */
export function slugify(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 50);
}

/**
 * Generate filename for pitfall
 */
export function pitfallFilename(id: string, title: string): string {
	const slug = slugify(title);
	return `${id.toLowerCase()}-${slug}.md`;
}

/**
 * Generate filename for rule
 */
export function ruleFilename(id: string, title: string): string {
	const slug = slugify(title);
	return `${id.toLowerCase()}-${slug}.md`;
}
