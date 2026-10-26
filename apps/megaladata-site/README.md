# Megaladata Dock landing

Public site: <https://megaladata-dock.duckdns.org/>. The instructions and interface are in
Russian. The client endpoint remains `https://megaladata.duckdns.org/mcp`.
Current images, the exact Compose, and rollback are in the
[operations guide](../docs/megaladata-dock/operations.md).

Static HTML/CSS/JS with no external scripts or dependencies. `release.json` sets
the published release, platforms, and checksums; `build.mjs` checks this
data and builds `dist/`. `instructions.mjs` binds the chosen agent and system
to one archive, checksum, and set of commands. The source page without JavaScript
contains Codex/macOS installation and links to the full instructions and Linux.

## Server build

From the checkout root on the VPS:

```sh
docker build -f deploy/megaladata-dock/Dockerfile.landing \
  --build-arg MEGALADATA_DOCK_REVISION=FULL_COMMIT_SHA \
  -t megaladata-dock:landing-COMMIT .
```

Builder Node and the final Caddy are pinned by digest in the Dockerfile. The static files go
into the image at `/srv/megaladata-dock-landing`; generated `dist/` is not in Git
or the Docker build context. Before deployment, check the new `Caddyfile.server`
with `caddy validate` from the built image. Then set the image in
`MEGALADATA_DOCK_CADDY_IMAGE` of your own `deploy.env` and recreate Caddy through
the server Compose. Existing TLS volumes are kept. For rollback, restore
the previous image and Caddyfile. The ordinary backup already saves the Caddy image.

`/studio/connect` links redirect to `/#install` on the new domain: Caddy
handles a direct request; the Studio route handles an in-app navigation.
When this route changes, Studio must also be built and deployed.

Before publication: selector checks in `client/test/landing.test.mjs`, a server
build, visual review of the site on a wide and a narrow screen, a check of all
agent/system combinations, copying, release links, examples, HTTPS, and the old
address. Check public instructions against `client/INSTALL.md` and the wizard implementation.

`landing/release.json` is the source of public links and SHA-256. For a new release
update it only after checking GitHub assets, then rebuild the Caddy image.
`web-studio/src/lib/dock-release.ts` remains from the former page and no longer manages
downloads: the Studio route now redirects to the landing.

## Brand style and licenses

- Palette: [official Megaladata brandbook](https://brandbook.megaladata.ru/color/),
  primary `#A23938`, dark `#7D2B29`, text `#333333`.
- Font: [Source Sans Pro from the brandbook](https://brandbook.megaladata.ru/typographics/),
  unchanged WOFF2 Regular, Semibold, and Bold; OFL is included in
  `assets/LICENSE-SourceSansPro.txt`. Fonts are loaded from the site itself.
- `dock-mark.svg` is a separate Dock interface mark; it does not replace the Megaladata logo.
- `sales.csv` is a teaching set of sales by product and region for calculation,
  grouping, and sorting of revenue.

There are no keys, accounts, or data-submit forms on the landing. The description of the shared
base and archive bounds matches the Dock architecture.

## First screen: four scenes in a cycle

The main `index.html` loads `hero-cycle.mjs`. On every new document
load, one scene is chosen in a fixed order:
clusters (`clouds`) → signs (`glyphs`) → ribbons (`ribbons`) → voids (`voids`) →
clusters again. A click on the flow (or Enter/Space on it) chooses the next
scene in the same order without reload. After the first frame, the next scene
is loaded and prepared in the browser's idle time.

`hero-selection.mjs` stores the next scene name in LocalStorage under the key
`megaladata-dock.hero.next-variant.v1`. The queue is shared by tabs of the same origin
in this browser profile. Pause, replay, resize, and hash navigations do not change it.
A successful click transition saves the next position; a reload continues
after it. A click follows the visible scene even if another tab has already
moved the queue. Repeated clicks during preparation or fade are coalesced.
A first visit or a damaged value starts the cycle at clusters.
If storage is unavailable, the landing works with the available value or the first
scene, but the queue cannot be preserved across loads.

Scenes are in `variants/`; `engine.mjs` manages appearance, pause,
replay, reduced motion, and visibility. `flow-interaction.mjs` sets a soft
local follow of the cursor with a return to the flow. The viewpoint is fixed.
Appearance takes 2.6 seconds; render is capped at 30 frames/s and DPR 1.5;
off-screen and in a hidden tab the cycle stops. On a narrow screen there are
fewer particles. With reduced motion the chosen scene is still. On a Canvas or
module error the matching poster remains; without JavaScript, the clusters poster.
A change takes 700 ms: the old frame fades, the new scene appears immediately
with a full flow. Only the new scene is animated at once. Advance
preparation of the next drawing warms its cache; temporary transition canvases
are released after completion. Pause is kept across a change; reduced motion
switches immediately. A preparation error keeps the current flow and queue.
The heavy `voids` scene prepares geometry and the first invisible frame in chunks
with a 6 ms budget between yielding to the browser. This is a soft budget,
not a frame-time guarantee: a separate operation and garbage collection may take
longer. On dispose, preparation is cancelled through AbortSignal. The first entry
into `voids` also uses asynchronous geometry creation. An ordinary visible
frame is drawn whole, without showing intermediate parts.
There are no external libraries, video, or requests to third-party services; CSP is kept.

Checks: `client/test/landing-cycle.test.mjs`, `landing-transition.test.mjs`, `landing-variants.test.mjs`,
`landing-pointer.test.mjs`, `landing-voids.test.mjs`, and `landing.test.mjs`.
[Order, implementation, and checks](../docs/megaladata-dock/landing-cycle-2026-09-16.md).

## Local previews

Shared landing: `node landing/preview-variants.mjs cycle` →
`http://127.0.0.1:4173/`. Without an argument the command starts it and four
fixed previews for comparison:

- `http://127.0.0.1:4174/` — clusters, key `clouds`.
- `http://127.0.0.1:4175/` — signs, key `glyphs`.
- `http://127.0.0.1:4176/` — ribbons, key `ribbons`.
- `http://127.0.0.1:4177/` — voids, key `voids`.

Fixed previews do not read or change the queue. One of them can
be started separately: `node landing/preview-variants.mjs voids`.
On each port `/?static` shows the fallback poster without starting animation
or changing the queue; `/art-only` shows only the visualization.

`build.mjs` includes all four scenes, posters, CSS, and selection modules in `dist/`.
The change is prepared locally; the public site needs a separate server
build and publication.

History: v1 with a closed ribbon is saved in `0f04f9cb`; the old workflow with nodes
remains in `hero.mjs` and is checked by `landing-motion.test.mjs`, but the main HTML
does not start it. [Three concepts](../docs/megaladata-dock/landing-variants-2026-09-16.md),
[voids](../docs/megaladata-dock/landing-voids-2026-09-16.md),
[cursor follow](../docs/megaladata-dock/landing-cursor-2026-09-16.md).
