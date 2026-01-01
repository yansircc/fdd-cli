#!/usr/bin/env node

import { Command } from "commander";
import { init } from "./commands/init.js";
import { list } from "./commands/list.js";
import { record } from "./commands/record.js";

const program = new Command();

program
	.name("fdd")
	.description(
		"FDD CLI - Compile fixes into triggerable pitfalls (Feedback-Driven Development)"
	)
	.version("0.1.0");

program
	.command("init")
	.description("Initialize FDD in the current directory")
	.option("-f, --force", "Force reinitialize even if already initialized")
	.action((options) => init(options));

program
	.command("record [title]")
	.description("Record a new pitfall (compile a fix into a triggerable entry)")
	.option(
		"-s, --severity <level>",
		"Severity level (critical/high/medium/low)",
		"medium"
	)
	.option("-t, --tags <tags>", "Tags (comma-separated)")
	.action((title, options) => record(title, options));

program
	.command("list")
	.description("List all recorded pitfalls")
	.option(
		"-s, --severity <level>",
		"Filter by severity (critical/high/medium/low)"
	)
	.option("-t, --tag <tag>", "Filter by tag")
	.action((options) => list(options));

program.parse();
