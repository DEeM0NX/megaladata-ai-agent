declare global {
  const MEGALADATA_AI_AGENT_VERSION: string
  const MEGALADATA_AI_AGENT_CHANNEL: string
  const MEGALADATA_AI_AGENT_BROWSER_RECOVERY: boolean
}

export const InstallationVersion = typeof MEGALADATA_AI_AGENT_VERSION === "string" ? MEGALADATA_AI_AGENT_VERSION : "local"
export const InstallationChannel = typeof MEGALADATA_AI_AGENT_CHANNEL === "string" ? MEGALADATA_AI_AGENT_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
// Baked by release builds only; launchers still require a verified bundle or packaged Desktop.
export const InstallationBrowserRecovery =
  typeof MEGALADATA_AI_AGENT_BROWSER_RECOVERY === "boolean" ? MEGALADATA_AI_AGENT_BROWSER_RECOVERY : false
