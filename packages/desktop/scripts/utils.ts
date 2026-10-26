import { productChannel } from "@megaladata-ai-agent/product"

export type Channel = "dev" | "beta" | "prod"

export function resolveChannel(): Channel {
  return productChannel(Bun.env.MEGALADATA_AI_AGENT_CHANNEL)
}
