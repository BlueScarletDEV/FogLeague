@echo off
chcp 65001 > nul
title FogLeague - Publication vers GitHub
color 0B

echo ==============================================================
echo        🔥 FOGLEAGUE — PUBLICATION VERS GITHUB
echo ==============================================================
echo.

git status > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Depot Git non initialise.
    pause
    exit /b 1
)

git remote get-url origin > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Votre depot GitHub n'est pas encore relie !
    echo.
    echo 1. Creez un depot vide sur : https://github.com/new
    echo    (Nommez-le par exemple 'fogleague', en mode Public ou Prive)
    echo 2. Copiez l'URL du depot (ex: https://github.com/votre-pseudo/fogleague.git)
    echo.
    set /p REPO_URL="Collez l'URL GitHub ici : "
    
    if "%REPO_URL%"=="" (
        echo [ANNULE] Aucune URL fournie.
        pause
        exit /b 1
    )
    
    git remote add origin %REPO_URL%
    echo.
    echo [OK] Lien GitHub associe avec succes !
)

echo.
echo Envoi du code securise vers GitHub (branche main)...
git branch -M main
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ==============================================================
    echo ✅ PROJET PUBLIE AVEC SUCCES SUR GITHUB !
    echo ==============================================================
    echo Vos fichiers sont maintenant disponibles sur votre compte.
    echo Vous pouvez desormais connecter Render en 1 clic pour l'Option B !
) else (
    echo.
    echo [ATTENTION] Verifiez vos identifiants GitHub ou les permissions du depot.
)

echo.
pause
