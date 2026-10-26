import { AgentV2 } from "@megaladata-ai-agent/core/agent"
import { AISDK } from "@megaladata-ai-agent/core/aisdk"
import { Catalog } from "@megaladata-ai-agent/core/catalog"
import { CommandV2 } from "@megaladata-ai-agent/core/command"
import { Credential } from "@megaladata-ai-agent/core/credential"
import { AppNodeBuilder } from "@megaladata-ai-agent/core/effect/app-node-builder"
import { LayerNodePlatform } from "@megaladata-ai-agent/core/effect/app-node-platform"
import { LayerNode } from "@megaladata-ai-agent/core/effect/layer-node"
import { EventV2 } from "@megaladata-ai-agent/core/event"
import { FileSystem } from "@megaladata-ai-agent/core/filesystem"
import { FSUtil } from "@megaladata-ai-agent/core/fs-util"
import { Integration } from "@megaladata-ai-agent/core/integration"
import { Location } from "@megaladata-ai-agent/core/location"
import { Npm } from "@megaladata-ai-agent/core/npm"
import { PluginV2 } from "@megaladata-ai-agent/core/plugin"
import { Reference } from "@megaladata-ai-agent/core/reference"
import { SkillV2 } from "@megaladata-ai-agent/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)
