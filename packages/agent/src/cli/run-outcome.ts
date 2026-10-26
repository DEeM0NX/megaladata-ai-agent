import type { ToolPart } from "@megaladata-ai-agent/sdk/v2"

// Correlation is deliberately explicit: a different successful operation does not repair a failure.
export function runToolOutcome() {
  const unresolved = new Set<string>()
  const connectionFailures = new Map<string, "MEGALADATA_CONFIG_REQUIRED" | "MEGALADATA_CONNECTION_NOT_READY">()
  return {
    observe(part: ToolPart) {
      if (part.state.status !== "completed" && part.state.status !== "error") return
      if (part.tool === "megaladata_dock_prepare") {
        const key = JSON.stringify(canonical(part.state.input))
        if (part.state.status === "error") {
          if (part.state.error === "MEGALADATA_CONFIG_REQUIRED") connectionFailures.set(key, part.state.error)
          // Browser admission now happens lazily; retain the former connection preflight exit contract.
          if (
            [
              "MEGALADATA_CONNECTION_NOT_READY",
              "MEGALADATA_LOGIN_REJECTED",
              "MEGALADATA_ACCOUNT_MISMATCH",
              "MEGALADATA_LOGIN_UNAVAILABLE",
              "MEGALADATA_BROWSER_START_FAILED",
            ].includes(part.state.error)
          )
            connectionFailures.set(key, "MEGALADATA_CONNECTION_NOT_READY")
        }
        if (part.state.status === "completed" && !part.state.metadata?.isError && !part.state.metadata?.megaladataPending)
          connectionFailures.delete(key)
        return
      }
      // A failed Megaladata scenario must not fail the whole run. Permission denials
      // and invalid calls stay on their own tool names.
      if (part.tool.startsWith("megaladata_")) return
      const input = part.state.input
      const identity =
        part.tool.startsWith("megaladata_") && typeof input.operation_id === "string" && input.operation_id
          ? ["operation", input.operation_id]
          : ["arguments", input]
      const key = part.tool === "invalid" ? `invalid:${part.id}` : JSON.stringify([part.tool, canonical(identity)])
      if (part.state.status === "error" || part.tool === "invalid" || part.state.metadata?.isError === true) {
        unresolved.add(key)
        return
      }
      unresolved.delete(key)
    },
    failed: () => unresolved.size > 0,
    connectionFailure: () => [...connectionFailures.values()].at(-1),
  }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, canonical(item)]),
  )
}
