import { app, safeStorage } from "electron"
import { join, resolve } from "node:path"
import { createMegaladataHost } from "@megaladata-ai-agent/megaladata-host/host"
import { credentials } from "./credentials"

export function megaladataResources() {
  return app.isPackaged
    ? join(process.resourcesPath, "megaladata")
    : resolve(import.meta.dirname, "../../resources/megaladata")
}

export function desktopMegaladata() {
  return createMegaladataHost({
    root: join(app.getPath("userData"), "megaladata"),
    resources: megaladataResources(),
    codec: credentials(process.platform, safeStorage),
    environment: process.env,
    headless:
      process.env.MEGALADATA_AI_AGENT_TEST_ONBOARDING === "1" && process.env.MEGALADATA_AI_AGENT_TEST_HEADLESS === "1",
    // Only the packaged app with its own resources may carry the baked capability.
    browserRecovery: import.meta.env.MEGALADATA_AI_AGENT_BROWSER_RECOVERY === true && app.isPackaged,
  })
}
