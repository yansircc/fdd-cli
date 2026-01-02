import type { Severity } from "../../types/index.js";

export interface RecordOptions {
	severity?: Severity;
	tags?: string;
	json?: string;
}
