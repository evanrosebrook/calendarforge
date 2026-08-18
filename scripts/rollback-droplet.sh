#!/usr/bin/env bash

set -Eeuo pipefail

ssh_host=${CALENDARFORGE_SSH_HOST:-calendarforge-droplet}
remote_dir=${CALENDARFORGE_REMOTE_DIR:-/var/snap/docker/common/calendarforge}

command -v ssh >/dev/null 2>&1 || {
  echo "Required command not found: ssh" >&2
  exit 1
}

ssh "$ssh_host" bash -s -- "$remote_dir" <<'REMOTE_ROLLBACK'
set -Eeuo pipefail

deploy_dir=$1
compose_file="$deploy_dir/compose.yaml"
env_file="$deploy_dir/.env"
compose_rollback="$deploy_dir/compose.rollback.yaml"
env_rollback="$deploy_dir/.env.rollback"
apache_rollback="$deploy_dir/apache.rollback.conf"
compose_current="$deploy_dir/.compose.current.yaml"
env_current="$deploy_dir/.env.current"
apache_current="$deploy_dir/.apache.current.conf"
apache_site=/etc/apache2/sites-available/calendarforge.net.conf
container_name=calendarforge-calendarforge-1

for command_name in apache2ctl curl docker flock install systemctl; do
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

for required_file in "$compose_file" "$env_file" "$compose_rollback" "$env_rollback" "$apache_site" "$apache_rollback"; do
  if [[ ! -f $required_file ]]; then
    echo "Rollback state is missing: $required_file" >&2
    exit 1
  fi
done

cleanup_snapshots() {
  rm -f "$compose_current" "$env_current" "$apache_current"
}
trap cleanup_snapshots EXIT

cp -a "$compose_file" "$compose_current"
cp -a "$env_file" "$env_current"
cp -a "$apache_site" "$apache_current"
install -m 644 "$apache_rollback" "$apache_site"

if ! apache2ctl configtest || ! systemctl reload apache2; then
  echo "Rollback Apache configuration is invalid; restoring the active configuration" >&2
  install -m 644 "$apache_current" "$apache_site"
  apache2ctl configtest || true
  systemctl reload apache2 || true
  exit 1
fi

install -m 644 "$compose_rollback" "$compose_file"
install -m 600 "$env_rollback" "$env_file"

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

restore_current() {
  local restore_failed=0

  if ! install -m 644 "$apache_current" "$apache_site" \
    || ! apache2ctl configtest \
    || ! systemctl reload apache2; then
    echo "Failed to restore the active Apache configuration" >&2
    restore_failed=1
  fi

  if ! install -m 644 "$compose_current" "$compose_file" \
    || ! install -m 600 "$env_current" "$env_file" \
    || ! docker compose --env-file "$env_file" -f "$compose_file" up -d --no-build --force-recreate \
    || ! wait_for_health; then
    echo "Failed to restore the active application deployment" >&2
    restore_failed=1
  fi

  return "$restore_failed"
}

if ! docker compose --env-file "$env_file" -f "$compose_file" config --quiet \
  || ! docker compose --env-file "$env_file" -f "$compose_file" up -d --no-build --force-recreate \
  || ! wait_for_health; then
  echo "Rollback failed; restoring the deployment that was active before rollback" >&2
  restore_current || true
  exit 1
fi

expected_image=$(docker compose --env-file "$env_file" -f "$compose_file" config --images | head -n 1)
running_image=$(docker inspect "$container_name" --format '{{.Config.Image}}')
if [[ $running_image != "$expected_image" ]]; then
  echo "Expected $expected_image, found $running_image" >&2
  restore_current || true
  exit 1
fi

if ! curl --fail --silent --show-error \
  --resolve calendarforge.net:443:127.0.0.1 \
  https://calendarforge.net/ | grep -Fq 'https://calendarforge.net' \
  || ! curl --fail --silent --show-error --output /dev/null \
  --resolve calendarforge.net:443:127.0.0.1 \
  'https://calendarforge.net/api/export/pdf?year=2026&month=8'; then
  echo "Rollback health probe failed; restoring the newer deployment" >&2
  restore_current || true
  exit 1
fi

install -m 644 "$compose_current" "$compose_rollback"
install -m 600 "$env_current" "$env_rollback"
install -m 644 "$apache_current" "$apache_rollback"

echo "Rollback complete: $running_image"
REMOTE_ROLLBACK
