# Local Megaladata Dock client

Install, update, and recovery for users: [INSTALL.md](INSTALL.md).
Code map and limits: [agent handoff](../docs/megaladata-dock/agent-handoff.md).
Location of the active environment, queue, and pins of a specific session:
[operations.md](../docs/megaladata-dock/operations.md).

A shared MCP component for Windows/macOS/Linux. It serves initialization,
connects remote Dock and the local Playwright MCP, merges their real tool
catalogs, rejects collisions, and keeps the catalog/versions for the session.
Each launch gets a separate browser profile in the Dock directory.
`dock_prepare` loads and verifies the full server skill, returns instructions
into the current context, and pins the revision to the session. Native adapters
and the archive are connected to Codex and Hermes. Full acceptance of the first
release is recorded in the implementation journal.

Dependencies are pinned by `package-lock.json`: MCP SDK 1.30.0, Playwright MCP 0.0.82.
The latter uses Playwright `1.64.0-alpha-1789764292000` and Chromium revision 1246
(154.0.8037.0). Acceptance of the new kit on live Megaladata is not finished yet;
results of the previous kit 1243 do not transfer to it. Configuration explicitly
disables WebMCP (`webmcp: false`), keeping the catalog independent of page tools.
Node.js is pinned in `.node-version` (24.19.0). System Node is not replaced.

Use the pinned Node and `npm ci --ignore-scripts`, then:

```sh
node bin/install-browser.mjs --state-dir /absolute/dock-state
node bin/megaladata-dock.mjs --config /absolute/dock-client.json \
  --state-dir /absolute/dock-state --agent codex --adapter-revision 0.1.0-rc.2
```

`client.json` is an ordinary server client key with fields `endpoint`, `api_key`,
`account`, and `user` (both `megaladata-dock`), mode 0600. The path is passed
explicitly or through `MEGALADATA_DOCK_CONFIG`; personal `OPENVIKING_*`,
`ovcli.conf`, and the memory provider are not read. The endpoint is HTTPS `/mcp`.
If `--state-dir` is absent, the own `~/.megaladata-dock` is used. For Hermes
specify `--agent hermes` and the revision of its adapter.

The browser is visible by default. `--headless` is for technical checks;
it does not replace acceptance of visible Megaladata. Closing the client
environment closes its child browser MCP. The profile and artifacts stay local.
MCP itself without native hooks does not activate the archive; the actual
activation status is visible in diagnostics. `dock_diagnostics` shows versions,
paths, and the number of tools without credentials.

The launch mode is pinned for the whole process. Without a parameter, `classic`
is used, which keeps the behavior of the published client. For the first E2E MVP
the operator explicitly starts a separate process with `--mode executor-preview`.
Before publishing tools it checks the server `current.json`, the manifest,
catalog SHA-256 values, the E2E commit, the capability ABI, the minimum executor
revision, and attestation for the exact runtime. In the verified `rc.3`
candidate, `dock_action_describe`, `dock_action_run`, and graph observation
`dock_workspace_observe` are available. The 5 September follow-up expands
observation and adds `dock_ui_action`, `dock_operation_inspect`,
`dock_operation_recover` to this same session. Its implementation and acceptance
continue; the old kit does not receive new tools from a skill update. Raw
browser tools and `dock_clipboard_transfer` are absent. `--mode research`
explicitly enables the previous browser tools for research but does not publish
action tools. The model, action definition, and server cannot change the mode
of the current session.

Before production activation the operator can start `--mode executor-replay`
with two required pins: `--action-manifest-uri` points exactly at an immutable
manifest in the Dock catalog, and `--action-manifest-sha256` pins its contents.
Replay accepts `candidate` actions but rejects `stale`; the tool catalog stays
as limited as in `executor-preview`. These parameters are set only at process
start and are not published to the model as tools.
For the native plugin the same choice can be made before the agent starts
through `MEGALADATA_DOCK_MODE=executor-preview`; absence of the variable always
means `classic`. Do not let the model change the environment or the MCP
registration in order to change the mode.

Canonical definitions, selector symbols, schemas, and the capability ABI live in
`executor/`. `deploy/megaladata-dock/build-action-catalog.mjs` deterministically
builds an immutable release. When a fresh E2E source manifest is passed, it
marks only the affected actions `stale` by the dependency graph and creates a
candidate that `executor-preview` will not accept. Candidate is the default
build mode; then the immutable files are placed through
`publish-action-catalog.py --stage` without changing `current.json`. After
review and replay the operator passes a report through
`--activate --attestation <file>`: the immutable candidate bytes are kept, and
the production pointer binds the manifest and attestation by SHA-256. The report
contains the exact runtime, the verified Megaladata UI build, Hermes/Xiaomi
MiMo 2.5, and the required results. A rebuild does not promote `stale` to an
accepted state.

