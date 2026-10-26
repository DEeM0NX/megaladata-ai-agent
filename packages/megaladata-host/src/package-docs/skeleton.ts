import type { PackageStructure } from "./extract"

export function renderSkeleton(structure: PackageStructure): string {
  const date = new Date()
  const time = `${date.getFullYear()}-${[date.getMonth() + 1, date.getDate()].map((value) => String(value).padStart(2, "0")).join("-")} ${[date.getHours(), date.getMinutes(), date.getSeconds()].map((value) => String(value).padStart(2, "0")).join(":")}`
  const file = structure.package.file_name || `${structure.package.name || "package"}.mgp`
  return [
    "AI Report service version: `1.0`",
    "",
    `# Package report «${file}» (${time})`,
    "",
    `## Package overview «${file}»`,
    "",
    `* **Platform version**: \`${structure.package.application_version || "unknown"}\``,
    "",
    "### Package description",
    "",
    "> PLACEHOLDER_PACKAGE_DESCRIPTION",
    "",
    "### External package references",
    "",
    ...(structure.package.external_references.length
      ? structure.package.external_references.map((reference) => `* \`${reference}\``)
      : ["* No references to external packages"]),
    "",
    "### Package statistics",
    "",
    `* **Module count**: \`${structure.stats.modules}\``,
    `* **Total notes**: \`${structure.stats.notes}\``,
    `* **Total nodes**: \`${structure.stats.nodes}\``,
    `* **Total supernodes**: \`${structure.stats.submodels}\``,
    `* **Total programming nodes**: \`${structure.stats.programming_nodes}\``,
    `* **Total reference nodes**: \`${structure.stats.reference_nodes}\``,
    `* **Total derived nodes**: \`${structure.stats.derived_nodes}\``,
    "",
    "### Module list",
    "",
    ...(structure.modules.length
      ? structure.modules.map((module) => `* Module ${module.index}. «${module.display_name || module.name}»`)
      : ["* (no modules found)"]),
    ...structure.modules.flatMap((module) => [
      "",
      `## Module ${module.index}. «${module.display_name || module.name || module.id}»`,
      "",
      "### Module description",
      "",
      `> PLACEHOLDER_MODULE_${module.index}_DESCRIPTION`,
      "",
      "### Module statistics",
      "",
      `* **Scenario nesting depth**: \`${module.stats.nesting_depth}\``,
      `* **Note count**: \`${module.stats.notes}\``,
      `* **Node count**: \`${module.stats.nodes}\``,
      `* **Supernode count**: \`${module.stats.submodels}\``,
      `* **Programming node count**: \`${module.stats.programming_nodes}\``,
      `* **Reference node count**: \`${module.stats.reference_nodes}\``,
      `* **Derived node count**: \`${module.stats.derived_nodes}\``,
    ]),
    "",
  ].join("\n")
}
