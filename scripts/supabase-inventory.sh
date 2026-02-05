#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi
BASE_DIR="$ROOT_DIR/docs/supabase-inventory"
DOC_FILE="$ROOT_DIR/docs/supabase-inventory.md"
PROJECT_REF="${1:-${SUPABASE_PROJECT_REF:-}}"

if [[ -z "$PROJECT_REF" ]]; then
  echo "Usage: SUPABASE_PROJECT_REF=<project_ref> $0"
  echo "Or pass the project ref as the first argument."
  exit 1
fi

run_id="$(date +"%Y%m%d-%H%M%S")"
OUT_DIR="$BASE_DIR/$run_id"
mkdir -p "$OUT_DIR"

timestamp_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
timestamp_local="$(date +"%Y-%m-%d %H:%M:%S %Z")"

if [[ -z "${SUPABASE_DB_URL:-}" ]] && [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  db_host="${SUPABASE_DB_HOST:-db.${PROJECT_REF}.supabase.co}"
  db_name="${SUPABASE_DB_NAME:-postgres}"
  db_user="${SUPABASE_DB_USER:-postgres}"
  db_port="${SUPABASE_DB_PORT:-5432}"
  db_pass_enc="$(python3 - <<'PY'
import os, urllib.parse
pw = os.environ.get("SUPABASE_DB_PASSWORD", "")
print(urllib.parse.quote(pw, safe=""))
PY
)"
  export SUPABASE_DB_URL="postgresql://${db_user}:${db_pass_enc}@${db_host}:${db_port}/${db_name}"
fi

echo "Linking project: $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF" --workdir "$ROOT_DIR" >/dev/null

schema_file="$OUT_DIR/schema.sql"
if [[ -n "${SUPABASE_DB_URL:-}" ]] && command -v pg_dump >/dev/null 2>&1; then
  echo "Dumping schema via pg_dump (no Docker)..."
  pg_dump --schema-only --no-owner --no-privileges "$SUPABASE_DB_URL" > "$schema_file"
else
  echo "Schema dump skipped: Docker disabled and SUPABASE_DB_URL/pg_dump not available."
  echo "Set SUPABASE_DB_URL and install pg_dump to enable schema dump without Docker."
fi

echo "Listing edge functions..."
supabase functions list --project-ref "$PROJECT_REF" --workdir "$ROOT_DIR" -o json > "$OUT_DIR/functions.json"

echo "Listing storage buckets/paths..."
supabase storage ls --linked --experimental --workdir "$ROOT_DIR" -o json > "$OUT_DIR/storage.json"

if [[ -n "${SUPABASE_DB_URL:-}" ]] && command -v psql >/dev/null 2>&1; then
  echo "Collecting database inventory via psql..."
  run_query() {
    local name="$1"
    local sql="$2"
    psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -A -F $'\t' -P pager=off -q -c "$sql" > "$OUT_DIR/$name.tsv"
  }

  run_query "schemas" "
    select schema_name
    from information_schema.schemata
    where schema_name not in ('pg_catalog','information_schema')
    order by schema_name;
  "

  run_query "tables" "
    select table_schema, table_name, table_type
    from information_schema.tables
    where table_schema not in ('pg_catalog','information_schema')
    order by table_schema, table_name;
  "

  run_query "columns" "
    select table_schema, table_name, column_name, data_type, udt_name,
           is_nullable, column_default, character_maximum_length,
           numeric_precision, numeric_scale
    from information_schema.columns
    where table_schema not in ('pg_catalog','information_schema')
    order by table_schema, table_name, ordinal_position;
  "

  run_query "constraints" "
    select tc.table_schema, tc.table_name, tc.constraint_name, tc.constraint_type,
           kcu.column_name, ccu.table_schema as foreign_table_schema,
           ccu.table_name as foreign_table_name, ccu.column_name as foreign_column_name
    from information_schema.table_constraints tc
    left join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.table_schema = kcu.table_schema
     and tc.table_name = kcu.table_name
    left join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name
     and tc.table_schema = ccu.table_schema
    where tc.table_schema not in ('pg_catalog','information_schema')
    order by tc.table_schema, tc.table_name, tc.constraint_name;
  "

  run_query "indexes" "
    select schemaname, tablename, indexname, indexdef
    from pg_indexes
    where schemaname not in ('pg_catalog','information_schema')
    order by schemaname, tablename, indexname;
  "

  run_query "policies" "
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    order by schemaname, tablename, policyname;
  "

  run_query "triggers" "
    select event_object_schema, event_object_table, trigger_name, action_timing,
           event_manipulation, action_statement
    from information_schema.triggers
    where event_object_schema not in ('pg_catalog','information_schema')
    order by event_object_schema, event_object_table, trigger_name;
  "

  run_query "functions" "
    select n.nspname as schema, p.proname as function_name,
           pg_get_function_arguments(p.oid) as arguments,
           pg_get_function_result(p.oid) as returns
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname not in ('pg_catalog','information_schema')
    order by n.nspname, p.proname;
  "