`dock_prepare` uses the shared lifecycle of ordinary mode and replay: it opens
Megaladata, checks the frontend build through the public `bg.app.Version`, and
determines a ready workflow. On `LOGIN_REQUIRED` the user signs in in the window
and repeats preparation. Operator `--replay-bootstrap --replay-login-user ACCOUNT`
allows login only into an explicitly chosen passwordless test account; there is
no default name, and the storage directory is determined separately; it does not
start a separate preparation path at MCP start. Actions are forbidden until
`prepared: true`. Node refs include workflow identity. `operation_id` binds a
request retry to the previous result; phases are written after redaction into
the private `execution-events.jsonl` before the UI is changed. An unknown
effect blocks new changes until reconciliation. In the earlier `rc.3`, absence
of confirmed cleanup after a lost connection requires finishing the isolated
client session; the new extension adds a check of the actual browser receipt
and recovery.

In the extended interface the agent works in the cycle “observe → determine the
cause → choose an action/correction → check → continue”. The three ready
operations `node.add`, `link.create`, `package.save_as` are kept. Tool contracts:

| Tool | Purpose |
| --- | --- |
| `dock_action_describe` | With `{}` returns `available_actions` with three exact names; with `action_key` returns the definition of the selected operation |
| `dock_workspace_observe` | Reads the graph, settings, dialogs, messages, masks, and table cells; returns available UI `ref` and `observation_id` |
| `dock_ui_action` | Accepts `observation_id`, `operation_id`, `action` with `verb` from `click`, `double_click`, `fill`, `press`, `drag` and schema fields; performs one gesture on fresh own refs |
| `dock_operation_inspect` | With optional `operation_id` reads the browser receipt and checks the specified or current pending operation |
| `dock_operation_recover` | Accepts the original `operation_id`, a separate `recovery_operation_id`, and `strategy` from `complete_link`, `restore_control`, `accept_observed_state`, `abandon_operation`; the last two need `observation_id`, except releasing a stopped `dock_node_apply` through `abandon_operation`, where Dock itself collects the proof; checks whether recovery is possible and its result |

The agent starts with discovery, without guessing action keys. An unknown action
and invalid arguments are returned as ordinary MCP-content with `FAILED`; an
existing uncertain operation keeps `AMBIGUOUS`. These request errors do not mean
an MCP-server refusal. `dock_prepare` returns the capabilities and instructions
of the current client, which refine the limits of an older full server skill.
In old `rc.3` an empty describe may not match the schema; the actual tools and
schemas of the current session remain the guide.

When a node is added next to others, Megaladata may automatically create links.
Updated `node.add` returns them in `output.auto_created_links` together with
`SUCCEEDED` and `goal_verified: false` if exactly one required node, its name
and position are confirmed, previous nodes, ports, and links did not change, and
all new links belong to this node. Such auto-links alone do not create a pending
lock. The agent checks the graph against the goal: it keeps useful links and
removes unneeded ones through ordinary `dock_ui_action`. Foreign graph changes
remain `AMBIGUOUS`.

`action` uses only the gesture-matching fields `ref`, `text`, `key`,
`source_ref`, `target_ref`. JavaScript, CSS/XPath, arbitrary locators, and
clipboard are not accepted. After a UI gesture a new observation is required; a
successful gesture does not prove that the domain goal was reached. Settings or
a correction can be performed in this same session if the UI interface covers
the needed actions.

`complete_link` connects an already created single input after a partial
`Input_Add`, without creating the next one. Another bounded correction through
`dock_ui_action` puts the ID of the original pending operation in
`recovery_operation_id` and uses a fresh observation. After the correction,
inspect checks the original operation. While the browser call may still be
running, new mutations are forbidden; another ID does not lift this check. The
Playwright receipt registry for the page lets you read the actual completion and
cleanup after a lost reply. `restore_control` repairs only cleanup and requires
confirmed end of the call, not a simple timer expiry.

For a pending `ui.act` gesture with an actually finished call and confirmed
cleanup, `accept_observed_state` is available. The agent first analyzes a fresh
observation, then passes its `observation_id` to recover. The runtime rereads
the UI and requires an exact match; it stores `resolution: accepted_observed_state`,
`goal_verified: false`, and allows continuation. The original gesture remains
`AMBIGUOUS`. This checkpoint does not prove success of the gesture or the goal;
the agent checks the domain result separately. A new ID, an unfinished call, or
unconfirmed cleanup do not allow this strategy.

When the agent after analysis changes the step goal or redoes an erroneously
chosen request, `abandon_operation` lets it explicitly refuse the outcome of the
pending operation. A finished browser call, confirmed cleanup, and a fresh
`observation_id` are required; the runtime rechecks the same UI and package
identity. The original result remains `AMBIGUOUS` with
`resolution: abandoned_after_observation`, `goal_verified: false`. `SUCCEEDED`
on the recover receipt confirms only the refusal: pending is cleared, the
original ID is no longer executed, and there is no automatic retry. The agent
chooses a new step and separately proves the domain result. While the call may
still be running, refusal is forbidden. `accept_observed_state` remains only for
a completed `ui.act`; no strategy substitutes uncertainty with domain success.

