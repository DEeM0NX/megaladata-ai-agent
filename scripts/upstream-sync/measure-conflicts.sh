#!/usr/bin/env bash
# Reproducible measurement of how connected the fork is to upstream (OpenCode).
#
# Metric: number of paths left unmerged after a clean trial merge
#   git merge --no-commit --no-ff -s ort <UPSTREAM_SHA>
# in a fork worktree at FORK_SHA. The metric is `git diff --name-only --diff-filter=U`.
#
# What is pinned, and why (checked on git 2.43.0):
#   - SHAs, not branch or tag names: names can move;
#   - isolated git config (GIT_CONFIG_GLOBAL/NOSYSTEM), a fixed identity,
#     rerere off: saved conflict resolutions must not lower the count;
#   - `-s ort` and merge.directoryRenames=conflict: with `true`/`false` the "file location"
#     paths (6 of them) disappear, so the metric could be "improved" by config rather than code;
#   - merge.renames=false and `-X no-renames` are ignored by git 2.43's ort strategy
#     (on a synthetic repository the merge still detects the rename),
#     so the metric does not depend on them; the git version is printed in the report;
#   - a rename-limit warning fails the measurement, it is not "0 conflicts";
#   - the merge exit code must be 0 or 1, and MERGE_HEAD must equal UPSTREAM_SHA;
#   - merge= attributes in the fork .gitattributes fail the run (they can hide conflicts).
#
# Usage:
#   FORK_SHA=<full SHA> UPSTREAM_TAG=<tag> UPSTREAM_SHA=<full SHA> \
#     scripts/upstream-sync/measure-conflicts.sh [--out DIR] [--repo DIR] [--compare FILE] [--keep]
# Environment (SHA and tag are required: a branch or tag name can move, so there are no defaults;
# the LAB-198 starting point is scripts/upstream-sync/reference/lab-198-baseline.env):
#   FORK_URL, FORK_SHA, UPSTREAM_URL, UPSTREAM_TAG, UPSTREAM_SHA
# --repo DIR  use an existing clone that already has both commits (otherwise a clean clone in $OUT/clone);
#             the merge still runs in a separate temporary worktree (git worktree).
# --compare   compare the path list with a baseline; a mismatch exits 3.
set -euo pipefail

FORK_URL=${FORK_URL:?FORK_URL is required}
UPSTREAM_URL=${UPSTREAM_URL:-https://github.com/anomalyco/opencode.git}
: "${FORK_SHA:?FORK_SHA (full 40-hex commit) is required}"
: "${UPSTREAM_TAG:?UPSTREAM_TAG is required}"
: "${UPSTREAM_SHA:?UPSTREAM_SHA (full 40-hex commit) is required}"

OUT=./sync-measure-out
REPO=
COMPARE=
KEEP=0
while [ $# -gt 0 ]; do
  case $1 in
    --out) OUT=$2; shift 2 ;;
    --repo) REPO=$2; shift 2 ;;
    --compare) COMPARE=$2; shift 2 ;;
    --keep) KEEP=1; shift ;;
    -h|--help) sed -n '2,36p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

die() { echo "ERROR: $*" >&2; exit 1; }

# Isolate from the user and system git configuration.
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_TERMINAL_PROMPT=0 LC_ALL=C
export GIT_AUTHOR_NAME=sync-measure GIT_AUTHOR_EMAIL=sync-measure@example.invalid
export GIT_COMMITTER_NAME=sync-measure GIT_COMMITTER_EMAIL=sync-measure@example.invalid
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_ATTR_SOURCE

mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd)
rm -f "$OUT"/{meta.env,unmerged-paths.txt,conflicts.tsv,conflict-lines.txt,merge-output.log,summary.md,SHA256SUMS}

if [ -z "$REPO" ]; then
  REPO=$OUT/clone
  if [ ! -d "$REPO/.git" ]; then
    git clone --quiet --no-checkout "$FORK_URL" "$REPO"
  fi
  git -C "$REPO" fetch --quiet --no-tags "$UPSTREAM_URL" "refs/tags/$UPSTREAM_TAG:refs/upstream-measure/$UPSTREAM_TAG"
fi
REPO=$(cd "$REPO" && pwd)

