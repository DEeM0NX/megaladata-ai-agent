# Connecting Megaladata Dock

Megaladata Dock gives the agent instructions and the shared Megaladata knowledge base, and the browser runs
on your computer. After a task is prepared successfully, its messages and tool
results are stored in the shared Dock database with secrets removed. Browser profiles
and binary artifacts stay local.

## What you need

- Codex 0.149.1 or newer, or Hermes 0.21.0 or newer,
  on a supported main branch. The chosen agent's command must be available
  in the terminal.
- Windows 11 x64, macOS with Apple Silicon, or Linux x64 with a graphical environment.
- A Dock client key from an administrator and the address of your Megaladata with `?testable=true`.
- An existing working folder in the Megaladata file storage, available to your account.
- Access to the Dock server, GitHub, and the target Megaladata. An internal stand needs a VPN.

In the Megaladata Dock project, scenarios through Hermes run on an already connected
ChatGPT subscription. The Dock installer does not change the Hermes model or provider.

## Installation

Open the [Megaladata Dock installation page](https://megaladata-dock.duckdns.org/#install)
and go to the release named there.
Download the archive for your system and the `SHA256SUMS` file. macOS is
`darwin-arm64`, Linux is `linux-x64`, and Windows is `win32-x64`. Compare the archive
checksum with the `SHA256SUMS` entry: on macOS use `shasum -a 256`,
on Linux use `sha256sum`, and on Windows use `Get-FileHash -Algorithm SHA256` in PowerShell.

Unpack the archive, open a terminal in the `megaladata-dock` directory, and start the wizard
for your agent:

```sh
./install.sh --agent codex
```

or:

```sh
./install.sh --agent hermes
```

For a separate Hermes profile, add `--hermes-home /full/path/to/the/profile`.
In the wizard, enter the Dock address (default `https://mcp.megaladata.ai/mcp`),
the Megaladata address, the client key, and the working folder, for example `/analyst/My scenarios`.
That folder is on the Megaladata server: scenarios, input files, and results are created there.
Key entry is hidden. Do not paste the key into a command,
an agent message, or a link.

The wizard installs its own Dock environment and Chromium, registers the native plugin,
and checks the connection. System Node.js/Python and other agent settings are kept.
On a minimal Linux the wizard may report missing Chromium libraries;
a system administrator installs them. Details are in `client/README.md`.

On Windows, unpack the ZIP and, from the `megaladata-dock` directory, run in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 --agent codex
```

The parameters `--agent hermes`, `--config-from`, `--storage-root`, `--rollback`, `--uninstall`, and
`--hermes-home` match the examples above. The environment is installed in
`%USERPROFILE%\.megaladata-dock`; system Node.js and Python are not replaced.

For Codex, check Dock handler permissions in `/hooks` if the agent asks for
trust. For Hermes, restart a running gateway after installation.
Open a new session and ask: "Check the Megaladata Dock connection." Diagnostics
should show the server, sources, instructions, and the browser as available; when work starts
in Megaladata, `dock_prepare` should finish successfully and activate the archive.

## A dataset from a message

In Codex, attach a CSV, TSV, or text file to the message. In Hermes Desktop/TUI,
choose the file through attachments or name it with `@file`. Write which scenario
to build. Dock prepares a separate copy of the file and uploads it to the selected
working folder when the agent configures the import. Existing files are not overwritten.
Trust for the plugin handlers must be enabled for that message.

You can attach up to eight files: up to 16 MiB each and up to 64 MiB in total.
XLSX and JSON transfer is supported, but this RC does not yet have ready import handlers
for those formats. Automatic processing in the RC uses text datasets.
Attachments through Telegram and other messengers are not covered by this check.

Megaladata opens on the first request. Sign in with the ordinary form and tell the agent
that sign-in is done; do not send the password in chat. The working-folder path can
be changed by running the wizard again with `--storage-root /path/in/Megaladata`.

## Update and rollback

Download the new set, check the checksum, and repeat the wizard with the same agent and
profile. The wizard keeps the current addresses, key, and working folder automatically.
If needed, choose another protected config explicitly:

```sh
./install.sh --agent hermes --config-from "$HOME/.megaladata-dock/config.json"
```

Replace `hermes` with `codex` if needed. The update applies to new
sessions; sessions that are already running keep their pinned versions.

To return to the previous installation, run this from the unpacked set:

```sh
./install.sh --agent hermes --rollback
```

Name the same Hermes profile if you used `--hermes-home`. After an interrupted
installation, this command restores the saved registration. If there was no previous
installation, an ordinary rollback to the previous version is unavailable.

## Removal

```sh
./install.sh --agent hermes --uninstall
```

For Codex, replace the agent name. The plugin and the selected agent's connection are removed.
Local profiles, artifacts, the queue, and the shared server history are kept.

## If the connection does not work

Repeat Dock diagnostics in a new session. Check the VPN, the Megaladata address,
`?testable=true`, the client key, and that the desktop is reachable. Opening
the page successfully does not mean you are signed in to Megaladata: sign in with the ordinary browser form.
If installation was interrupted, use the rollback described above and keep the error text
without keys. Do not delete the Dock directory by hand until registration is restored.
