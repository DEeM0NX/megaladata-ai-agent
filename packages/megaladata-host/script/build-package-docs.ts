import { isAbsolute, join } from "node:path"

export async function buildPackageDocs(output: string) {
  if (!isAbsolute(output)) throw Error("MEGALADATA_ABSOLUTE_PATH_REQUIRED")
  const result = await Bun.build({
    entrypoints: [join(import.meta.dir, "../src/package-docs/cli.ts")],
    outdir: output,
    naming: "package-docs.mjs",
    target: "node",
    packages: "bundle",
    splitting: false,
    metafile: true,
  })
  if (!result.success) throw new AggregateError(result.logs, "MEGALADATA_DOCS_BUILD_FAILED")
  if (!result.metafile) throw Error("MEGALADATA_DOCS_BUILD_METADATA_MISSING")
  return { script: join(output, "package-docs.mjs"), root: process.cwd(), metafile: result.metafile }
}

if (import.meta.main) {
  if (!process.argv[2]) throw Error("Provide an absolute package-docs output directory")
  process.stdout.write(JSON.stringify(await buildPackageDocs(process.argv[2])) + "\n")
}
