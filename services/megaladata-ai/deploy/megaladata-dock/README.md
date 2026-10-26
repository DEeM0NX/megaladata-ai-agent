# Dock server and sources

[Live installation, access, paths, and deployment order](../../docs/megaladata-dock/operations.md).
The scripts are described below; their presence in the checkout does not mean the server copy
in `/opt/megaladata-dock/tools` is already updated.

- `install-docker.sh` — bootstrap for a clean Ubuntu; requires permission to
  install system packages as root. [Build order](../../docs/megaladata-dock/development.md).
- `compose.server.yaml` and `Caddyfile.server` — server config, Ollama, and public HTTPS.
- `Dockerfile.landing` — server build of the separate Russian-language landing into
  a pinned Caddy image. The site runs on `megaladata-dock.duckdns.org`; API/MCP
  remain on `megaladata.duckdns.org`. [Sources and update order](../../landing/README.md).
- `bootstrap-account.py` — shared account and ordinary client key; does not change
  existing keys. Memory extraction is disabled for the technical administrator.
- `verify-server.py` — live check of HTTPS, readiness, client rights, and the MCP catalog.
- `backup-server.sh` — consistent full copy of data, configs, Ollama models,
  Caddy/TLS, sources, operational tools, and pinned Docker images
  with a brief service stop. The files contain credentials and are available only to root.
- `catalog.yaml` — canonical GitLab locators, branches, and fixed resource URIs.
- `sources.yaml` — selection of all three sources through regular OpenViking Assets.
- `build-action-catalog.mjs` — deterministic build of the action/selector catalog,
  dependency-graph check, and default formation of a replay candidate;
  when E2E evidence changes, affected actions get status `stale`.
- `publish-action-catalog.py` — fail-closed placement of an immutable candidate through
  `--stage` without changing `current.json`, or production publication through
  `--activate --attestation <file>` with a check of the exact manifest/runtime/UI
  build report, readback of immutable files, and a separate pointer switch.

The canonical catalog records the existing GitLab HTTP addresses. It is not
a ready network route from the VPS. Before the first import:

1. Prepare a private reverse SSH route and an HTTPS entry for the PAT; verify it
   from the container, including LFS batch/object endpoints and a real file instead of a pointer.
2. Copy both YAML files into the Dock-owned state directory, add the verified HTTPS
   locator and `auth_ref` to the working catalog. Leave the `to` fields unchanged. Store secrets
   in a separate file with mode 0600, not in the manifest and not in the URL.
3. Set the exact allowed Git host with the regular `code` config; a global
   private-network allow is not required. Do not send the PAT to an HTTP locator.
4. Explicitly set the Dock CLI config and `OPENVIKING_ASSETS_CREDENTIALS_FILE` in this same
   namespace. Do not rely on a fallback to personal `~/.openviking`.
5. Run regular `ov add-resource --manifest sources.yaml --args dry_run:true`.
   This checks the resolver, credentials, and `git ls-remote`, but does not perform the import.
6. Apply the manifest, check source revisions, control files, LFS, and
   parser gaps, then read and search with GitLab disabled.

The regular resolver of the current checkout supports the `to` field at the catalog asset level.
Reapplying synchronizes the same URI. When changing a locator, check Assets
State and earlier Watches before starting updates; State is not committed to Git.

Automatic refresh is off. Source catalogs and `.state.json` should not
be applied at the same time from several processes.

## Backup and restore

`megaladata-dock-monitor.timer` starts `monitor-server.py` every five minutes.
`monitoring/health.json` stores only component states, API latency,
free space, and copy age; provider error texts and credentials are not written.
Client send latency is checked through `dock_diagnostics` on the agent machine.

After the first successful full check, `megaladata-dock-backup.timer` can be enabled
for a daily copy at 05:00 Europe/Moscow. The script serializes copy and import,
saves the original state in a separate folder, checks sums, and resumes services
on error. Deletion of old copies is not performed automatically.

A transfer to another host needs the timestamp directory from `latest-backup` and
all archives listed in its `image-checksums`, in the neighboring `images` directory.
Keep this structure in a private 0700 directory: the configuration contains live
keys. Verification is done with `sha256sum -c SHA256SUMS` and `image-checksums`.

`restore-server.py --backup /path/to/backups/TIMESTAMP --name dock-restore-CHECK
--root /opt/megaladata-dock/restore/CHECK` restores separate networks, five volumes,
and five services from the saved images. HTTP 19433 and HTTPS 19443 are bound only
to loopback. The live stack is not changed. After the check, stop the containers
from `restore-state.json`; the original data remain available for analysis.
Switching public ports and DNS to the restored stack is done by the operator
after acceptance, not by the rehearsal script itself.

To extract experience, copy `memory-templates/events.yaml` into your own
`/opt/megaladata-dock/assets/memory-templates` and set in `ov.conf`
`memory.custom_templates_dir` to `/opt/megaladata-dock/assets/memory-templates`.
This directory is already included in the assets mount and the full backup. After a change,
recreate only the application container and check readiness/API. The template
keeps the native events schema, distinguishes requirements from observed results,
and adds original message IDs. Other OpenViking servers are not affected.
