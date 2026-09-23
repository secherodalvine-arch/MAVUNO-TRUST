@echo off
echo Starting MavunoTrust Backend and Frontend...
start "MavunoTrust Backend (Port 8000)" cmd /k "cd /d %~dp0backend && npm run dev"
start "MavunoTrust Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both servers are starting up!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
