start "Frontend Main" /D "./src" /MIN tsc --watch
start "Backend" /D "./backend/src" /MIN tsc --watch
start "Frontend online game" /D "./game/src" /MIN tsc --watch