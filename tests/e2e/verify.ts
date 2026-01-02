#!/usr/bin/env bun
/**
 * E2E 测试验证脚本
 *
 * 用法: bun tests/e2e/verify.ts <pit-file> <expected-file>
 *
 * 验证语法:
 *   - 精确值: "trigger[0].kind": "rule"
 *   - 包含: "trigger[0].pattern": "contains:RegExp"
 *   - 存在: "trigger[0].context": "exists"
 */

import { readFileSync } from "node:fs";
import matter from "gray-matter";

interface Assertions {
	[path: string]: string;
}

interface ExpectedFile {
	_description?: string;
	assertions: Assertions;
}

function getNestedValue(obj: unknown, path: string): unknown {
	const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
	let current: unknown = obj;

	for (const part of parts) {
		if (current === null || current === undefined) return undefined;
		if (typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[part];
	}

	return current;
}

function checkAssertion(
	actual: unknown,
	expected: string,
): { pass: boolean; reason: string } {
	// exists: 只要字段存在即可
	if (expected === "exists") {
		const pass = actual !== undefined && actual !== null;
		return { pass, reason: pass ? "exists" : "field is missing" };
	}

	// contains:xxx - 包含检查
	if (expected.startsWith("contains:")) {
		const pattern = expected.slice(9); // 去掉 "contains:"
		const patterns = pattern.split("|"); // 支持 "contains:a|b|c" 表示包含任意一个

		const actualStr = JSON.stringify(actual);
		const pass = patterns.some((p) => actualStr.includes(p));
		return {
			pass,
			reason: pass
				? `contains "${pattern}"`
				: `"${actualStr}" does not contain "${pattern}"`,
		};
	}

	// 精确匹配
	const pass = actual === expected;
	return {
		pass,
		reason: pass ? "exact match" : `expected "${expected}", got "${actual}"`,
	};
}

function verify(pitFile: string, expectedFile: string): boolean {
	// 读取 pit 文件 (markdown with YAML frontmatter)
	const pitContent = readFileSync(pitFile, "utf-8");
	const { data: pit } = matter(pitContent);

	// 读取 expected 文件
	const expectedContent = readFileSync(expectedFile, "utf-8");
	const expected: ExpectedFile = JSON.parse(expectedContent);

	console.log(`\n验证: ${expected._description || expectedFile}`);
	console.log("=".repeat(50));

	let allPassed = true;

	for (const [path, expectedValue] of Object.entries(expected.assertions)) {
		const actualValue = getNestedValue(pit, path);
		const result = checkAssertion(actualValue, expectedValue);

		const icon = result.pass ? "✓" : "✗";
		const color = result.pass ? "\x1b[32m" : "\x1b[31m";
		const reset = "\x1b[0m";

		console.log(`${color}${icon}${reset} ${path}: ${result.reason}`);

		if (!result.pass) allPassed = false;
	}

	console.log("=".repeat(50));
	console.log(allPassed ? "\x1b[32m通过\x1b[0m" : "\x1b[31m失败\x1b[0m");

	return allPassed;
}

// 主函数
const args = process.argv.slice(2);

if (args.length < 2) {
	console.log("用法: bun tests/e2e/verify.ts <pit-file> <expected-file>");
	console.log("");
	console.log("示例:");
	console.log(
		"  bun tests/e2e/verify.ts .fdd/pitfalls/pit-001-xxx.md ../expected/pit-regex-error.json",
	);
	process.exit(1);
}

const [pitFile, expectedFile] = args;
const passed = verify(pitFile, expectedFile);
process.exit(passed ? 0 : 1);
