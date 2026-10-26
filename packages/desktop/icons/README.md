# Megaladata AI Agent icons

Editable SVG masters separate the full mark, the compact mark, and the platform
tiles. Desktop icons are transparent outside the tile. The full mark is a cyan
M (`#01A9C1`) with dark AI underneath; the compact mark is the M alone.

From `packages/desktop`, using the repository's pinned Bun:

```sh
bun scripts/generate-icons.ts --preview # preview only, before integration
bun scripts/generate-icons.ts           # all committed assets
bun scripts/generate-icons.ts --check   # read-only reproducibility check
bun test scripts/icons.test.ts scripts/copy-icons.test.ts electron-builder.config.test.ts
bun scripts/copy-icons.ts prod
```

Rendering uses the pinned development dependency `sharp@0.33.5`. The generator
packs independently rendered PNG frames into ICO/ICNS; no runtime dependency is
added. Serve `preview/index.html` locally to compare the variants on light, dark
and colored backgrounds.

- Windows: compact white tile; ICO frames 16, 24, 32, 48, 64, 128, 256.
- Linux: simple white tile, no outer shadow; explicit PNG set in each channel's
  `linux/`, sizes 16, 24, 32, 48, 64, 96, 128, 256, 512. `icon.png` is 512px.
- macOS: softly rounded tile and restrained shadow; ICNS classic slots 16–1024
  plus 16pt/32pt/128pt/256pt Retina slots. `dock.png` matches the 1024px ICNS
  frame and is used only in development; installed apps use their bundle ICNS.
- Small 16–32px frames and small macOS Retina slots use M. Larger system frames
  use M + AI. Favicons consistently use M, including scalable SVG.
- Apple touch is 180px and opaque. PWA assets are 192/512px with separate
  transparent `any` and opaque `maskable` images. Maskable artwork stays inside
  the central 80%-diameter safe circle. Desktop tile PNGs must not be reused as
  maskable images: that creates a tile inside the system mask.

Channels prod/beta/dev have identical art. `copy-icons.ts` stages only the four
active top-level application files and `linux/`, removing stale staging files.
Unused Microsoft Store tile logos are not kept. Historical Android/iOS assets
remain unmodified and are not packaged. Top-level 32/64/128 PNG aliases are
regenerated for source compatibility.

Generated web assets live in `packages/ui/src/assets/megaladata`, are copied as
regular files to both app public directories (Windows checkout compatibility),
and to the landing page's assets. Their `megaladata-*-v1` URLs are separate from
legacy shared documentation favicons. Browser app and landing page have distinct
manifests and retain their respective product names. UI mark/splash uses the
same generated SVG; notifications use its PNG representation.

Source validation does not establish installed appearance. Linux requires a new
build and installation; native Windows/macOS visual acceptance must be performed
on those systems. See the approved platform-icons design and acceptance report.
