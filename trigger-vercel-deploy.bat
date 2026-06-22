@echo off
cd /d "%~dp0"

echo ========================================
echo FORCING VERCEL DEPLOY WITH EMPTY COMMIT
echo ========================================
echo.

echo A criar commit vazio para forcar deploy...
git commit --allow-empty -m "Trigger new Vercel deploy - Light mode fix"

echo.
echo A fazer push...
git push origin main

echo.
echo ========================================
echo PUSH COM SUCESSO!
echo ========================================
echo.
echo O Vercel deve iniciar um novo build automaticamente.
echo Vai a https://vercel.com/dashboard para verificar.
echo.
pause
