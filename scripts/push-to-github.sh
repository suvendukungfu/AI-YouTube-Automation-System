#!/bin/bash
set -e

REPO_URL="https://${GITHUB_TOKEN}@github.com/suvendukungfu/AI-YouTube-Automation-System.git"
WORK_DIR="/home/runner/workspace"
TEMP_DIR="/tmp/github-push-$$"

echo "Setting up temp git repo..."
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

git init -b main
git config user.email "replit-agent@replit.com"
git config user.name "Replit Agent"
git remote add origin "$REPO_URL"

echo "Copying source files (excluding node_modules, dist, etc.)..."

# Copy top-level config files
for f in package.json pnpm-workspace.yaml tsconfig.json tsconfig.base.json replit.md; do
  [ -f "$WORK_DIR/$f" ] && cp "$WORK_DIR/$f" "$TEMP_DIR/$f"
done

# Copy lib directory (source only, no node_modules)
mkdir -p "$TEMP_DIR/lib"
for pkg in api-spec api-client-react api-zod db; do
  if [ -d "$WORK_DIR/lib/$pkg" ]; then
    mkdir -p "$TEMP_DIR/lib/$pkg"
    for item in "$WORK_DIR/lib/$pkg"/*; do
      name=$(basename "$item")
      [ "$name" = "node_modules" ] && continue
      cp -r "$item" "$TEMP_DIR/lib/$pkg/$name"
    done
  fi
done

# Copy artifacts (source only)
mkdir -p "$TEMP_DIR/artifacts"
for artifact in api-server yt-automation; do
  if [ -d "$WORK_DIR/artifacts/$artifact" ]; then
    mkdir -p "$TEMP_DIR/artifacts/$artifact"
    for item in "$WORK_DIR/artifacts/$artifact"/*; do
      name=$(basename "$item")
      [ "$name" = "node_modules" ] && continue
      [ "$name" = "dist" ] && continue
      [ "$name" = ".vite" ] && continue
      cp -r "$item" "$TEMP_DIR/artifacts/$artifact/$name"
    done
  fi
done

# Copy scripts directory
if [ -d "$WORK_DIR/scripts" ]; then
  mkdir -p "$TEMP_DIR/scripts"
  for item in "$WORK_DIR/scripts"/*; do
    name=$(basename "$item")
    [ "$name" = "node_modules" ] && continue
    cp -r "$item" "$TEMP_DIR/scripts/$name"
  done
fi

echo "Files copied. Adding to git..."
cd "$TEMP_DIR"
git add -A

echo "Committing..."
git commit -m "feat: YouTube Automation System - full AI pipeline dashboard

- Dashboard with daily Rs50,000 target tracking and 30-day earnings chart
- Channel management for 4 automated YouTube channels
- Video pipeline: idea -> scripting -> voiceover -> editing -> scheduled -> published
- Niche research with CPM data, competition level, earning potential
- AI Setup Guide: ChatGPT scripts, ElevenLabs voiceover, Pictory video,
  Canva AI thumbnails, n8n/Zapier auto-upload, VidIQ SEO
- Upload schedule view
- REST API: Express + PostgreSQL + Drizzle ORM
- Recharts earnings visualization

Zero recording. Zero editing. Zero burnout."

echo "Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "SUCCESS! Code pushed to https://github.com/suvendukungfu/AI-YouTube-Automation-System"

cd /
rm -rf "$TEMP_DIR"
