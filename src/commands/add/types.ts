import type { Severity } from "../../types/index.js";

export interface AddOptions {
	severity?: Severity;
	tags?: string;
	json: string;
}
