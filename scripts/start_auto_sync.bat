@echo off
title Frost Cartel - Live Auto-Sync Daemon
echo ========================================================
echo   FROST CARTEL - LIVE AUTO-FETCH & SYNC DAEMON
echo ========================================================
echo  Listening for GitHub pushes on 'origin/main'...
echo  When teammates push, changes will auto-pull instantly!
echo ========================================================
python scripts/live_auto_sync.py --interval 15 --branch main
pause
