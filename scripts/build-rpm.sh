#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"

if [[ ${1:-} == --help ]]; then
  cat <<'EOF'
Usage: scripts/build-rpm.sh [output-directory]

Build the trimmed Java runtime and x86_64 RPM in a UBI 9 container.
Defaults to build/container. Requires Git, tar, and Docker or Podman.
Set CONTAINER_ENGINE=docker or CONTAINER_ENGINE=podman to select the engine.
Builds the current contents of tracked files; untracked files are excluded.
EOF
  exit 0
fi
if (( $# > 1 )); then
  echo "Usage: scripts/build-rpm.sh [output-directory]" >&2
  exit 1
fi

engine=${CONTAINER_ENGINE:-}
if [[ -z $engine ]]; then
  if command -v docker >/dev/null 2>&1; then
    engine=docker
  else
    engine=podman
  fi
fi
command -v "$engine" >/dev/null 2>&1 || {
  echo "Install Docker or Podman, or set CONTAINER_ENGINE to an available engine." >&2
  exit 1
}

version=$(git describe)
output_dir=${1:-build/container}
mkdir -p "$output_dir"
output_dir=$(cd "$output_dir" && pwd)
context_dir=$(mktemp -d)
container_id=
image_id=
cleanup() {
  if [[ -n $container_id ]]; then
    "$engine" rm "$container_id" >/dev/null 2>&1 || true
  fi
  if [[ -n $image_id ]]; then
    "$engine" rmi "$image_id" >/dev/null 2>&1 || true
  fi
  rm -rf "$context_dir"
}
trap cleanup EXIT

# A fresh context avoids reusing host-built runtimes, node_modules, local
# settings, and other untracked files. Include modifications to tracked files.
git ls-files -z | tar --null -T - -cf - | tar -xf - -C "$context_dir"
cp packaging/Containerfile "$context_dir/Containerfile"

"$engine" build --platform linux/amd64 \
  --build-arg "ANET_VERSION=$version" \
  --iidfile "$context_dir/image-id" \
  -f "$context_dir/Containerfile" "$context_dir"
image_id=$(cat "$context_dir/image-id")
container_id=$("$engine" create "$image_id")
"$engine" cp "$container_id:/artifacts/." "$output_dir/"
echo "Runtime, application image, and RPM exported to $output_dir"
