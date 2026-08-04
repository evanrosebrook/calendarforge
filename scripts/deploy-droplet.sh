#!/usr/bin/env bash

set -Eeuo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

ssh_host=${CALENDARFORGE_SSH_HOST:-calendarforge-droplet}
remote_dir=${CALENDARFORGE_REMOTE_DIR:-/var/snap/docker/common/calendarforge}
site_url=${NEXT_PUBLIC_SITE_URL:-https://calendarforge.net}
analytics_id=${NEXT_PUBLIC_GA_MEASUREMENT_ID:-G-MMP15FDWR4}
image_repository=${CALENDARFORGE_IMAGE_REPOSITORY:-calendarforge}
build_attempts=${CALENDARFORGE_BUILD_ATTEMPTS:-2}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

for command_name in curl docker git gzip npm scp ssh; do
  require_command "$command_name"
done

if [[ -n ${CALENDARFORGE_VERSION:-} ]]; then
  version=$CALENDARFORGE_VERSION
else
  timestamp=$(date -u +%Y%m%d-%H%M%S)
  revision=$(git rev-parse --short=12 HEAD 2>/dev/null || printf 'nogit')
  dirty_suffix=
  if [[ -n $(git status --porcelain --untracked-files=normal) ]]; then
    dirty_suffix=-dirty
    echo "Warning: the working tree is dirty; this image cannot be reproduced from Git alone." >&2
  fi
  version="${timestamp}-${revision}${dirty_suffix}"
fi

if [[ ! $version =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]]; then
  echo "Invalid CALENDARFORGE_VERSION: $version" >&2
  exit 1
fi

if [[ ! $build_attempts =~ ^[1-9][0-9]*$ ]]; then
  echo "CALENDARFORGE_BUILD_ATTEMPTS must be a positive integer" >&2
  exit 1
fi

if [[ ! $analytics_id =~ ^G-[A-Z0-9]+$ ]]; then
  echo "Invalid NEXT_PUBLIC_GA_MEASUREMENT_ID: $analytics_id" >&2
  exit 1
fi

image_ref="${image_repository}:${version}"
smoke_container="calendarforge-smoke-$$"

cleanup_smoke_container() {
  if docker ps -a --format '{{.Names}}' | grep -Fqx "$smoke_container"; then
    docker rm -f "$smoke_container" >/dev/null
  fi
}
trap cleanup_smoke_container EXIT

echo "Deploying $image_ref to $ssh_host"

if [[ ${CALENDARFORGE_SKIP_CHECKS:-0} != 1 ]]; then
  npm test
  npm run lint
fi

build_succeeded=0
for ((attempt = 1; attempt <= build_attempts; attempt += 1)); do
  echo "Building linux/amd64 image (attempt $attempt/$build_attempts)"
  if DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build \
    --platform linux/amd64 \
    --build-arg "NEXT_PUBLIC_SITE_URL=$site_url" \
    --build-arg "NEXT_PUBLIC_GA_MEASUREMENT_ID=$analytics_id" \
    --tag "$image_ref" \
    .; then
    build_succeeded=1
    break
  fi
done

if [[ $build_succeeded != 1 ]]; then
  echo "Image build failed after $build_attempts attempts" >&2
  exit 1
fi

docker run --rm -d \
  --name "$smoke_container" \
  --platform linux/amd64 \
  --memory 512m \
  --cpus 0.75 \
  --pids-limit 100 \
  --read-only \
  --tmpfs /tmp:size=64m,mode=1777 \
  --tmpfs /app/.next/cache:size=64m,uid=1001,gid=1001 \
  --cap-drop ALL \
  --env NODE_OPTIONS=--max-old-space-size=384 \
  --publish 127.0.0.1::3000 \
  "$image_ref" >/dev/null

smoke_port=$(docker port "$smoke_container" 3000/tcp | awk -F: 'NR == 1 { print $NF }')
if [[ ! $smoke_port =~ ^[0-9]+$ ]]; then
  echo "Could not determine the local smoke-test port" >&2
  exit 1
fi

for ((attempt = 1; attempt <= 30; attempt += 1)); do
  if curl --fail --silent --show-error --output /dev/null "http://127.0.0.1:${smoke_port}/"; then
    break
  fi
  if [[ $attempt == 30 ]]; then
    docker logs "$smoke_container" >&2
    echo "Local container did not become ready" >&2
    exit 1
  fi
  sleep 1
done

smoke_home=$(curl --fail --silent --show-error "http://127.0.0.1:${smoke_port}/")
grep -Fq "$site_url" <<<"$smoke_home"
grep -Fq "$analytics_id" <<<"$smoke_home"
curl --fail --silent --show-error --output /dev/null \
  "http://127.0.0.1:${smoke_port}/api/export/pdf?year=2026&month=8"
curl --fail --silent --show-error --output /dev/null \
  "http://127.0.0.1:${smoke_port}/holidays/us/2047"
if docker logs "$smoke_container" 2>&1 | grep -Fq 'Failed to update prerender cache'; then
  docker logs "$smoke_container" >&2
  echo "Read-only container attempted a prerender-cache write" >&2
  exit 1
fi
cleanup_smoke_container

echo "Transferring $image_ref"
docker save "$image_ref" | gzip -1 | ssh "$ssh_host" 'gunzip | docker load'

ssh "$ssh_host" "install -d -m 755 '$remote_dir'"
remote_candidate="$remote_dir/compose.candidate-${version}.yaml"
scp compose.prod.yaml "${ssh_host}:${remote_candidate}"

ssh "$ssh_host" bash -s -- "$version" "$remote_dir" "$image_repository" "$analytics_id" <<'REMOTE_DEPLOY'
set -Eeuo pipefail

version=$1
deploy_dir=$2
image_repository=$3
analytics_id=$4
compose_candidate="$deploy_dir/compose.candidate-${version}.yaml"
compose_file="$deploy_dir/compose.yaml"
env_file="$deploy_dir/.env"
env_candidate="$deploy_dir/.env.candidate-${version}"
compose_before="$deploy_dir/.compose.before-${version}.yaml"
env_before="$deploy_dir/.env.before-${version}"
compose_rollback="$deploy_dir/compose.rollback.yaml"
env_rollback="$deploy_dir/.env.rollback"
container_name=calendarforge-calendarforge-1

for command_name in curl docker flock; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "Required remote command not found: $command_name" >&2
    exit 1
  }
