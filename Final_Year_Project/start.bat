@echo off
setlocal enabledelayedexpansion

echo.
echo === Docker Compose Quick Start ===
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo Please update .env with your API keys:
    echo   - GROQ_API_KEY
    echo   - TAVILY_API_KEY
    echo   - MONGO_URI (if not using default)
    echo.
)

REM Build images
echo Building Docker images...
docker-compose build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)

REM Start services
echo Starting services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo Failed to start services!
    exit /b 1
)

echo Services started!
echo.

REM Wait for services to be ready
echo Waiting for services to be ready...
timeout /t 10 /nobreak

REM Check service health
echo.
echo Checking service health...
echo.

REM Check Backend
echo Checking Backend...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   Backend: Running ^
) else (
    echo   Backend: Not responding X
)

REM Check Ollama
echo Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo   Ollama: Running
) else (
    echo   Ollama: Not responding X
)

echo.
echo === Setup Complete ===
echo.
echo Access your applications at:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Ollama API: http://localhost:11434
echo.
echo Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop services: docker-compose down
echo   Rebuild: docker-compose up -d --build
echo.
