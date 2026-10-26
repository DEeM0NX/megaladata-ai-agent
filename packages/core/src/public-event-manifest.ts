export * as PublicEventManifest from "./public-event-manifest"

import { Event } from "@megaladata-ai-agent/schema/event"
import { EventManifest } from "@megaladata-ai-agent/schema/event-manifest"

export const Definitions = EventManifest.ServerDefinitions
export const Latest = Event.latest(Definitions)
