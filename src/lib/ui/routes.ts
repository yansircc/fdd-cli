import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { getPaths } from "../config.js";
import {
	getDetailTemplate,
	getListTemplate,
	getVendorScript,
} from "./templates.js";

interface SpecSummary {
	name: string;
	title: string;
}

interface SpecDetail {
	name: string;
	sections: { name: string; content: string }[];
	relatedPits: { id: string; title: string; path: string }[];
}

/**
 * Handle incoming HTTP requests
 */
export async function handleRequest(
	req: Request,
	cwd: string,
): Promise<Response> {
	const url = new URL(req.url);
	const path = url.pathname;

	try {
		// Static vendor files
		if (path === "/vendor/marked.min.js") {
			const script = await getVendorScript("marked");
			return new Response(script, {
				headers: { "Content-Type": "application/javascript" },
			});
		}

		if (path === "/vendor/dompurify.min.js") {
			const script = await getVendorScript("dompurify");
			return new Response(script, {
				headers: { "Content-Type": "application/javascript" },
			});
		}

		// API routes
		if (path === "/api/specs") {
			const specs = await listSpecs(cwd);
			return Response.json(specs);
		}

		if (path.startsWith("/api/spec/")) {
			const name = path.replace("/api/spec/", "");
			const spec = await getSpec(cwd, name);
			if (!spec) {
				return Response.json({ error: "Spec not found" }, { status: 404 });
			}
			return Response.json(spec);
		}

		// HTML pages
		if (path === "/" || path === "/index.html") {
			return new Response(getListTemplate(), {
				headers: { "Content-Type": "text/html; charset=utf-8" },
			});
		}

		if (path.startsWith("/spec/")) {
			const name = path.replace("/spec/", "");
			return new Response(getDetailTemplate(name), {
				headers: { "Content-Type": "text/html; charset=utf-8" },
			});
		}

		// 404
		return new Response("Not Found", { status: 404 });
	} catch (error) {
		console.error("Request error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}

/**
 * List all specs in .fdd/specs/
 */
async function listSpecs(cwd: string): Promise<SpecSummary[]> {
	const paths = getPaths(cwd);
	const specsDir = paths.specs;

	if (!existsSync(specsDir)) {
		return [];
	}

	const entries = await readdir(specsDir, { withFileTypes: true });
	const specs: SpecSummary[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;

		const specPath = join(specsDir, entry.name, "SPEC.md");
		if (!existsSync(specPath)) continue;

		// Extract title from SPEC.md
		const content = await readFile(specPath, "utf-8");
		const titleMatch = content.match(/^#\s+(.+)/m);
		const title = titleMatch ? titleMatch[1] : entry.name;

		specs.push({
			name: entry.name,
			title,
		});
	}

	return specs;
}

/**
 * Get spec detail by name
 */
async function getSpec(cwd: string, name: string): Promise<SpecDetail | null> {
	const paths = getPaths(cwd);
	const specDir = join(paths.specs, name);

	if (!existsSync(specDir)) {
		return null;
	}

	// Read sections in fixed order
	const sectionOrder = ["SPEC", "stories", "flows", "context", "constraints"];
	const sections: { name: string; content: string }[] = [];

	for (const sectionName of sectionOrder) {
		const filePath = join(specDir, `${sectionName}.md`);
		if (existsSync(filePath)) {
			const content = await readFile(filePath, "utf-8");
			sections.push({ name: sectionName, content });
		}
	}

	// Parse related pits from SPEC.md
	const relatedPits = await parseRelatedPits(cwd, specDir);

	return {
		name,
		sections,
		relatedPits,
	};
}

/**
 * Parse related pits from SPEC.md "Related Pits" table
 */
async function parseRelatedPits(
	cwd: string,
	specDir: string,
): Promise<{ id: string; title: string; path: string }[]> {
	const specPath = join(specDir, "SPEC.md");
	if (!existsSync(specPath)) {
		return [];
	}

	const content = await readFile(specPath, "utf-8");
	const pits: { id: string; title: string; path: string }[] = [];

	// Find Related Pits section
	const relatedSection = content.match(/## Related Pits[\s\S]*?(?=##|$)/);
	if (!relatedSection) {
		return [];
	}

	// Parse markdown table rows
	// Format: | [PIT-001](../../pits/pit-001-xxx.md) | description |
	const rowRegex = /\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|([^|]*)\|/g;
	let match: RegExpExecArray | null;

	while (true) {
		match = rowRegex.exec(relatedSection[0]);
		if (!match) break;

		const id = match[1];
		const relativePath = match[2];
		const title = match[3].trim();

		// Resolve pit path
		const pitPath = join(specDir, relativePath);
		if (existsSync(pitPath)) {
			pits.push({
				id,
				title: title || id,
				path: relativePath,
			});
		}
	}

	return pits;
}
