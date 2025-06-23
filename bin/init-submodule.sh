#!/usr/bin/env bash

# Move to the repo root
cd "$(git rev-parse --show-toplevel)"

# Ensure we're not in a detached HEAD or bare repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a valid Git working tree."
  exit 1
fi

# Remove existing submodule entry (if any)
if git config --file .gitmodules --get-regexp "^submodule\.vault\." >/dev/null 2>&1; then
  echo "Removing existing submodule config..."
  git submodule deinit -f vault || true
  git rm -f vault || true
  rm -rf .git/modules/content
fi

# Clean local content dir if needed
rm -rf content

# Add the submodule
echo "Adding submodule..."
git submodule add -f "https://Stan15:${GITHUB_VAULT_REPO_CLONE_TOKEN}@github.com/Stan15/vault.git" vault
