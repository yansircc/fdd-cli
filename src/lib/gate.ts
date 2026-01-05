import type { GateCheckResult, Origin, Pitfall } from "../types/index.js";

/**
 * Check if pitfall passes all gates before writing
 *
 * FDD v2: 演绎 Pit (deductive) 跳过 Gate 1-3
 * - Gate 1: Evidence (归纳必填，演绎可选)
 * - Gate 2: Regression (归纳必填，演绎可选)
 * - Gate 3: Edge (归纳必填，演绎可选)
 */
export function checkGates(pitfall: Partial<Pitfall>): GateCheckResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// 获取 origin，默认为 inductive（向后兼容旧数据）
	const origin: Origin = pitfall.origin ?? "inductive";
	const isDeductive = origin === "deductive";

	// Gate 1: Evidence required (仅归纳 Pit)
	if (!isDeductive) {
		if (pitfall.evidence) {
			const hasContent =
				pitfall.evidence.error_snippet || pitfall.evidence.command;
			if (!hasContent) {
				errors.push(
					"Gate 1 failed: evidence must contain error_snippet or command",
				);
			}
		} else {
			errors.push("Gate 1 failed: evidence is required for inductive pit");
		}
	}

	// Gate 2: Regression required (仅归纳 Pit)
	if (!isDeductive) {
		if (!pitfall.regression) {
			errors.push("Gate 2 failed: regression is required for inductive pit");
		} else if (
			!(pitfall.regression.waiver || pitfall.regression.repro?.length)
		) {
			errors.push("Gate 2 failed: regression must have repro steps or waiver");
		} else if (pitfall.regression.waiver && !pitfall.regression.waiver_reason) {
			errors.push("Gate 2 failed: regression waiver requires waiver_reason");
		}
	}

	// Gate 3: Edge required (仅归纳 Pit)
	if (!isDeductive) {
		if (!pitfall.edge) {
			errors.push(
				"Gate 3 failed: edge (negative case) is required for inductive pit",
			);
		} else if (!(pitfall.edge.waiver || pitfall.edge.negative_case?.length)) {
			errors.push("Gate 3 failed: edge must have negative_case or waiver");
		} else if (pitfall.edge.waiver && !pitfall.edge.waiver_reason) {
			errors.push("Gate 3 failed: edge waiver requires waiver_reason");
		}
	}

	// Gate 4: Weak trigger warning
	if (pitfall.trigger) {
		const hasWeakTrigger = pitfall.trigger.some((t) => t.strength === "weak");
		const allWeak = pitfall.trigger.every((t) => t.strength === "weak");

		if (allWeak && pitfall.trigger.length > 0) {
			warnings.push(
				"Gate 4 warning: all triggers are weak - consider upgrading to external/change",
			);
		} else if (hasWeakTrigger) {
			warnings.push(
				"Gate 4 warning: some triggers are weak - marked for future upgrade",
			);
		}
	}

	// Gate 5: Trigger field validation
	if (pitfall.trigger && pitfall.trigger.length > 0) {
		for (let i = 0; i < pitfall.trigger.length; i++) {
			const t = pitfall.trigger[i];
			const prefix = `Gate 5 failed: trigger[${i}]`;

			// External trigger validation
			if (t.kind === "external") {
				if (!t.tool) {
					errors.push(
						`${prefix} kind=external requires tool (husky|biome|scripts)`,
					);
				}
				if (!t.ref) {
					errors.push(`${prefix} kind=external requires ref`);
				}
			}
			if (
				t.kind === "change" &&
				(!t.when_changed || t.when_changed.length === 0)
			) {
				errors.push(`${prefix} kind=change requires when_changed`);
			}
			if (t.kind === "command" && !t.pattern) {
				errors.push(`${prefix} kind=command requires pattern (regex)`);
			}
			if (
				t.kind === "command" &&
				t.action &&
				!["block", "warn"].includes(t.action)
			) {
				errors.push(`${prefix} kind=command action must be "block" or "warn"`);
			}
			// Protect trigger validation
			if (t.kind === "protect" && (!t.paths || t.paths.length === 0)) {
				errors.push(`${prefix} kind=protect requires paths (glob patterns)`);
			}
			// Inject Context trigger validation
			if (
				t.kind === "inject-context" &&
				(!t.when_touching || t.when_touching.length === 0)
			) {
				errors.push(
					`${prefix} kind=inject-context requires when_touching (glob patterns)`,
				);
			}
			if (t.kind === "inject-context" && !t.context) {
				errors.push(`${prefix} kind=inject-context requires context (text)`);
			}
			if (t.kind === "protect" && t.permissions) {
				const validPerms = ["deny", "allow"];
				if (
					t.permissions.create &&
					!validPerms.includes(t.permissions.create)
				) {
					errors.push(
						`${prefix} kind=protect permissions.create must be "deny" or "allow"`,
					);
				}
				if (
					t.permissions.update &&
					!validPerms.includes(t.permissions.update)
				) {
					errors.push(
						`${prefix} kind=protect permissions.update must be "deny" or "allow"`,
					);
				}
				if (
					t.permissions.delete &&
					!validPerms.includes(t.permissions.delete)
				) {
					errors.push(
						`${prefix} kind=protect permissions.delete must be "deny" or "allow"`,
					);
				}
			}
		}
	} else {
		errors.push("Gate 5 failed: at least one trigger is required");
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

	// Gate 7: Action content validation
	if (!pitfall.action || pitfall.action.length === 0) {
		errors.push("Gate 7 failed: at least one action is required");
	} else {
		for (let i = 0; i < pitfall.action.length; i++) {
			const a = pitfall.action[i];
			const prefix = `Gate 7 failed: action[${i}]`;

			// action or steps must exist
			const hasAction = a.action && a.action.trim() !== "";
			const hasSteps = a.steps && a.steps.length > 0;
			const hasDoc = a.doc && a.doc.trim() !== "";

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
