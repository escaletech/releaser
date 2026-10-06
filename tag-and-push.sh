#! /bin/bash
set -euo pipefail

# yarn release curls this file on every run. npx may still be serving a cached
# releaser that does `git push origin HEAD <tag>` when the checkout is detached.
# Entering the local branch first makes that push a real refspec.
if [ "$(git rev-parse --abbrev-ref HEAD)" = "HEAD" ]; then
  target=""
  names="$(git for-each-ref --points-at HEAD --format='%(refname:short)' refs/heads)"

  if printf '%s\n' "$names" | grep -qx 'main'; then
    target="main"
  elif printf '%s\n' "$names" | grep -qx 'master'; then
    target="master"
  else
    count="$(printf '%s\n' "$names" | grep -c . || true)"
    if [ "$count" -eq 1 ]; then
      target="$(printf '%s\n' "$names" | grep .)"
    fi
  fi

  if [ -z "${target}" ]; then
    echo "HEAD destacado. Faça checkout do branch antes do release." >&2
    exit 1
  fi

  echo "… HEAD destacado; entrando em ${target}"
  git checkout "${target}"
fi

npx github:escaletech/releaser "$@"