fi

cat > "$DOC_FILE" <<EOF
# Supabase Inventory

Generated (Local): $timestamp_local
Generated (UTC): $timestamp_utc
Project Ref: \`$PROJECT_REF\`
Latest Run Folder: \`docs/supabase-inventory/$run_id\`

## Contents (Latest Run)
- Schema dump: \`docs/supabase-inventory/$run_id/schema.sql\`
- Edge functions: \`docs/supabase-inventory/$run_id/functions.json\`
- Storage listing: \`docs/supabase-inventory/$run_id/storage.json\`

## Database Detail (Latest Run)
- Schemas: \`docs/supabase-inventory/$run_id/schemas.tsv\`
- Tables: \`docs/supabase-inventory/$run_id/tables.tsv\`
- Columns: \`docs/supabase-inventory/$run_id/columns.tsv\`
- Constraints: \`docs/supabase-inventory/$run_id/constraints.tsv\`
- Indexes: \`docs/supabase-inventory/$run_id/indexes.tsv\`
- RLS Policies: \`docs/supabase-inventory/$run_id/policies.tsv\`
- Triggers: \`docs/supabase-inventory/$run_id/triggers.tsv\`
- Functions: \`docs/supabase-inventory/$run_id/functions.tsv\`

## Notes
- Re-run \`scripts/supabase-inventory.sh\` to refresh. Each run is stored in a timestamped folder.
- This script is Docker-free. For schema + deep DB introspection, set \`SUPABASE_DB_URL\` and ensure \`psql\` and \`pg_dump\` are installed.
EOF

echo "$run_id" > "$BASE_DIR/latest.txt"

python3 - <<'PY'
import json, pathlib
base = pathlib.Path("docs/supabase-inventory")
run_id = (base / "latest.txt").read_text().strip()
run_dir = base / run_id

def json_count(path: pathlib.Path) -> int:
    if not path.exists():
        return 0
    try:
        data = json.loads(path.read_text() or "[]")
        if isinstance(data, list):
            return len(data)
        return len(data.keys()) if isinstance(data, dict) else 0
    except Exception:
        return 0

def tsv_rows(path: pathlib.Path) -> int:
    if not path.exists():
        return 0
    return sum(1 for _ in path.read_text().splitlines() if _.strip())

summary = []
summary.append("## Quick Summary (Latest Run)")
summary.append(f"- Edge functions: {json_count(run_dir / 'functions.json')}")
summary.append(f"- Storage entries: {json_count(run_dir / 'storage.json')}")
summary.append(f"- Schemas: {tsv_rows(run_dir / 'schemas.tsv')}")
summary.append(f"- Tables: {tsv_rows(run_dir / 'tables.tsv')}")
summary.append(f"- Columns: {tsv_rows(run_dir / 'columns.tsv')}")
summary.append(f"- Constraints: {tsv_rows(run_dir / 'constraints.tsv')}")
summary.append(f"- Indexes: {tsv_rows(run_dir / 'indexes.tsv')}")
summary.append(f"- RLS Policies: {tsv_rows(run_dir / 'policies.tsv')}")
summary.append(f"- Triggers: {tsv_rows(run_dir / 'triggers.tsv')}")
summary.append(f"- DB Functions: {tsv_rows(run_dir / 'functions.tsv')}")

doc = pathlib.Path("docs/supabase-inventory.md")
doc.write_text(doc.read_text().rstrip() + "\n\n" + "\n".join(summary) + "\n")
PY

echo "Inventory written to: $DOC_FILE"