New acceptance criteria include a task given only as a goal and an unannounced
partial effect in real Megaladata. The agent must itself choose a correction and
prove the result. Historical **79/79** tests and `rc.3` replay belong to the
previous three operations; they do not close acceptance of the new tools.
For public admission of a new runtime, `agent_partial_link_recovery`,
`agent_ui_recovery`, and `transport_receipt_recovery` are added to the eight
previous required checks, confirmed for the exact released revision.

`dock_clipboard_transfer` performs copy → paste → DOM check in one call.
All Dock sessions on the machine use a shared lock: exclusively occupied
loopback port 46419 with no data-transfer protocol. The OS releases it when the
process ends; a live owner cannot be displaced by a timer. Waiting for the lock
can be cancelled. After copy starts, the lock is held until the final browser
result; after a lost reply it remains until the client environment closes.
Switching browser actions inside one session is also serialized. Other programs
do not take part in this lock. Direct copy/paste outside this tool must not be
used.

The configuration helper `normalizeConfigPath` is reused from the shared library
of upstream examples. Their credential fallback and automatic memory capture are
not used. The distribution includes these shared modules together with the
pinned dependencies.

Native hooks use their own SQLite queue in `archive/`, read only the activated
Codex/Hermes history, and clean events before write and before send.
After a turn finishes, the queue requests the regular OpenViking commit; the
server extracts events/experiences without a mixed personal profile. Delivery
is retried by a bounded background worker and on later hooks. Missing unwritten
streaming fragments are not declared restored.

`deploy/megaladata-dock/build-client-bundle.py` builds a standalone package with
Node, licenses, dependencies, native plugins, and SHA-256 of each file.
`install.sh` runs the wizard on macOS/Linux, `install.ps1` on Windows; the key
is entered hidden or read from an explicit private file through `--config-from`.
`--runtime-only` is for environment acceptance before native install. Versions
are placed in `releases/`; `current` is switched atomically (by a link on
macOS/Linux and a protected pointer file on Windows); `--rollback` returns the
previous environment in `--runtime-only` mode. For a regular install,
`--agent codex --rollback` or `--agent hermes --rollback` also restores the
native registration of the chosen profile. The wizard saves a journal before
the switch; after an emergency interrupt the same command repeats recovery.
Current keys are kept on an ordinary rollback; cancelling a failed install
returns its previous settings. Reinstalling the same kit does not lose the
rollback target.

`--agent codex --uninstall` or `--agent hermes --uninstall` removes the
connection and the native plugin of the chosen agent. Profiles, artifacts, and
the queue stay in the Dock-owned directory. Removing them is a separate user
decision; server history is not changed. Native install uses
`~/.megaladata-dock`; a nonstandard `--home` is for isolated runtime-only
checks. The Hermes profile is set by `--hermes-home`.

Updating Hermes is done by a repeated pinned/subdirectory install with `--ref`
of the full SHA through its regular manager, keeping plugin scanning. The MCP
record is changed by regular `hermes config set mcp_servers.megaladata-dock`;
the result is read back. Connections and the memory provider unrelated to Dock
are kept. If the gateway is running, it must be restarted after the native
package changes.

Diagnostics show the server identity, the three sources, the verified skill
revision, Megaladata availability, the number of pending events of this session
and of the whole installation, and the age of the oldest unsent event. A missing
time is marked as unknown. HTTP availability of a page does not mean successful
authorization. Packages with `sourceDirty=true` are candidates and are not
suitable for a pinned public Hermes install.

Checks: `npm test`; an end-to-end check connects an SDK client to this stdio
server, reads the real catalog, and calls Dock search/read and browser tools.

After Chromium is downloaded, the installer checks a real launch without a
window and stops the install if the browser does not start. Minimal Linux needs
system Chromium libraries: an administrator can install them with
`install-deps chromium` through `client/node_modules/playwright-core/cli.js`
from the same kit. These are separate OS packages; the user's Node/Python are
not replaced. Ordinary agent work needs a desktop with `DISPLAY` or
`WAYLAND_DISPLAY`; presence of a graphical environment is checked separately
and is not presented as completed Megaladata authorization.

The target Linux platform of the kit is x64: Ubuntu 22.04/24.04/26.04 and
Debian 12/13
([Playwright requirements](https://playwright.dev/docs/intro#system-requirements)).
X11 needs a working `DISPLAY` and access to the X server; with a nonstandard
authorization file — `XAUTHORITY`. Native Wayland needs the compositor socket,
`WAYLAND_DISPLAY`, `XDG_RUNTIME_DIR`, and `XDG_SESSION_TYPE=wayland`.
`XDG_CURRENT_DESKTOP` keeps Chromium's desktop detection, including the choice
of native proxy settings. The bridge forwards these six variables only on Linux.
XWayland and native Wayland are checked separately: X11 success does not confirm
both. Current evidence and acceptance limits are listed in the
[Linux plan](../docs/plans/2026-09-15-megaladata-dock-linux-maintenance.md).
