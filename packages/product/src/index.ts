export const Product = Object.freeze({
  name: "Megaladata AI Agent",
  slug: "megaladata-ai-agent",
  namespace: "@megaladata-ai-agent",
  envPrefix: "MEGALADATA_AI_AGENT_",
  scheme: "megaladata-ai-agent",
  executable: "megaladata-ai-agent",
  cliExecutable: "megaladata-ai-agent-cli",
  wordmark: "Megaladata AI",
  // OpenCode base before product migration: d848db933^:packages/opencode/package.json.
  opencodeCompatibilityVersion: "1.18.31",
  database: "megaladata-ai-agent.db",
  updateFeed: null as string | null,
  changelogFeed: null as string | null,
  artifactName: "megaladata-ai-agent-${os}-${arch}.${ext}",
  knowledgeEndpoint: "https://mcp.megaladata.ai/mcp",
  connection: Object.freeze({ url: "https://app.megaladata.ai", username: "user" }),
  stores: Object.freeze({ settings: "megaladata-ai-agent.settings", updater: "megaladata-ai-agent.updater" }),
  config: Object.freeze({
    directory: ".megaladata-ai-agent",
    json: "megaladata-ai-agent.json",
    jsonc: "megaladata-ai-agent.jsonc",
  }),
  channels: Object.freeze({
    prod: "com.megaladata.aiagent",
    beta: "com.megaladata.aiagent.beta",
    dev: "com.megaladata.aiagent.dev",
  }),
  resources: Object.freeze({ runtime: "megaladata", manifest: "resource-manifest.json" }),
})

export function productChannel(value: string | undefined) {
  return value === "prod" || value === "beta" ? value : "dev"
}

export function productSlug(channel: keyof typeof Product.channels) {
  return channel === "prod" ? Product.slug : `${Product.slug}-${channel}`
}

export function productName(channel: keyof typeof Product.channels) {
  if (channel === "prod") return Product.name
  return `${Product.name} ${channel === "beta" ? "Beta" : "Dev"}`
}
