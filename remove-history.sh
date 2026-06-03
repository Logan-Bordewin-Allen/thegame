#!/bin/bash
KEEP="main"

# Create orphan branch and commit
git checkout --orphan new-main
git add -A
git commit -m "Initial commit"
git branch -D $KEEP
git branch -m $KEEP

# Delete other local branches
git branch | grep -v "^* $KEEP" | xargs git branch -D 2>/dev/null

# Force push main (clears remote history)
git push -f origin $KEEP

# Delete other remote branches
git branch -r \
  | grep -v "origin/$KEEP" \
  | grep -v "origin/HEAD" \
  | sed 's/origin\///' \
  | xargs -I {} git push origin --delete {}