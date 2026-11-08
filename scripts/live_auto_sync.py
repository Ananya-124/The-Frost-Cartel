#!/usr/bin/env python3
"""
FROST CARTEL — Live Auto-Fetch & Auto-Sync Daemon
Automatically polls GitHub for new commits pushed by teammates, pulls them,
and triggers live hot-reloading in the local Vite dev server.

Usage:
  python scripts/live_auto_sync.py [--interval 15] [--branch main]
"""

import argparse
import subprocess
import time
import sys
from datetime import datetime

def run_cmd(cmd):
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        return None

def log(msg, symbol="ℹ️"):
    now = datetime.now().strftime("%H:%M:%S")
    print(f"[{now}] {symbol} {msg}", flush=True)

def main():
    parser = argparse.ArgumentParser(description="Live Git Auto-Fetch & Pull Daemon")
    parser.add_argument("--interval", type=int, default=15, help="Polling interval in seconds (default: 15s)")
    parser.add_argument("--branch", type=str, default="main", help="Target branch (default: main)")
    args = parser.parse_args()

    branch = args.branch
    interval = args.interval

    log(f"Starting Frost Cartel Live Auto-Sync Daemon on branch '{branch}' (Polling every {interval}s)...", "🚀")
    log("Whenever teammates push code to GitHub, changes will be auto-fetched and pulled instantly.", "📡")
    log("Press Ctrl+C to stop auto-sync.", "🛑")

    last_checked_remote_sha = None

    while True:
        try:
            # 1. Fetch remote branch quietly
            fetch_res = subprocess.run(
                ["git", "fetch", "origin", branch],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if fetch_res.returncode != 0:
                time.sleep(interval)
                continue

            # 2. Get local HEAD sha and remote sha
            local_sha = run_cmd(["git", "rev-parse", "HEAD"])
            remote_sha = run_cmd(["git", "rev-parse", f"origin/{branch}"])

            if not local_sha or not remote_sha:
                time.sleep(interval)
                continue

            if local_sha != remote_sha:
                # Check how many commits ahead remote is
                behind_count = run_cmd(["git", "rev-list", f"HEAD..origin/{branch}", "--count"])
                ahead_count = run_cmd(["git", "rev-list", f"origin/{branch}..HEAD", "--count"])

                if behind_count and int(behind_count) > 0:
                    log(f"Detected {behind_count} new commit(s) on origin/{branch} by team members!", "🔔")
                    
                    # Show incoming commits
                    incoming_logs = run_cmd(["git", "log", f"HEAD..origin/{branch}", "--oneline", "-n", "5"])
                    if incoming_logs:
                        for line in incoming_logs.split("\n"):
                            log(f"   ↳ {line}", "📦")

                    # Check for uncommitted working tree changes
                    status_porcelain = run_cmd(["git", "status", "--porcelain"])
                    if status_porcelain:
                        log("Local working tree has unstaged edits. Stashing before auto-pull...", "⚠️")
                        run_cmd(["git", "stash", "push", "-m", "auto-sync-temp-stash"])
                        stashed = True
                    else:
                        stashed = False

                    # Pull / Rebase
                    pull_res = subprocess.run(
                        ["git", "pull", "--rebase", "origin", branch],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True
                    )

                    if pull_res.returncode == 0:
                        log("Successfully pulled latest code! Live server (Vite HMR) updated.", "✅")
                        
                        # If dependencies changed, offer or run npm install
                        diff_files = run_cmd(["git", "diff", "--name-only", f"{local_sha}", "HEAD"])
                        if diff_files and "package.json" in diff_files:
                            log("package.json modified in pulled commits — installing dependencies...", "📦")
                            subprocess.run(["npm", "install"], stdout=subprocess.DEVNULL)
                            log("Dependencies updated successfully.", "✅")
                    else:
                        log(f"Rebase conflict or error: {pull_res.stderr.strip()}", "❌")

                    if stashed:
                        log("Restoring local edits from stash...", "🔄")
                        run_cmd(["git", "stash", "pop"])

            time.sleep(interval)

        except KeyboardInterrupt:
            log("Auto-Sync Daemon stopped by user.", "🛑")
            break
        except Exception as e:
            time.sleep(interval)

if __name__ == "__main__":
    main()
