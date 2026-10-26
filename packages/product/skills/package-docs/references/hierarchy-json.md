# Hierarchy JSON (extractor → narrative)

`structure.json` modules expose `hierarchy[]` close to tools-megaladata AI Report.

## Edge shape

Each item:

```json
{ "Source": "<token>|null", "Target": "<token>|null" }
```

Token format:

```text
<label>:<service_name>:<guid>
```

Semantics:

| Case | Meaning |
|---|---|
| `Source` is null | `Target` has no incoming link at this level |
| `Target` is null | `Source` has no outgoing link at this level |
| both set | directed data/service link |

- `label` — user-facing node name on the canvas.
- `service_name` — operational essence (e.g. `ImportNative`, `CalcData`, `Supernode`).
- `guid` — uniqueness only; **never** print GUIDs in the report prose.

Null here describes the node's place in the graph, not an input or output port
of a supernode. An isolated node can appear both as a start and as an end;
that does not confirm a data source, delivery of a result, or a working flow.

## Nesting

- Nodes with service name `Supernode` contain nested workflows.
- The extractor recursively expands all nested facts under `modules[].submodels[]`.
- Nested modules also have their own `hierarchy`, `notes`, `workflow_nodes`, and `links`.

A supernode's external ports are on the node with the same `guid` in its
parent's `workflow_nodes`: `input_ports`, `output_ports`, and service ports.
Its inner `workflow_nodes` describes the nested nodes. A link to other nodes
of the parent is confirmed only by the matching `links`; an internal link is
confirmed by the supernode's own `links`. Do not fill empty ports or links
from the purpose of the type.

Readable links (for agent context, not for dumping into Markdown) live in
`modules[].links[].readable`, for example `Text File.DataSet → Calculator.DataSource`.

## Notes

`modules[].notes[]` (and nested supernode notes) are free-text annotations from
the workflow. Prefer them when they explain business intent.
