#!/bin/sh
# Publish the committed state of `master` to the public repository, as one
# anonymous commit on a separate history (branch `public` → remote `public`, branch main).
# The personal history (authors, messages) never leaves this repository.
#
#   sh scripts/publish.sh ["message"]
#
# One-time setup: remote `public` = git@github-stitchnook:StitchNook/stitchnook.git
# (SSH host alias using the StitchNook key, see ~/.ssh/config).
set -eu

NAME='StitchNook'
EMAIL='357013975+StitchNook@users.noreply.github.com'
SOURCE='master'
MESSAGE="${1:-Release $(date +%Y-%m-%d)}"

cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes: commit them on $SOURCE first (only committed files are published)." >&2
  exit 1
fi

# Guard: nothing personal in the published files. The words to look for are kept
# in this clone's local git config (never published):
#   git config publish.forbidden 'word1|word2|…'
FORBIDDEN=$(git config publish.forbidden || true)
if [ -z "$FORBIDDEN" ]; then
  echo "Set the words that must never be published first: git config publish.forbidden 'word1|word2'" >&2
  exit 1
fi
if git grep -I -n -i -E "$FORBIDDEN" "$SOURCE" -- .; then
  echo "Personal data found in the files above: nothing published." >&2
  exit 1
fi

TREE=$(git rev-parse "$SOURCE^{tree}")
if git rev-parse -q --verify refs/heads/public >/dev/null; then
  PARENT=$(git rev-parse refs/heads/public)
  if [ "$(git rev-parse "$PARENT^{tree}")" = "$TREE" ]; then
    echo "Already published: nothing changed since the last release."
    exit 0
  fi
  PARENT_ARG="-p $PARENT"
else
  PARENT_ARG=''
fi

# shellcheck disable=SC2086
COMMIT=$(GIT_AUTHOR_NAME="$NAME" GIT_AUTHOR_EMAIL="$EMAIL" GIT_COMMITTER_NAME="$NAME" GIT_COMMITTER_EMAIL="$EMAIL" \
  git -c commit.gpgsign=false commit-tree "$TREE" $PARENT_ARG -m "$MESSAGE")

# Guard: every commit of the public history is anonymous.
if git log --format='%an %ae %cn %ce' "$COMMIT" | grep -v -x "$NAME $EMAIL $NAME $EMAIL" >/dev/null; then
  echo "Unexpected author in the public history: nothing published." >&2
  exit 1
fi

git update-ref refs/heads/public "$COMMIT"
git push public public:main
echo "Published $COMMIT — the site deploys in a minute or two (Actions tab)."
