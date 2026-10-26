import { run as runTui, type TuiInput } from "@megaladata-ai-agent/tui"
import { Global } from "@megaladata-ai-agent/core/global"
import { AppNodeBuilder } from "@megaladata-ai-agent/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
