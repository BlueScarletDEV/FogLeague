@echo off
cd /d "%~dp0"
cls
echo ==============================================================
echo        FOGLEAGUE - PUBLICATION VERS GITHUB
echo ==============================================================
echo.
echo Envoi du code vers https://github.com/BlueScarletDEV/fogleague.git...
echo.
git branch -M main
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ==============================================================
    echo SUCCES : Le projet est publie sur GitHub !
    echo ==============================================================
) else (
    echo [ERREUR] Verifiez la fenetre de connexion GitHub qui s'affiche.
)
echo.
pause
