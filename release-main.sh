#!/usr/bin/env bash
set -euo pipefail

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "[ERROR] Remote 'origin' is not configured. Add it first, e.g.:"
  echo "  git remote add origin <repo-url>"
  exit 1
fi

current_branch="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$current_branch" != "work" && "$current_branch" != "main" ]]; then
  echo "[ERROR] Run this from 'work' or 'main' branch. Current: $current_branch"
  exit 1
fi

if git show-ref --verify --quiet refs/heads/main; then
  git switch main
else
  git switch -c main
fi

git merge --ff-only work
git push origin main

echo "[OK] 'main' updated and pushed from local 'work'."
