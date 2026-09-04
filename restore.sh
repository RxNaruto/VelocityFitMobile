#!/usr/bin/env bash
# Rebuilds the VelocityFit-Mobile project from the markdown bundle.
#
#   ./restore.sh
#   ./restore.sh ./VELOCITYFIT-MOBILE-SOURCE.md ./VELOCITYFIT-MOBILE-ASSETS.md ./VelocityFit-Mobile

set -euo pipefail

SOURCE="${1:-./VELOCITYFIT-MOBILE-SOURCE.md}"
ASSETS="${2:-./VELOCITYFIT-MOBILE-ASSETS.md}"
DESTINATION="${3:-./VelocityFit-Mobile}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required. Install it with: xcode-select --install" >&2
  exit 1
fi

restore_bundle() {
  local markdown_path="$1"
  local out_root="$2"

  if [[ ! -f "$markdown_path" ]]; then
    echo "Bundle not found: $markdown_path" >&2
    exit 1
  fi

  python3 - "$markdown_path" "$out_root" <<'PY'
import os
import sys
import base64

markdown_path, out_root = sys.argv[1], sys.argv[2]
fence = "`" * 6
count = 0

with open(markdown_path, "r", encoding="utf-8") as f:
    lines = f.read().splitlines()

i = 0
while i < len(lines):
    line = lines[i]
    if line.startswith("<!-- FILE: ") and line.endswith(" -->"):
        rel_path = line[len("<!-- FILE: "):-len(" -->")]
        if i + 1 >= len(lines):
            raise SystemExit(f"Expected a fence after the marker for {rel_path}")
        fence_line = lines[i + 1]
        if not fence_line.startswith(fence):
            raise SystemExit(
                f"Expected a fence after the marker for {rel_path} but found: {fence_line}"
            )
        is_base64 = fence_line[len(fence):].strip() == "base64"
        i += 2
        body = []
        while i < len(lines) and lines[i] != fence:
            body.append(lines[i])
            i += 1
        if i >= len(lines):
            raise SystemExit(f"Unterminated block for {rel_path}")

        target = os.path.join(out_root, rel_path)
        parent = os.path.dirname(target)
        if parent:
            os.makedirs(parent, exist_ok=True)

        if is_base64:
            with open(target, "wb") as out:
                out.write(base64.b64decode("".join(body)))
        else:
            with open(target, "w", encoding="utf-8", newline="\n") as out:
                out.write("\n".join(body) + "\n")
        count += 1
    i += 1

print(count)
PY
}

mkdir -p "$DESTINATION"
root="$(cd "$DESTINATION" && pwd)"

n1="$(restore_bundle "$SOURCE" "$root")"
echo "Restored $n1 source files"

if [[ -f "$ASSETS" ]]; then
  n2="$(restore_bundle "$ASSETS" "$root")"
  echo "Restored $n2 asset files"
else
  echo "Warning: No assets bundle at $ASSETS - the app will build but have no icons." >&2
fi

echo
echo "Project restored to $root"
echo "Next: cd into it, then 'npm install --legacy-peer-deps'"
