@echo off
echo Serving scoreboard overlay at http://localhost:8080
echo.
echo Overlay:  http://localhost:8080/index.html
echo Control:  http://localhost:8080/control.html
echo.
echo Press Ctrl+C to stop.
echo.
cd /d "%~dp0"
python -m http.server 8080
