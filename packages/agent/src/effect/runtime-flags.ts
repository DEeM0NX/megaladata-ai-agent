import { Config, ConfigProvider, Context, Effect, Layer, Option } from "effect"
import { ConfigService } from "@/effect/config-service"

const bool = (name: string) => Config.boolean(name).pipe(Config.withDefault(false))
const positiveInteger = (name: string) =>
  Config.number(name).pipe(
    Config.map((value) => (Number.isInteger(value) && value > 0 ? value : undefined)),
    Config.orElse(() => Config.succeed(undefined)),
  )
const experimental = bool("MEGALADATA_AI_AGENT_EXPERIMENTAL")
const enabledByExperimental = (name: string) =>
  Config.all({ experimental, enabled: Config.boolean(name).pipe(Config.option) }).pipe(
    Config.map((flags) => Option.getOrElse(flags.enabled, () => flags.experimental)),
  )

export class Service extends ConfigService.Service<Service>()("@megaladata-ai-agent/RuntimeFlags", {
  autoShare: bool("MEGALADATA_AI_AGENT_AUTO_SHARE"),
  pure: bool("MEGALADATA_AI_AGENT_PURE"),
  disableDefaultPlugins: bool("MEGALADATA_AI_AGENT_DISABLE_DEFAULT_PLUGINS"),
  disableEmbeddedWebUi: bool("MEGALADATA_AI_AGENT_DISABLE_EMBEDDED_WEB_UI"),
  disableExternalSkills: bool("MEGALADATA_AI_AGENT_DISABLE_EXTERNAL_SKILLS"),
  megaladataResources: Config.string("MEGALADATA_AI_AGENT_RESOURCES").pipe(Config.option, Config.map(Option.getOrUndefined)),
  disableLspDownload: bool("MEGALADATA_AI_AGENT_DISABLE_LSP_DOWNLOAD"),
  disableClaudeCodePrompt: Config.all({
    broad: bool("MEGALADATA_AI_AGENT_DISABLE_CLAUDE_CODE"),
    direct: bool("MEGALADATA_AI_AGENT_DISABLE_CLAUDE_CODE_PROMPT"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  disableClaudeCodeSkills: Config.all({
    broad: bool("MEGALADATA_AI_AGENT_DISABLE_CLAUDE_CODE"),
    direct: bool("MEGALADATA_AI_AGENT_DISABLE_CLAUDE_CODE_SKILLS"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  enableExa: Config.all({
    experimental,
    enabled: bool("MEGALADATA_AI_AGENT_ENABLE_EXA"),
    legacy: bool("MEGALADATA_AI_AGENT_EXPERIMENTAL_EXA"),
  }).pipe(Config.map((flags) => flags.experimental || flags.enabled || flags.legacy)),
  enableParallel: Config.all({
    enabled: bool("MEGALADATA_AI_AGENT_ENABLE_PARALLEL"),
    legacy: bool("MEGALADATA_AI_AGENT_EXPERIMENTAL_PARALLEL"),
  }).pipe(Config.map((flags) => flags.enabled || flags.legacy)),
  enableExperimentalModels: bool("MEGALADATA_AI_AGENT_ENABLE_EXPERIMENTAL_MODELS"),
  enableQuestionTool: bool("MEGALADATA_AI_AGENT_ENABLE_QUESTION_TOOL"),
  experimentalReferences: enabledByExperimental("MEGALADATA_AI_AGENT_EXPERIMENTAL_REFERENCES"),
  experimentalBackgroundSubagents: enabledByExperimental("MEGALADATA_AI_AGENT_EXPERIMENTAL_BACKGROUND_SUBAGENTS"),
  experimentalLspTy: bool("MEGALADATA_AI_AGENT_EXPERIMENTAL_LSP_TY"),
  experimentalLspTool: enabledByExperimental("MEGALADATA_AI_AGENT_EXPERIMENTAL_LSP_TOOL"),
  experimentalOxfmt: enabledByExperimental("MEGALADATA_AI_AGENT_EXPERIMENTAL_OXFMT"),
  experimentalPlanMode: enabledByExperimental("MEGALADATA_AI_AGENT_EXPERIMENTAL_PLAN_MODE"),
  experimentalCodeMode: enabledByExperimental("MEGALADATA_AI_AGENT_EXPERIMENTAL_CODE_MODE"),
  experimentalEventSystem: enabledByExperimental("MEGALADATA_AI_AGENT_EXPERIMENTAL_EVENT_SYSTEM"),
  experimentalWorkspaces: enabledByExperimental("MEGALADATA_AI_AGENT_EXPERIMENTAL_WORKSPACES"),
  experimentalIconDiscovery: enabledByExperimental("MEGALADATA_AI_AGENT_EXPERIMENTAL_ICON_DISCOVERY"),
  outputTokenMax: positiveInteger("MEGALADATA_AI_AGENT_EXPERIMENTAL_OUTPUT_TOKEN_MAX"),
  bashDefaultTimeoutMs: positiveInteger("MEGALADATA_AI_AGENT_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"),
  experimentalNativeLlm: bool("MEGALADATA_AI_AGENT_EXPERIMENTAL_NATIVE_LLM"),
  experimentalWebSockets: bool("MEGALADATA_AI_AGENT_EXPERIMENTAL_WEBSOCKETS"),
  client: Config.string("MEGALADATA_AI_AGENT_CLIENT").pipe(Config.withDefault("cli")),
}) {}

export type Info = Context.Service.Shape<typeof Service>

const emptyConfigLayer = Service.layer.pipe(
  Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
  Layer.orDie,
)

export const layer = (overrides: Partial<Info> = {}) =>
  Layer.effect(
    Service,
    Effect.gen(function* () {
      const flags = yield* Service
      return Service.of({ ...flags, ...overrides })
    }),
  ).pipe(Layer.provide(emptyConfigLayer))

export const node = LayerNode.make({ service: Service, layer: Service.layer.pipe(Layer.orDie), deps: [] })

export * as RuntimeFlags from "./runtime-flags"
import { LayerNode } from "@megaladata-ai-agent/core/effect/layer-node"
