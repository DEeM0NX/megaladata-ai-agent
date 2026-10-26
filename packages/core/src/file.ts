export * as File from "./file"

import { Revert } from "@megaladata-ai-agent/schema/revert"

export const Diff = Revert.FileDiff
export type Diff = typeof Diff.Type
