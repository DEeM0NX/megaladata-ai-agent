interface ImportMetaEnv {
  readonly MEGALADATA_AI_AGENT_CHANNEL: string
  readonly MEGALADATA_AI_AGENT_BROWSER_RECOVERY: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:megaladata-ai-agent-server" {
  export const MegaladataHost: typeof import("@megaladata-ai-agent/megaladata-host/adapter").MegaladataHost
  export namespace Server {
    export const listen: typeof import("../../../agent/dist/types/src/node").Server.listen
    export type Listener = import("../../../agent/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../agent/dist/types/src/node").Config.get
    export type Info = import("../../../agent/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../agent/dist/types/src/node").bootstrap
}
