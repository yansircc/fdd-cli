#!/usr/bin/env node

import { Command } from "commander";
import pkg from "../package.json";
import { add } from "./commands/add/index.js";
import { check } from "./commands/check.js";
import { guard } from "./commands/guard.js";
import { init } from "./commands/init.js";
import { installHook } from "./commands/install-hook.js";
import { list } from "./commands/list.js";
import { validate } from "./commands/validate.js";

const program = new Command();

program
	.name("fdd")
	.description(
		"FDD CLI - Feedforward & Feedback Driven Development (前馈驱动 + 反馈驱动开发)",
	)
	.version(pkg.version);

program
	.command("init")
	.description("Initialize FDD in the current directory (includes shell hook)")
	.option("-f, --force", "Force reinitialize even if already initialized")
	.option("--skip-hook", "Skip installing shell command guard hook")
	.action((options) => init(options));

program
	.command("add")
	.description("Add a new pitfall (compile a fix into a triggerable entry)")
	.option(
		"-s, --severity <level>",
		"Severity level (critical/high/medium/low)",
		"medium",
	)
	.option("-t, --tags <tags>", "Tags (comma-separated)")
	.requiredOption("--json <data>", "Pitfall data as JSON (required)")
	.action((options) => add(options));

program
	.command("list")
	.description("List all recorded pitfalls")
	.option(
		"-s, --severity <level>",
		"Filter by severity (critical/high/medium/low)",
	)
	.option("-t, --tag <tag>", "Filter by tag")
	.option("-o, --origin <origin>", "Filter by origin (deductive/inductive)")
	.option("--scope <scope>", "Filter by scope (permanent/temporary)")
	.option("--archived", "Show archived pitfalls only")
	.action((options) => list(options));

program
	.command("validate")
	.description("Validate pitfalls against gate checks")
	.option("-i, --id <id>", "Validate specific pitfall by ID")
	.action((options) => validate(options));

program
	.command("check")
	.description("Run triggers to find potential issues")
	.option("-i, --id <id>", "Check specific pitfall by ID")
	.option("-v, --verbose", "Show detailed match information")
	.action((options) => check(options));

program
	.command("guard <command>")
	.description("Check if a command should be blocked (used by shell hook)")
	.option("-q, --quiet", "Suppress output (exit code only)")
	.action((command, options) => guard(command, options));

program
	.command("install-hook")
	.description("Install shell hook for automatic command guarding")
	.option("--shell <shell>", "Shell type (zsh/bash)", "zsh")
	.option("--uninstall", "Remove the hook instead of installing")
	.action((options) => installHook(options));

program.parse();
