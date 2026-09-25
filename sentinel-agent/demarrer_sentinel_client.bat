@echo off
title FogLeague Sentinel — Agent Desktop Anti-Triche DBD
color 0C
echo ======================================================================
echo          FOGLEAGUE SENTINEL - APPLICATION DE BUREAU ANTI-TRICHE
echo ======================================================================
echo  Surveillance du processus Dead by Daylight et capture d'ecran automatique
echo  des scores sans aucune action manuelle requise.
echo ======================================================================
echo.
cd /d "%~dp0"
node sentinel_companion.js
pause
