import { Show } from "solid-js"
import { Button } from "@megaladata-ai-agent/ui/button"
import { Dialog } from "@megaladata-ai-agent/ui/dialog"
import { useDialog } from "@megaladata-ai-agent/ui/context/dialog"
import { usePlatform } from "@/context/platform"
import { SettingsMegaladata } from "./settings-megaladata"

export function MegaladataButton() {
  const dialog = useDialog()
  const platform = usePlatform()
  return (
    <Show when={platform.megaladata}>
      <Button
        variant="ghost"
        aria-label="Megaladata"
        onClick={() =>
          void dialog.show(() => (
            <Dialog fit class="megaladata-dialog">
              <SettingsMegaladata />
            </Dialog>
          ))
        }
      >
        Megaladata
      </Button>
    </Show>
  )
}
