@echo off
chcp 65001 > nul
title FOGLEAGUE - Serveur Compétitif Multijoueur DBD
color 0C

echo ===================================================================
echo             🔥 FOGLEAGUE — ARÈNE COMPÉTITIVE DBD 🔥
echo ===================================================================
echo.
echo [1/3] Vérification de l'environnement Node.js...
node -v > nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR : Node.js n'est pas installé sur votre système.
    pause
    exit /b
)

echo [2/3] Compilation du projet de production...
call npm run build

echo [3/3] Démarrage du serveur multijoueur en temps réel...
start http://localhost:3001

echo.
echo ===================================================================
echo  LE SERVEUR EST EN LIGNE ET PRÊT À RECEVOIR DES JOUEURS !
echo.
echo  • Accès sur votre PC    : http://localhost:3001
echo  • Accès sur votre réseau : http://[VOTRE_IP_LOCALE]:3001
echo.
echo  Pour partager avec le monde entier gratuitement :
echo  Exécutez dans un terminal : npx cloudflared tunnel --url http://localhost:3001
echo ===================================================================
echo.

node server/index.js
pause
