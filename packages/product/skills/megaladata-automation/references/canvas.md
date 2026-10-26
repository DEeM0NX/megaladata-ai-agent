# Graph, nodes, and references

For each node type, read its schema through `megaladata_dock_action_describe`.
`megaladata_dock_node_apply` creates and configures nodes; describe the required
inputs through `inputs`. The runtime may choose the position. Do not pick a
`data-tid`, coordinates, the clipboard, or internal GUIDs by hand.

Take the mode from the contract of the specific type, not from a generic `mode`
list: for example, `transform.filter_data` uses `conditions`. Pass conditions
and formulas in parameters, not in `target.label`. An optional label may be
omitted; for a caption choose short words, for example "Overdue orders", without
`; | < >`, quotes, a backslash, or control characters (at most 200 characters).

`target.kind=new` creates a new node. To change a node that has already
finished, use `target.kind=existing`, the issued `target.ref`, and a new
operation ID. `inputs:[]` keeps the existing links. A reference to a node in a
saved package contains a stable GUID, not the displayed name. After opening a
package, take the GUID from `output.nodes[].node_id` of a fresh
`megaladata_dock_workspace_observe` of the graph and build
`target.ref={document_id,workflow_id,node_id}` with the current preparation.
If the ID was not issued, read the whole observed `cmpDiagram` through fresh
`root_ref` and `observation_id`; a node name does not replace a missing ID.
Take the document and workflow identity from the current preparation. Do not
reconstruct `tab_tid` or `navigation_path`.

To continue, pass only the original operation ID to
`megaladata_dock_node_resume`. For a fresh execution and a read of a confirmed
node, use `megaladata_dock_node_read` with the `source_operation_id` of a
successful local operation. That tool does not accept formulas and does not
open the configuration wizard.

Compare the settings readback, the links, and the output schemas with the
task. `sample_complete=false` means the table is incomplete. Exact numeric
reads, Cross Table category reconciliation, and the limits of a full read are
described in the [work order](workflow.md). The number of visible graph
elements does not prove that the links or the calculations are correct.