# Both commits must exist and match the given SHAs in full.
fork_resolved=$(git -C "$REPO" rev-parse --verify --quiet "$FORK_SHA^{commit}") || die "fork commit $FORK_SHA is missing in $REPO"
[ "$fork_resolved" = "$FORK_SHA" ] || die "FORK_SHA must be complete: $FORK_SHA -> $fork_resolved"
up_resolved=$(git -C "$REPO" rev-parse --verify --quiet "$UPSTREAM_SHA^{commit}") || die "upstream commit $UPSTREAM_SHA is missing in $REPO"
[ "$up_resolved" = "$UPSTREAM_SHA" ] || die "UPSTREAM_SHA must be complete: $UPSTREAM_SHA -> $up_resolved"
if tag_sha=$(git -C "$REPO" rev-parse --verify --quiet "refs/upstream-measure/$UPSTREAM_TAG^{commit}" 2>/dev/null); then
  [ "$tag_sha" = "$UPSTREAM_SHA" ] || die "tag $UPSTREAM_TAG points at $tag_sha, expected $UPSTREAM_SHA"
fi
merge_base=$(git -C "$REPO" merge-base "$FORK_SHA" "$UPSTREAM_SHA") || die "the fork and upstream have no common ancestor"

# Guard against "improving" the metric: a merge= attribute in the fork tree changes file merge.
attr_files=$(git -C "$REPO" ls-tree -r --name-only "$FORK_SHA" | grep -E '(^|/)\.gitattributes$' || true)
for f in $attr_files; do
  if git -C "$REPO" show "$FORK_SHA:$f" | grep -Eq '(^|[[:space:]])-?merge(=|[[:space:]]|$)'; then
    die "$f has a merge attribute — the metric is not trustworthy"
  fi
done

WT=$(mktemp -d "${TMPDIR:-/tmp}/sync-measure-wt.XXXXXX")
cleanup() {
  git -C "$WT" merge --abort >/dev/null 2>&1 || true
  git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1 || rm -rf "$WT"
  git -C "$REPO" worktree prune >/dev/null 2>&1 || true
}
if [ "$KEEP" = 0 ]; then trap cleanup EXIT; fi
rmdir "$WT"
git -C "$REPO" worktree add --quiet --detach "$WT" "$FORK_SHA"

MERGE_CFG=(-c rerere.enabled=false -c merge.directoryRenames=conflict -c merge.conflictStyle=merge
  -c merge.renameLimit=30000 -c diff.renameLimit=30000 -c merge.renormalize=false
  -c core.autocrlf=false -c core.safecrlf=false -c core.ignorecase=false -c core.fsmonitor=false
  -c core.hooksPath=/dev/null -c gc.auto=0)

set +e
git -C "$WT" "${MERGE_CFG[@]}" merge --no-commit --no-ff -s ort "$UPSTREAM_SHA" >"$OUT/merge-output.log" 2>&1
rc=$?
set -e
[ "$rc" = 0 ] || [ "$rc" = 1 ] || { cat "$OUT/merge-output.log" >&2; die "git merge returned $rc (expected 0 or 1) — the measurement is invalid"; }
git -C "$WT" rev-parse -q --verify MERGE_HEAD >"$OUT/.merge_head" || die "MERGE_HEAD is missing after merge — the measurement is invalid"
[ "$(cat "$OUT/.merge_head")" = "$UPSTREAM_SHA" ] || die "MERGE_HEAD does not match UPSTREAM_SHA"
rm -f "$OUT/.merge_head"
if grep -Eiq 'warning:.*(rename|renameLimit)' "$OUT/merge-output.log"; then
  die "git reported a rename-search limit — the result is invalid (see merge-output.log)"
fi

git -C "$WT" diff --name-only --diff-filter=U | sort >"$OUT/unmerged-paths.txt"
count=$(wc -l <"$OUT/unmerged-paths.txt" | tr -d ' ')
grep '^CONFLICT' "$OUT/merge-output.log" | sort >"$OUT/conflict-lines.txt" || true
conflict_lines=$(wc -l <"$OUT/conflict-lines.txt" | tr -d ' ')

# Table: path, index stage mask (1=base, 2=fork, 3=upstream), conflict type from the git message.
git -C "$WT" ls-files -u | awk -F'\t' '{split($1,a," "); m[$2]=m[$2] a[3]} END{for(p in m) print p "\t" m[p]}' | sort >"$OUT/.stages.tsv"
awk -F'\t' '
  FNR==NR { st[$1]=$2; next }
  { line=$0
    if (match(line, /^CONFLICT \(content\): Merge conflict in /))      { p=substr(line, RLENGTH+1); t["content"]; ty[p]=(ty[p]?ty[p]",":"") "content" }
    else if (match(line, /^CONFLICT \(modify\/delete\): /))            { p=substr(line, RLENGTH+1); sub(/ deleted in .*/, "", p); ty[p]=(ty[p]?ty[p]",":"") "modify/delete" }
    else if (match(line, /^CONFLICT \(rename\/delete\): /))            { p=substr(line, RLENGTH+1); sub(/ renamed to /, "\t", p); split(p, q, "\t"); sub(/ in HEAD.*/, "", q[2]); ty[q[2]]=(ty[q[2]]?ty[q[2]]",":"") "rename/delete" }
    else if (match(line, /^CONFLICT \(file location\): /))             { p=substr(line, RLENGTH+1); sub(/.*should perhaps be moved to /, "", p); sub(/\.$/, "", p); ty[p]=(ty[p]?ty[p]",":"") "file-location" }
    else if (match(line, /^CONFLICT \(add\/add\): Merge conflict in /)) { p=substr(line, RLENGTH+1); ty[p]=(ty[p]?ty[p]",":"") "add/add" }
    else { other[++n]=line }
  }
  END { for (p in st) printf "%s\t%s\t%s\n", p, st[p], (p in ty ? ty[p] : "unknown") }
