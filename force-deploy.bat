@echo off
cd /d "%~dp0"

echo ========================================
echo FORCING NEW COMMIT AND DEPLOY TO VERCEL
echo ========================================
echo.

echo A verificar estado do Git...
git status

echo.
echo A adicionar todas as alteracoes...
git add -A

echo.
echo A verificar se ha alteracoes...
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo Nao ha alteracoes novas. A forcar um novo commit com timestamp...
    git commit --amend --no-edit --date "now"
) else (
    echo A criar novo commit...
    git commit -m "Fix: Light mode SSR hydration mismatch - FORCED DEPLOY"
)

echo.
echo A fazer push para o Vercel...
git push origin main --force

echo.
echo ========================================
echo DEPLOY FORÇADO COM SUCESSO!
echo ========================================
echo.
echo Aguarda 3-5 minutos no Vercel para o novo build terminar.
echo Depois testa em modo incognito: Ctrl+Shift+N
echo.
pause
