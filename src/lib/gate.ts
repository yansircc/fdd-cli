import type { GateCheckResult, Pitfall } from "../types/index.js";

/**
 * Check if pitfall passes all gates before writing
 */
export function checkGates(pitfall: Partial<Pitfall>): GateCheckResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Gate 1: Evidence required
	if (pitfall.evidence) {
		const hasContent =
			pitfall.evidence.error_snippet || pitfall.evidence.command;
		if (!hasContent) {
			errors.push(
				"Gate 1 failed: evidence must contain error_snippet or command",
			);
		}
	} else {
		errors.push("Gate 1 failed: evidence is required");
	}

	// Gate 2: Regression required
	if (!pitfall.regression) {
		errors.push("Gate 2 failed: regression is required");
	} else if (!(pitfall.regression.waiver || pitfall.regression.repro?.length)) {
		errors.push("Gate 2 failed: regression must have repro steps or waiver");
	} else if (pitfall.regression.waiver && !pitfall.regression.waiver_reason) {
		errors.push("Gate 2 failed: regression waiver requires waiver_reason");
	}

	// Gate 3: Edge required
	if (!pitfall.edge) {
		errors.push("Gate 3 failed: edge (negative case) is required");
	} else if (!(pitfall.edge.waiver || pitfall.edge.negative_case?.length)) {
		errors.push("Gate 3 failed: edge must have negative_case or waiver");
	} else if (pitfall.edge.waiver && !pitfall.edge.waiver_reason) {
		errors.push("Gate 3 failed: edge waiver requires waiver_reason");
	}

	// Gate 4: Weak detector warning
	if (pitfall.detect) {
		const hasWeakDetector = pitfall.detect.some((d) => d.strength === "weak");
		const allWeak = pitfall.detect.every((d) => d.strength === "weak");

		if (allWeak && pitfall.detect.length > 0) {
			warnings.push(
				"Gate 4 warning: all detectors are weak - consider upgrading to rule/change/dynamic",
			);
		} else if (hasWeakDetector) {
			warnings.push(
				"Gate 4 warning: some detectors are weak - marked for future upgrade",
			);
		}
	}

	// Gate 5: Detect field validation
	if (pitfall.detect && pitfall.detect.length > 0) {
		for (let i = 0; i < pitfall.detect.length; i++) {
			const d = pitfall.detect[i];
			const prefix = `Gate 5 failed: detect[${i}]`;

			if (d.kind === "rule" && !d.pattern) {
				errors.push(`${prefix} kind=rule requires pattern`);
			}
			if (d.kind === "dynamic" && (!d.must_run || d.must_run.length === 0)) {
				errors.push(`${prefix} kind=dynamic requires must_run`);
			}
			if (
				d.kind === "change" &&
				(!d.when_changed || d.when_changed.length === 0)
			) {
				errors.push(`${prefix} kind=change requires when_changed`);
			}
			if (d.kind === "command" && !d.pattern) {
				errors.push(`${prefix} kind=command requires pattern (regex)`);
			}
			if (
				d.kind === "command" &&
				d.action &&
				!["block", "warn"].includes(d.action)
			) {
				errors.push(`${prefix} kind=command action must be "block" or "warn"`);
			}
		}
	} else {
		errors.push("Gate 5 failed: at least one detector is required");
	}

	// Gate 6: Replay required
	if (!pitfall.replay) {
		errors.push("Gate 6 failed: replay is required");
	} else if (
		!pitfall.replay.root_cause ||
		pitfall.replay.root_cause.trim() === ""
	) {
		errors.push("Gate 6 failed: replay.root_cause is required");
	}

	// Gate 7: Remedy content validation
	if (!pitfall.remedy || pitfall.remedy.length === 0) {
		errors.push("Gate 7 failed: at least one remedy is required");
	} else {
		for (let i = 0; i < pitfall.remedy.length; i++) {
			const r = pitfall.remedy[i];
			const prefix = `Gate 7 failed: remedy[${i}]`;

			// action or steps must exist
			const hasAction = r.action && r.action.trim() !== "";
			const hasSteps = r.steps && r.steps.length > 0;
			const hasDoc = r.doc && r.doc.trim() !== "";

			if (!hasAction && !hasSteps && !hasDoc) {
				errors.push(`${prefix} requires action, steps, or doc`);
			}
		}
	}

	// Gate 8: Verify level-checks consistency
	if (pitfall.verify) {
		const level = pitfall.verify.level;
		const hasChecks = pitfall.verify.checks && pitfall.verify.checks.length > 0;
		const hasFallback =
			pitfall.verify.fallback?.self_proof &&
			pitfall.verify.fallback.self_proof.length > 0;

		// V0/V1 require executable checks
		if ((level === "V0" || level === "V1") && !hasChecks) {
			errors.push(
				`Gate 8 failed: verify.level=${level} requires checks commands`,
			);
		}

		// V3 requires fallback.self_proof
		if (level === "V3" && !hasFallback) {
			errors.push(
				"Gate 8 failed: verify.level=V3 requires fallback.self_proof",
			);
		}
	} else {
		errors.push("Gate 8 failed: verify is required");
	}

	return {
		passed: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Format gate check result for display
 */
export function formatGateResult(result: GateCheckResult): string {
	const lines: string[] = [];

	if (result.passed) {
		lines.push("All gates passed");
	} else {
		lines.push("Gate check FAILED:");
		for (const error of result.errors) {
			lines.push(`  - ${error}`);
		}
	}

	if (result.warnings.length > 0) {
		lines.push("\nWarnings:");
		for (const warning of result.warnings) {
			lines.push(`  - ${warning}`);
		}
	}

	return lines.join("\n");
}