done

exec 9>"$deploy_dir/.deploy.lock"
if ! flock -n 9; then
  echo "Another CalendarForge deployment is running" >&2
  exit 1
fi

cleanup_candidates() {
  rm -f "$compose_candidate" "$env_candidate" "$compose_before" "$env_before"
}
trap cleanup_candidates EXIT

previous_image=$(docker inspect "$container_name" --format '{{.Config.Image}}' 2>/dev/null || true)
previous_version=
if [[ $previous_image == "$image_repository":* ]]; then
  previous_version=${previous_image#"$image_repository":}
fi

printf 'CALENDARFORGE_VERSION=%s\n' "$version" > "$env_candidate"
docker image inspect "$image_repository:$version" >/dev/null
docker compose --env-file "$env_candidate" -f "$compose_candidate" config --quiet

if [[ -f $compose_file ]]; then
  cp -a "$compose_file" "$compose_before"
fi
if [[ -f $env_file ]]; then
  cp -a "$env_file" "$env_before"
elif [[ -n $previous_version ]]; then
  printf 'CALENDARFORGE_VERSION=%s\n' "$previous_version" > "$env_before"
fi

install -m 644 "$compose_candidate" "$compose_file"
install -m 600 "$env_candidate" "$env_file"

wait_for_health() {
  local attempt health
  for ((attempt = 1; attempt <= 60; attempt += 1)); do
    health=$(docker inspect "$container_name" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>/dev/null || true)
    [[ $health == healthy ]] && return 0
    [[ $health == unhealthy ]] && return 1
    sleep 1
  done
  return 1
}

restore_previous() {
  echo "Restoring the previous deployment" >&2
  if [[ -f $compose_before && -f $env_before ]]; then
    install -m 644 "$compose_before" "$compose_file"
    install -m 600 "$env_before" "$env_file"
    docker compose --env-file "$env_file" -f "$compose_file" up -d --no-build --force-recreate
    wait_for_health
  else
    echo "No previous deployment snapshot is available" >&2
    return 1
  fi
}

if ! docker compose --env-file "$env_file" -f "$compose_file" up -d --no-build --force-recreate; then
  restore_previous || true
  exit 1
fi

if ! wait_for_health; then
  docker logs --tail 100 "$container_name" >&2 || true
  restore_previous || true
  exit 1
fi

running_image=$(docker inspect "$container_name" --format '{{.Config.Image}}')
if [[ $running_image != "$image_repository:$version" ]]; then
  echo "Expected $image_repository:$version, found $running_image" >&2
  restore_previous || true
  exit 1
fi

if ! live_home=$(curl --fail --silent --show-error \
  --resolve calendarforge.net:443:127.0.0.1 \
  https://calendarforge.net/); then
  restore_previous || true
  exit 1
fi

if ! grep -Fq 'https://calendarforge.net' <<<"$live_home" \
  || ! grep -Fq "$analytics_id" <<<"$live_home"; then
  restore_previous || true
  exit 1
fi

if ! curl --fail --silent --show-error --output /dev/null \
  --resolve calendarforge.net:443:127.0.0.1 \
  'https://calendarforge.net/api/export/pdf?year=2026&month=8'; then
  restore_previous || true
  exit 1
fi

if ! curl --fail --silent --show-error --output /dev/null \
  --resolve calendarforge.net:443:127.0.0.1 \
  'https://calendarforge.net/holidays/us/2047'; then
  restore_previous || true
  exit 1
fi

if docker logs "$container_name" 2>&1 | grep -Fq 'Failed to update prerender cache'; then
  docker logs --tail 100 "$container_name" >&2 || true
  restore_previous || true
  exit 1
fi

if [[ -f $compose_before && -f $env_before ]]; then
  install -m 644 "$compose_before" "$compose_rollback"
  install -m 600 "$env_before" "$env_rollback"
fi

echo "Deployed $image_repository:$version"
REMOTE_DEPLOY

echo "Deployment complete: $image_ref"