' "$OUT/.stages.tsv" "$OUT/conflict-lines.txt" | sort >"$OUT/conflicts.tsv"
rm -f "$OUT/.stages.tsv"
unknown=$(awk -F'\t' '$3=="unknown"' "$OUT/conflicts.tsv" | wc -l | tr -d ' ')
[ "$(wc -l <"$OUT/conflicts.tsv" | tr -d ' ')" = "$count" ] || die "type table ($(wc -l <"$OUT/conflicts.tsv")) does not match the path count ($count)"

paths_sha=$(sha256sum "$OUT/unmerged-paths.txt" | cut -d' ' -f1)
{
  echo "fork_url=$FORK_URL"
  echo "fork_sha=$FORK_SHA"
  echo "upstream_url=$UPSTREAM_URL"
  echo "upstream_tag=$UPSTREAM_TAG"
  echo "upstream_sha=$UPSTREAM_SHA"
  echo "merge_base=$merge_base"
  echo "fork_only_commits=$(git -C "$REPO" rev-list --count "$FORK_SHA" "^$UPSTREAM_SHA")"
  echo "upstream_only_commits=$(git -C "$REPO" rev-list --count "$UPSTREAM_SHA" "^$FORK_SHA")"
  echo "git_version=$(git --version)"
  echo "merge_rc=$rc"
  echo "unmerged_paths=$count"
  echo "conflict_lines=$conflict_lines"
  echo "paths_sha256=$paths_sha"
} >"$OUT/meta.env"

{
  echo "# Measurement: trial merge of $UPSTREAM_TAG into the fork"
  echo
  echo "- fork: \`$FORK_SHA\`; upstream: \`$UPSTREAM_SHA\` ($UPSTREAM_TAG); merge base: \`$merge_base\`"
  echo "- $(git --version); ort strategy; merge.directoryRenames=conflict; rerere off"
  echo "- **unmerged paths: $count** (CONFLICT lines: $conflict_lines; list SHA-256: \`$paths_sha\`)"
  echo
  echo "## By type (from git messages)"
  echo
  awk -F'\t' '{n[$3]++} END{for(k in n) printf "| %s | %d |\n", k, n[k]}' "$OUT/conflicts.tsv" | sort | sed '1i | type | paths |\n|---|---|'
  echo
  echo "## By path group"
  echo
  awk -F'\t' '{p=$1; g="other"
    if (p ~ /(^|\/)package\.json$/) g="package.json"
    else if (p == "bun.lock") g="bun.lock"
    else if (p ~ /^\.github\//) g=".github"
    else if (p ~ /^packages\/agent\/test\//) g="packages/agent/test"
    else if (p ~ /^packages\/agent\//) g="packages/agent (src, script)"
    else if (p ~ /^packages\/(console|stats)\//) { split(p,a,"/"); g="packages/" a[2] }
    else if (p ~ /^packages\//) { split(p,a,"/"); g="packages/" a[2] }
    n[g]++} END{for(k in n) printf "| %s | %d |\n", k, n[k]}' "$OUT/conflicts.tsv" | sort | sed '1i | group | paths |\n|---|---|'
  echo
  echo "CONFLICT lines exceed the path count by $((conflict_lines - count)): rename/delete paths produce two lines"
  echo "(rename/delete on the old path and modify/delete on the new one); one path is counted."
  if [ "$unknown" != 0 ]; then echo; echo "WARNING: paths with an unrecognized type: $unknown (see conflicts.tsv)"; fi
} >"$OUT/summary.md"

(cd "$OUT" && sha256sum meta.env unmerged-paths.txt conflicts.tsv conflict-lines.txt >SHA256SUMS)

echo "unmerged paths: $count (CONFLICT lines: $conflict_lines); result: $OUT"
if [ -n "$COMPARE" ]; then
  if diff -u "$COMPARE" "$OUT/unmerged-paths.txt"; then
    echo "MATCH with baseline $COMPARE"
  else
    echo "MISMATCH with baseline $COMPARE" >&2; exit 3
  fi
fi
