#!/usr/bin/env bash
# Helper script to push SignBridge to GitHub
# Usage: ./push-to-github.sh <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>

set -e

REPO_URL="github.com/janani2006123-dotcom/signbridge.git"

if [ -z "$1" ]; then
  echo "========================================================"
  echo "SignBridge GitHub Push Helper"
  echo "========================================================"
  echo "Usage: ./push-to-github.sh <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>"
  echo ""
  echo "To generate a Personal Access Token (Classic):"
  echo "1. Go to GitHub -> Settings -> Developer Settings -> Personal access tokens -> Tokens (classic)"
  echo "2. Generate new token (classic) with 'repo' scope."
  echo "3. Run: ./push-to-github.sh ghp_yourPersonalAccessTokenHere"
  echo "========================================================"
  exit 1
fi

TOKEN="$1"
git push "https://${TOKEN}@${REPO_URL}" main

echo ""
echo "✅ Successfully pushed SignBridge to https://${REPO_URL} on branch 'main'!"
